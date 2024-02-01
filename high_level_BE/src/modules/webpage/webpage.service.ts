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
    } catch (err) {
      throw new InternalServerErrorException();
    }
    return `Strated crawling ${webpageDto.url}`;
  }

  async enQueuePage(item: Item, getError = false) {
    const bullJobOptions = {
      removeOnComplete: true,
      removeOnFail: 100,
    };
    try {
      console.log(`Enqueuing`, item);
      await this.webpageQueue.add(item, bullJobOptions);
    } catch (err) {
      console.error('Failed to enqueue', item, 'due to', err);
      if (getError) throw err;
    }
  }

  @Process()
  async crawlPage(job: Job<Item>) {
    const { baseURL, currentURL } = job.data;
    try {
      const baseURLObj = new URL(baseURL);
      const currentURLObj = new URL(currentURL);

      if (baseURLObj.hostname != currentURLObj.hostname) return;

      const normalizedCurrentURL = this.normalizeUrl(currentURL);
      const redisKey = `proccessed.${normalizedCurrentURL}`;
      const alreadyProcessed = await this.cacheManager.get(redisKey);
      if (alreadyProcessed) return;
      await this.cacheManager.set(redisKey, true);

      console.log(TAG, 'Actively crawiling', currentURL);
      const response = await this.httpService.axiosRef.head(currentURL);
      const contentType = response?.headers?.['content-type'];
      if (
        typeof contentType == 'string' &&
        !contentType.includes('text/html')
      ) {
        throw new Error(`Not a html response, content type ${contentType}`);
      }
      const htmlBody = await this.getHTMLBody(currentURL);
      await this.processAndSave(htmlBody, currentURLObj.href);

      const nextURLs = this.getURLsFromHTML(htmlBody, baseURLObj.origin);
      console.log(`${currentURL}'s next urls count: ${nextURLs?.length}`);
      for (const nextURL of nextURLs) {
        await this.enQueuePage({ baseURL, currentURL: nextURL });
      }
    } catch (e) {
      console.error(
        TAG,
        'Error in crawling :',
        e?.message,
        ', on page',
        currentURL,
      );
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

  private async processAndSave(htmlBody: string, currentURL: string) {
    let text = this.DOMPurify.sanitize(htmlBody, { ALLOWED_TAGS: [] });
    if (this.configService.get('FULLY_CLEAN_TEXT') != 'false') {
      text = text
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(/([a-z0-9+._-]+@[a-z0-9+._-]+\.[a-z0-9+_-]+)/g, '')
        .replace(
          /(http|https|ftp|ssh):([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g,
          '',
        );
    }
    const chunkSize = this.configService.get('CHUNK_SIZE') || 1000;
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap: Math.floor(chunkSize / 10),
    });
    const documents = await splitter.createDocuments([text]);
    const textChunks = documents.map((x) => x.pageContent);
    const embeddings = await this.embeddingService.getEmbeddings(textChunks);
    await this.milvusService.insertData(embeddings, textChunks, currentURL);
  }

  async fetchTopThree(query: string) {
    try {
      console.log(TAG, 'Got a query:', query);
      const embedding = await this.embeddingService.getEmbeddings([query]);
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
