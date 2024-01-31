import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import { config } from 'dotenv';
config();
const milvusClient = new MilvusClient({
  address: process.env.MILVUS_HOST,
  ssl: false,
  username: process.env.MILVUS_USERNAME,
  password: process.env.PASSWORD,
});
init();
async function init() {
  const params = {
    collection_name: process.env.MILVUS_COLLECTION_NAME,
    description: 'Webpage search',
    fields: [
      {
        name: 'id',
        data_type: DataType.VarChar,
        max_length: 36,
        is_primary_key: true,
      },
      {
        name: 'link',
        data_type: DataType.VarChar,
        max_length: 256,
        description: 'Link from where text is crawled from',
      },
      {
        name: 'text',
        data_type: DataType.VarChar,
        max_length: 1024,
        description: 'Actual text',
      },
      {
        name: 'vector',
        description: 'vector of the text',
        data_type: DataType.FloatVector,
        dim: 1024,
      },
    ],
  };
  await milvusClient.createCollection(params);
  await milvusClient.createIndex({
    collection_name: 'webpage',
    index_name: 'idx_default',
    field_name: 'vector',
    extra_params: {
      index_type: 'IVF_FLAT',
      metric_type: 'L2',
      params: '{"nlist":"128"}',
    },
  });
}
