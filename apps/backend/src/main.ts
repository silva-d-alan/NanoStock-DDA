import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seed } from './seed'
import { configurarApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API rodando em http://localhost:${port}/v1`);
  await seed(app).catch((e) => console.error('❌ Falha no seed:', e));
}

bootstrap();