import { Test, TestingModule } from '@nestjs/testing';
import { WebpageController } from './webpage.controller';

describe('WebpageController', () => {
  let controller: WebpageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebpageController],
    }).compile();

    controller = module.get<WebpageController>(WebpageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
