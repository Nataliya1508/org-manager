import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Org-manager')
    .setDescription('Documentation REST API')
    .setVersion('1.0.0')
    .addTag('API endpoints related to backend functionality')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/api/docs', app, document);
  const port = Number(configService.get<number>('PORT'));
  await app.listen(port);
}
bootstrap();
