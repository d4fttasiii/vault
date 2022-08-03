import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppConfig } from './core/models/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors();
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  const document = SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle('Vault API')
    .setVersion('1.0')
    .build());

  SwaggerModule.setup('swagger', app, document);

  const configService = app.get<ConfigService>(ConfigService);
  const { port } = configService.get<AppConfig>('app');

  await app.listen(port, () => console.log(`🔒 Vault API started on port: ${port}`));
}
bootstrap();
