import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { WebpageDTO } from './webpage.dto';
import puppeteer, { Browser } from 'puppeteer';
import { JSDOM } from 'jsdom';
import * as createDOMPurify from 'dompurify';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ConfigService } from '@nestjs/config';
import { MilvusService } from '../milvus/milvus.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { HttpService } from '@nestjs/axios';
const TAG = 'WEBPAGE_SERVICE';

@Injectable()
export class WebpageService {
  private browser: Browser;
  private DOMPurify = createDOMPurify(new JSDOM('').window);
  constructor(
    private readonly configService: ConfigService,
    private readonly milvusService: MilvusService,
    private readonly embeddingService: EmbeddingService,
    private readonly httpService: HttpService,
  ) {}

  crawl(webpageDto: WebpageDTO) {
    if (
      this.configService.get('CHECK_PASS') == 'true' &&
      webpageDto.pass != this.configService.get('PASS')
    ) {
      throw new UnauthorizedException();
    }
    console.log(TAG, 'Starting crawl', webpageDto.url);
    this.crawlPage(webpageDto.url, webpageDto.url, {}, true);
    return `Strated crawling ${webpageDto.url}`;
  }

  private async crawlPage(
    baseURL: string,
    currentURL: string,
    pages = {},
    isParent = false,
  ) {
    try {
      if (isParent) this.browser = await puppeteer.launch({ headless: 'new' });
      const baseURLObj = new URL(baseURL);
      const currentURLObj = new URL(currentURL);

      if (baseURLObj.hostname != currentURLObj.hostname) return;

      const normalizedCurrentURL = this.normalizeUrl(currentURL);
      if (pages[normalizedCurrentURL]) return;
      pages[normalizedCurrentURL] = true;

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
      for (const nextURL of nextURLs) {
        await this.crawlPage(baseURL, nextURL, pages);
      }
      if (isParent) {
        await this.browser.close();
        console.log(TAG, 'Completed crawling', baseURL);
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
    const page = await this.browser.newPage();
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
    await page.close();
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
