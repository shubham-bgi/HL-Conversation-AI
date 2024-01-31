import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import * as uuid from 'uuid';
const TAG = 'MILVUS_SERVICE';

@Injectable()
export class MilvusService {
  private milvusClient = new MilvusClient({
    address: this.configService.get('MILVUS_HOST'),
    ssl: false,
    username: this.configService.get('MILVUS_USERNAME'),
    password: this.configService.get('MILVUS_PASSWORD'),
  });
  private collectionName = this.configService.get('MILVUS_COLLECTION_NAME');
  constructor(private readonly configService: ConfigService) {}

  async insertData(vectors, texts, link) {
    if (!texts.length) return;
    const rows = texts.map((text, i) => {
      return {
        id: uuid.v4(),
        link,
        text,
        vector: vectors[i],
      };
    });
    this.milvusClient
      .insert({
        collection_name: this.collectionName,
        fields_data: rows,
      })
      .then((res) => {
        if (res.status.code != 0) {
          console.log(TAG, 'Error inserting data: ', res);
          return;
        }
        console.log(TAG, 'Number of rows inserted:', res.insert_cnt);
      })
      .catch((e) => {
        console.log(TAG, e);
      });
  }

  private async loadCollection() {
    console.log(TAG, 'Loading Collection...');
    await this.milvusClient.loadCollectionSync({
      collection_name: this.collectionName,
    });
  }

  async vectorQuery(vector) {
    await this.loadCollection();
    const res = await this.milvusClient.search({
      collection_name: this.collectionName,
      vector,
      limit: 3,
      output_fields: ['link', 'text', 'id'],
    });
    if (res.status.code != 0) throw res;
    return res;
  }
}
