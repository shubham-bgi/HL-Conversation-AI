import { Module } from '@nestjs/common';
import { WebpageController } from './webpage.controller';
import { WebpageService } from './webpage.service';
import { MilvusModule } from '../milvus/milvus.module';
import { EmbeddingModule } from '../embedding/embedding.module';

@Module({
  imports: [MilvusModule, EmbeddingModule],
  controllers: [WebpageController],
  providers: [WebpageService],
})
export class WebpageModule {}
