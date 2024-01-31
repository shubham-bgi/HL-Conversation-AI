import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { WebpageModule } from './modules/webpage/webpage.module';
import { MilvusService } from './modules/milvus/milvus.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WebpageModule,
  ],
  controllers: [AppController],
  providers: [AppService, MilvusService],
})
export class AppModule {}
