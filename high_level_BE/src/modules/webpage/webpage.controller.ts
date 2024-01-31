import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WebpageService } from './webpage.service';
import { WebpageDTO } from './webpage.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('webpage')
@Controller('webpage')
export class WebpageController {
  constructor(private readonly webpageService: WebpageService) {}

  @Post('')
  crawl(@Body() webpage: WebpageDTO) {
    return this.webpageService.crawl(webpage);
  }

  @ApiQuery({
    name: 'query',
    example: 'What is node?',
    required: true,
  })
  @Get('')
  get(@Query('query') query: string) {
    query = query.toLowerCase();
    return this.webpageService.fetchTopThree(query);
  }
}
