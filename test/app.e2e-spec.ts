import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('status', 'success');
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('version');
      });
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('status', 'healthy');
        expect(res.body).toHaveProperty('uptime');
      });
  });

  it('/api/v1/health/redis (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/redis')
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('isConnected');
        expect(res.body).toHaveProperty('responseTime');
        expect(res.body).toHaveProperty('timestamp');
        // Status can be 'ok' or 'error' depending on Redis availability
        expect(['ok', 'error']).toContain(res.body.status);
        expect(typeof res.body.isConnected).toBe('boolean');
      });
  });
});
