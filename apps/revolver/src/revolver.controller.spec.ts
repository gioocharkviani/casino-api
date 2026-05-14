import { Test, TestingModule } from '@nestjs/testing';
import { RevolverController } from './revolver.controller';
import { RevolverService } from './revolver.service';

describe('RevolverController', () => {
  let revolverController: RevolverController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RevolverController],
      providers: [RevolverService],
    }).compile();

    revolverController = app.get<RevolverController>(RevolverController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(revolverController.getHello()).toBe('Hello World!');
    });
  });
});
