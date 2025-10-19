import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

/**
 * Bootstrap function for the SIRHA (Student Information and Registration Hub API)
 *
 * Initializes and configures the NestJS application with comprehensive
 * middleware setup, security configurations, and professional API documentation.
 */
async function bootstrap() {
  // Create application logger
  const logger = new Logger('Bootstrap');

  // Initialize NestJS application
  const app = await NestFactory.create(AppModule);

  logger.log('SIRHA Application starting...');

  // ===== SWAGGER API DOCUMENTATION CONFIGURATION =====

  /**
   * Professional Swagger/OpenAPI Configuration
   *
   * Provides comprehensive API documentation with professional metadata,
   * security definitions, and detailed endpoint information for developers.
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SIRHA - Student Information & Registration Hub API')
    .setDescription(
      `
# SIRHA API - Academic Management System

A comprehensive REST API for academic student information management and course registration built with **NestJS**, **MongoDB**, and **TypeScript**.

## **Key Features**

### **Authentication & Security**
- **JWT Authentication**: Secure token-based authentication system
- **Google OAuth Integration**: Single Sign-On with Google accounts
- **Role-Based Access Control**: Granular permissions (ADMIN, DEAN, STUDENT)
- **Rate Limiting**: API protection against abuse (100 requests/minute)
- **Input Validation**: Comprehensive data validation and sanitization

### **Student Management**
- **Complete CRUD Operations**: Create, read, update, and delete student records
- **Academic Program Association**: Link students to their academic programs
- **Progress Tracking**: Monitor semester advancement and academic standing
- **Data Integrity**: Maintain referential integrity across all operations

### **Academic Administration**
- **Course Catalog Management**: Comprehensive course information system
- **Enrollment Processing**: Handle student course registrations and waitlists
- **Change Request Management**: Process enrollment modifications
- **Academic Progress Monitoring**: Track student advancement through programs

### **Reporting & Analytics**
- **Comprehensive Reports**: Academic analytics and administrative insights
- **Real-time Data**: Up-to-date information for decision making
- **Export Capabilities**: Data export in various formats

## **Authentication**

This API uses **Bearer Token** authentication. Include your JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

### **Getting Started**
1. Register a new account using \`POST /auth/register\`
2. Login to receive your JWT token using \`POST /auth/login\`
3. Include the token in all subsequent requests

### **Google OAuth**
- Use \`GET /auth/google\` to initiate Google Sign-In
- Automatic account creation for new Google users
- Seamless integration with existing accounts

## **Rate Limiting**

API requests are limited to **100 requests per minute** per IP address to ensure fair usage and system stability.

## **Architecture**

Built with modern technologies and best practices:
- **Framework**: NestJS 11.x with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Google OAuth 2.0
- **Validation**: class-validator with comprehensive rules
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Rate limiting, RBAC, input sanitization

## **Response Format**

All API responses follow consistent JSON format with proper HTTP status codes and error handling.

## **Support**

For API support and documentation issues, please refer to the comprehensive endpoint documentation below.
    `,
    )
    .setVersion('1.0.2')
    .setContact('Development Team', '', '')
    .addServer('http://localhost:3000', 'Development Server')
    .addTag(
      'Authentication',
      'User authentication, registration, and Google OAuth',
    )
    .addTag(
      'Student Management',
      'Complete student CRUD operations and profile management',
    )
    .addTag(
      'User Management',
      'User account administration and role management',
    )
    .addTag('Faculty', 'Faculty and department management')
    .addTag('Programs', 'Academic program definitions and curriculum')
    .addTag('Courses', 'Course catalog and academic content management')
    .addTag('Schedules', 'Class scheduling and timetable management')
    .addTag('Enrollments', 'Student course enrollment and registration')
    .addTag('Waitlists', 'Course waitlist management and processing')
    .addTag('Academic Progress', 'Academic progress monitoring and tracking')
    .addTag('Change Requests', 'Enrollment change requests and modifications')
    .addTag('Reports', 'Academic analytics and administrative reporting')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT Token',
        description: 'Enter your JWT token received from login endpoint',
        in: 'header',
      },
      'JWT-auth',
    )
    .addSecurityRequirements('JWT-auth')
    .build();

  // Generate Swagger document
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // Setup Swagger UI with custom options
  SwaggerModule.setup('doc', app, document, {
    customSiteTitle: 'SIRHA API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info .title { color: #ff0000ff; font-size: 2.5rem; }
      .swagger-ui .scheme-container { background: #ffffffff; padding: 20px; border-radius: 5px; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
  });

  logger.log('Swagger documentation available at: http://localhost:3000/doc');

  // ===== GLOBAL MIDDLEWARE CONFIGURATION =====

  /**
   * Global Exception Filter for Validation Errors
   *
   * Converts class-validator errors into detailed 422 responses
   * with field-specific error information for better frontend handling.
   */
  app.useGlobalFilters(new ValidationExceptionFilter());

  /**
   * Global Validation Pipe
   *
   * Provides comprehensive input validation, transformation, and sanitization
   * for all incoming requests to ensure data integrity and security.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that do not have decorators
      forbidNonWhitelisted: true, // Throw error when non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true, // Enable automatic type conversion
      },
      disableErrorMessages: false, // Always show detailed errors for 422 responses
      stopAtFirstError: false, // Collect all validation errors
    }),
  );

  /**
   * CORS Configuration
   *
   * Enables cross-origin requests from the frontend application
   * with secure defaults and credential support.
   */
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ===== APPLICATION STARTUP =====

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`SIRHA API Server running on: http://localhost:${port}`);
  logger.log(`API Documentation: http://localhost:${port}/doc`);
  logger.log(
    `CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`,
  );

  logger.log('Application bootstrap completed successfully');
}

// Start the application with error handling
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start SIRHA application:', error);
  process.exit(1);
});
