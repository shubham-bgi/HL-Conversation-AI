import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { WebpageDTO } from './webpage.dto';
import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';
import * as createDOMPurify from 'dompurify';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ConfigService } from '@nestjs/config';
import { MilvusService } from '../milvus/milvus.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { HttpService } from '@nestjs/axios';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
const TAG = 'WEBPAGE_SERVICE';
export const WEBPAGE_QUEUE = 'WEBPAGE_QUEUE';
interface Item {
  currentURL: string;
  baseURL: string;
}
@Processor(WEBPAGE_QUEUE)
@Injectable()
export class WebpageService {
  private DOMPurify = createDOMPurify(new JSDOM('').window);
  constructor(
    private readonly configService: ConfigService,
    private readonly milvusService: MilvusService,
    private readonly embeddingService: EmbeddingService,
    private readonly httpService: HttpService,
    @InjectQueue(WEBPAGE_QUEUE)
    private readonly webpageQueue: Queue<Item>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async startCrawl(webpageDto: WebpageDTO) {
    if (
      this.configService.get('CHECK_PASS') == 'true' &&
      webpageDto.pass != this.configService.get('PASS')
    ) {
      throw new UnauthorizedException();
    }
    console.log(TAG, 'Starting crawl', webpageDto.url);
    const item = {
      baseURL: webpageDto.url,
      currentURL: webpageDto.url,
    };
    try {
      await this.enQueuePage(item, true);
      return `Strated crawling ${webpageDto.url}`;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async enQueuePage(item: Item, throwError = false) {
    try {
      //Return if not the same host
      const baseURLObj = new URL(item.baseURL);
      const currentURLObj = new URL(item.currentURL);
      if (baseURLObj.hostname != currentURLObj.hostname) return;

      // Return if already proccessed
      const normalizedCurrentURL = this.normalizeUrl(item.currentURL);
      const redisKey = `proccessed.${normalizedCurrentURL}`;
      const alreadyProcessed = await this.cacheManager.get(redisKey);
      if (alreadyProcessed) return;
      await this.cacheManager.set(redisKey, true);

      console.log(TAG, `Enqueuing`, JSON.stringify(item));
      await this.webpageQueue.add(item);
    } catch (err) {
      console.error(TAG, 'Failed to enqueue', item, 'due to', err);
      if (throwError) throw err;
    }
  }

  @Process()
  async crawlPage(job: Job<Item>) {
    const { baseURL, currentURL } = job.data;
    try {
      const baseURLObj = new URL(baseURL);
      const currentURLObj = new URL(currentURL);
      console.log(TAG, 'Actively crawiling', currentURL);
      const response = await this.httpService.axiosRef.head(currentURL);
      const contentType = response?.headers?.['content-type'];
      if (
        typeof contentType == 'string' &&
        !contentType.includes('text/html')
      ) {
        throw new Error(`Not a html response, content type ${contentType}`);
      }
      await job.progress(10);
      const htmlBody = await this.getHTMLBody(currentURL);
      await this.processAndSave(htmlBody, currentURLObj.href, job);
      await job.progress(80);

      const nextURLs = this.getURLsFromHTML(htmlBody, baseURLObj.origin);
      console.log(TAG, `${currentURL}'s next urls count: ${nextURLs?.length}`);
      for (let i = 0; i < nextURLs.length; i++) {
        const percentDone = Math.floor((i / nextURLs.length) * 20);
        await job.progress(80 + percentDone);
        await this.enQueuePage({ baseURL, currentURL: nextURLs[i] });
      }
    } catch (e) {
      console.error(
        TAG,
        'Error in crawling :',
        e?.message,
        ', on page',
        currentURL,
      );
      console.error(typeof e == 'object' ? JSON.stringify(e) : e);
    }
  }

  private async getHTMLBody(currentURL: string) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const response = await page.goto(currentURL, {
      waitUntil: this.configService.get('WAIT_UNTIL') || 'domcontentloaded',
    });
    if (response.status() > 399) {
      throw new Error(`Failed with error code ${response.status()}`);
    }
    const contentType = response.headers()['content-type'];
    if (typeof contentType !== 'string' || !contentType.includes('text/html')) {
      throw new Error(`Not a html response, content type ${contentType}`);
    }
    const content = await page.content();
    await browser.close();
    return content;
  }

  private getURLsFromHTML(htmlBody, baseURLOrigin) {
    const urls = [];
    const dom = new JSDOM(htmlBody);
    const links = dom.window.document.querySelectorAll('a');
    links.forEach((link) => {
      if (link.href[0] === '/') {
        urls.push(baseURLOrigin + link.href);
      } else {
        urls.push(link.href);
      }
    });
    return urls;
  }

  private normalizeUrl(url: string) {
    const urlObj = new URL(url);
    const hostPath = urlObj.hostname + urlObj.pathname;
    if (hostPath.length > 0 && hostPath.slice(-1) == '/') {
      return hostPath.slice(0, -1);
    }
    return hostPath;
  }

  private async processAndSave(htmlBody: string, currentURL: string, job: Job) {
    //remove all html tags
    await job.progress(20);
    let text = this.DOMPurify.sanitize(htmlBody, { ALLOWED_TAGS: [] });

    //remove email and url
    const clean = this.configService.get('FULLY_CLEAN_TEXT') != 'false';
    text = clean ? this.removeURLsAndEmails(text) : text;

    //split text into chunks
    await job.progress(25);
    const chunkSize = this.configService.get('CHUNK_SIZE') || 1000;
    let chunks = await this.splitIntoChunks([text], +chunkSize);

    //remove all white spaces
    if (clean) chunks = chunks.map((chunk) => chunk.replace(/\s+/g, ' '));

    //fetch embeddings
    await job.progress(30);
    const chunksLowerCase = chunks.map((chunk) => chunk.toLowerCase());
    const embeddings =
      await this.embeddingService.getEmbeddings(chunksLowerCase);

    //save
    await job.progress(60);
    await this.milvusService.insertData(embeddings, chunks, currentURL);
  }

  removeURLsAndEmails(str: string) {
    const URLRegEx =
      /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
    const emailRegEx = /([a-z0-9+._-]+@[a-z0-9+._-]+\.[a-z0-9+_-]+)/gi;
    return str.replace(emailRegEx, '').replace(URLRegEx, '');
  }

  async splitIntoChunks(str: string[], chunkSize: number) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap: Math.floor(chunkSize / 10),
    });
    const documents = await splitter.createDocuments(str);
    return documents.map((x) => x.pageContent);
  }

  async fetchTopThree(query: string) {
    try {
      console.log(TAG, 'Got a query:', query);
      const q = [query.toLowerCase()];
      const embedding = await this.embeddingService.getEmbeddings(q);
      const response = await this.milvusService.vectorQuery(embedding[0]);
      console.info(
        TAG,
        'Get request results for query:',
        query,
        '\n Response:',
        response,
      );
      return response.results;
    } catch (e) {
      console.error(TAG, 'Error happened fetching item', e);
      throw new InternalServerErrorException();
    }
  }
}
