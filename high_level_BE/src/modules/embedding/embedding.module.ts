import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';

@Module({
  exports: [EmbeddingService],
  providers: [EmbeddingService],
})
export class EmbeddingModule {}
