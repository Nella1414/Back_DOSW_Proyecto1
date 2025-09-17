import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

console.log('JWT_SECRET desde process.env:', process.env.JWT_SECRET);
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('SIRHA - API')
    .setDescription('Sistema de Reasignación de Horarios Académicos (SIRHA)')
    .setVersion('1.0')
    .addTag('SIRHA')
    .addBearerAuth() 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();
