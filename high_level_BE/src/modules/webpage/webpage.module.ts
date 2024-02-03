import { Module } from '@nestjs/common';
import { WebpageController } from './webpage.controller';
import { WEBPAGE_QUEUE, WebpageService } from './webpage.service';
import { MilvusModule } from '../milvus/milvus.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullAdapter } from '@bull-board/api/bullAdapter';

@Module({
  imports: [
    MilvusModule,
    EmbeddingModule,
    HttpModule,
    BullModule.registerQueue({
      name: WEBPAGE_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
      },
    }),
    BullBoardModule.forFeature({
      name: WEBPAGE_QUEUE,
      adapter: BullAdapter,
    }),
  ],
  controllers: [WebpageController],
  providers: [WebpageService],
})
export class WebpageModule {}
