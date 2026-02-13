import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigService } from '@/common/config/config.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string): string | number => {
        const config: Record<string, string | number> = {
          PORT: 3000,
          NODE_ENV: 'test',
        };
        return config[key];
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
