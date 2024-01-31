import { Module } from '@nestjs/common';
import { MilvusService } from './milvus.service';

@Module({
  exports: [MilvusService],
  providers: [MilvusService],
})
export class MilvusModule {}
