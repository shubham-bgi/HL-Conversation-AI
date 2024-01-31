import { Injectable } from '@nestjs/common';
import '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { HfInference } from '@huggingface/inference';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TAG = 'EMBEDDINGS_SERVICE';

@Injectable()
export class EmbeddingService {
  constructor(private readonly configService: ConfigService) {}
  private hf = new HfInference(this.configService.get('HF_ACCESS_TOKEN'));
  private async loadEmbeddingModel() {
    const model = await use.load();
    return model;
  }

  async getEmbeddings(sentences: string[]) {
    if (this.configService.get('USE_HF') == 'true') {
      return await this.hf.featureExtraction({
        model: this.configService.get('HF_MODEL'),
        inputs: sentences,
      });
    }
    const model = await this.loadEmbeddingModel();
    const embeddings = await model.embed(sentences);

    // embeddings.print(true);

    // Convert the TensorFlow tensor to a plain JavaScript array
    return await embeddings.array();
  }
}
