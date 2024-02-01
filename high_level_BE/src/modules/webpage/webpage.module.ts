import { Module } from '@nestjs/common';
import { WebpageController } from './webpage.controller';
import { WEBPAGE_QUEUE, WebpageService } from './webpage.service';
import { MilvusModule } from '../milvus/milvus.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    MilvusModule,
    EmbeddingModule,
    HttpModule,
    BullModule.registerQueue({
      name: WEBPAGE_QUEUE,
    }),
  ],
  controllers: [WebpageController],
  providers: [WebpageService],
})
export class WebpageModule {}
