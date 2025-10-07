# SIRHA - Student Information and Registration Hub API

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)

A comprehensive REST API for academic student information management and course registration system built with NestJS, MongoDB, and TypeScript.

## **Project Overview**

SIRHA is a modern academic management system designed to handle:

- **Student Information Management** - Complete student profiles and academic records
- **Course Registration** - Enrollment processes and waitlist management
- **Academic Programs** - Program definitions and curriculum management
- **User Authentication** - JWT-based auth with Google OAuth integration
- **Role-Based Access Control** - Granular permissions for different user types
- **Academic Progress Tracking** - Monitoring student advancement
- **Reporting System** - Comprehensive academic analytics

## **Architecture Overview**

### **Technology Stack**

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | NestJS 11.x | Modern Node.js framework with TypeScript |
| **Database** | MongoDB | NoSQL document database |
| **ODM** | Mongoose | MongoDB object modeling |
| **Authentication** | JWT + Google OAuth | Secure token-based authentication |
| **Validation** | class-validator | Input validation and sanitization |
| **Documentation** | Swagger/OpenAPI | Automatic API documentation |
| **Testing** | Jest | Unit and integration testing |
| **Security** | Rate Limiting + RBAC | API protection and access control |

### **Modular Architecture**

```
src/
├── auth/                 # Authentication & Authorization
├── users/               # User Management
├── roles/               # Role & Permission System
├── students/            # Student Information Management
├── courses/             # Course Catalog
├── enrollments/         # Course Registration
├── faculty/             # Faculty/Department Management
├── programs/            # Academic Programs
├── reports/             # Analytics & Reporting
└── main.ts             # Application Bootstrap
```

## **Quick Start**

### **Prerequisites**

- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone [your-repository-url]
   cd sirha-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/sirha

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=2h

   # Application Configuration
   FRONTEND_URL=http://localhost:3001
   PORT=3000

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

6. **Access the API**
   - **API Base URL**: `http://localhost:3000`
   - **Swagger Documentation**: `http://localhost:3000/doc`

## **Authentication & Authorization**

### **Authentication Methods**

1. **Email/Password Authentication**
   - Traditional login with email and password
   - Password hashing with bcrypt (10 salt rounds)
   - JWT token generation for session management

2. **Google OAuth Integration**
   - Single Sign-On with Google accounts
   - Automatic user creation for new Google users
   - Seamless integration with existing accounts

### **Authorization System**

The API uses a sophisticated **Role-Based Access Control (RBAC)** system with granular permissions:

#### **Default Roles**

| Role | Description | Default Permissions |
|------|-------------|-------------------|
| **ADMIN** | System Administrator | All permissions |
| **DEAN** | Academic Administrator | User/Course/Grade management, Reports |
| **STUDENT** | Student User | Read-only access to own data |

#### **Permission Categories**

- **User Management**: `CREATE_USER`, `READ_USER`, `UPDATE_USER`, `DELETE_USER`
- **Course Management**: `CREATE_COURSE`, `READ_COURSE`, `UPDATE_COURSE`, `DELETE_COURSE`
- **Enrollment Management**: `CREATE_ENROLLMENT`, `READ_ENROLLMENT`, etc.
- **Grade Management**: `CREATE_GRADE`, `READ_GRADE`, `UPDATE_GRADE`, `DELETE_GRADE`
- **System Administration**: `MANAGE_SYSTEM`, `VIEW_LOGS`, `VIEW_REPORTS`

#### **Authorization Decorators**

```typescript
// Require specific roles
@Roles(RoleName.ADMIN, RoleName.DEAN)

// Require specific permissions
@RequirePermissions(Permission.CREATE_USER, Permission.DELETE_USER)

// Public endpoint (no authentication)
@Public()

// Convenience decorators
@AdminOnly()
@AdminOrDean()
```

## **API Endpoints**

### **Authentication Endpoints**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/auth/register` | Register new user | Public |
| `POST` | `/auth/login` | User login | Public |
| `GET` | `/auth/google` | Google OAuth login | Public |
| `PUT` | `/auth/user/:id/roles` | Update user roles | Admin Only |

### **Student Management** *Fully Implemented*

| Method | Endpoint | Description | Required Permission |
|--------|----------|-------------|-------------------|
| `POST` | `/students` | Create student | `CREATE_USER` |
| `GET` | `/students` | List all students | `READ_USER` |
| `GET` | `/students/:id` | Get student by ID | `READ_USER` |
| `PATCH` | `/students/:id` | Update student | `UPDATE_USER` |
| `DELETE` | `/students/:id` | Delete student | `DELETE_USER` |

### **User Management**

| Method | Endpoint | Description | Required Permission |
|--------|----------|-------------|-------------------|
| `POST` | `/users` | Create user | `CREATE_USER` |
| `GET` | `/users` | List users | Admin Only |
| `GET` | `/users/:id` | Get user details | `READ_USER` |
| `PATCH` | `/users/:id` | Update user | `UPDATE_USER` |
| `DELETE` | `/users/:id` | Delete user | `DELETE_USER` |

### ** Schedules Management** *Fully Implemented - Sprint 2*

| Method | Endpoint | Description | Required Permission |
|--------|----------|-------------|-------------------|
| `GET` | `/schedules/current` | Get current semester schedule | STUDENT (own), ADMIN/FACULTY (any) |
| `GET` | `/schedules/historical` | List closed academic periods | STUDENT (own), ADMIN/FACULTY (any) |
| `GET` | `/schedules/historical/:periodId` | Get historical schedule for specific period | STUDENT (own), ADMIN/FACULTY (any) |
| `GET` | `/schedules/traffic-light` | Get academic performance indicator | STUDENT (own), ADMIN/FACULTY (any) |

### ** Academic Periods Management** *Fully Implemented - Sprint 2*

| Method | Endpoint | Description | Required Permission |
|--------|----------|-------------|-------------------|
| `POST` | `/academic-periods` | Create academic period | ADMIN Only |
| `GET` | `/academic-periods` | List periods (with pagination/filters) | Authenticated Users |
| `GET` | `/academic-periods/:id` | Get specific academic period | Authenticated Users |
| `PATCH` | `/academic-periods/:id` | Update academic period | ADMIN Only |
| `DELETE` | `/academic-periods/:id` | Delete academic period | ADMIN Only |
| `PATCH` | `/academic-periods/:id/activate` | Set period as active | ADMIN Only |
| `GET` | `/academic-periods/active` | Get current active period | Authenticated Users |
| `GET` | `/academic-periods/allowing-changes` | Get periods allowing change requests | Authenticated Users |
| `GET` | `/academic-periods/open-enrollment` | Get periods with open enrollment | Authenticated Users |
| `GET` | `/academic-periods/:id/enrollment-status` | Check enrollment status for period | Authenticated Users |
| `GET` | `/academic-periods/:id/change-requests-status` | Check change requests status | Authenticated Users |

### **Other Modules** *Template Structure*

The following endpoints exist but need implementation:
- `/courses` - Course catalog management
- `/enrollments` - Student enrollment processes
- `/faculty` - Faculty and department management
- `/programs` - Academic program definitions
- `/reports` - Academic reporting and analytics

## **Security Features**

### **API Protection**

1. **Rate Limiting**
   - 100 requests per minute per IP address
   - Prevents API abuse and DDoS attacks
   - Configurable thresholds

2. **JWT Security**
   - Secure token-based authentication
   - Configurable expiration times
   - Automatic token validation on protected routes

3. **Input Validation**
   - Automatic request validation with class-validator
   - Type checking and sanitization
   - Custom validation rules with meaningful error messages

4. **Error Handling**
   - Secure error responses (no sensitive data exposure)
   - Structured logging for debugging
   - Graceful error recovery

### **Data Protection**

- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Secrets**: Environment-based configuration
- **Database Security**: Parameterized queries prevent injection
- **CORS Configuration**: Controlled cross-origin access

## **Testing**

### **Running Tests**

```bash
# Unit tests
npm test

# Watch mode for development
npm run test:watch

# Test coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e
```

### **Test Structure**

```
src/
├── auth/
│   ├── auth.service.spec.ts     # Authentication service tests
│   └── auth.controller.spec.ts  # Authentication controller tests
├── students/
│   ├── students.service.spec.ts
│   └── students.controller.spec.ts
└── ...
```

### **Testing Features**

- **Unit Tests**: Service and controller testing with mocks
- **Integration Tests**: End-to-end API testing
- **Coverage Reports**: Code coverage analysis
- **Automated Testing**: CI/CD integration ready

## **Development Guide**

### **Project Structure Explained**

```
src/
├── auth/                        # Authentication Module
│   ├── decorators/             # Custom authorization decorators
│   ├── guards/                 # Security guards (JWT, Roles)
│   ├── dto/                    # Data transfer objects
│   ├── auth.service.ts         # Authentication business logic
│   ├── auth.controller.ts      # Authentication endpoints
│   └── auth.module.ts          # Module configuration
│
├── students/                    # Student Management Module
│   ├── dto/                    # Request/response DTOs
│   ├── entities/               # Database entities
│   ├── students.service.ts     # Business logic
│   ├── students.controller.ts  # API endpoints
│   └── students.module.ts      # Module configuration
│
├── roles/                       # Role & Permission System
│   ├── entities/               # Role and permission definitions
│   ├── roles.service.ts        # Permission validation logic
│   └── roles.module.ts         # Module configuration
│
└── main.ts                     # Application bootstrap
```

### **Adding New Features**

1. **Generate Module**
   ```bash
   nest generate module feature-name
   nest generate service feature-name
   nest generate controller feature-name
   ```

2. **Create Entity**
   ```typescript
   // src/feature-name/entities/feature.entity.ts
   @Schema({ timestamps: true })
   export class Feature {
     @Prop({ required: true })
     name: string;
   }
   ```

3. **Create DTOs**
   ```typescript
   // src/feature-name/dto/create-feature.dto.ts
   export class CreateFeatureDto {
     @ApiProperty()
     @IsString()
     @IsNotEmpty()
     name: string;
   }
   ```

4. **Implement Service**
   ```typescript
   @Injectable()
   export class FeatureService {
     constructor(
       @InjectModel(Feature.name)
       private featureModel: Model<FeatureDocument>
     ) {}
   }
   ```

5. **Add Authorization**
   ```typescript
   @Controller('features')
   export class FeatureController {
     @RequirePermissions(Permission.CREATE_FEATURE)
     @Post()
     create(@Body() dto: CreateFeatureDto) {
       return this.featureService.create(dto);
     }
   }
   ```

### **Code Style Guidelines**

- **TypeScript**: Strict typing enabled
- **ESLint**: Automated linting with Prettier
- **Comments**: JSDoc for public methods and classes
- **Naming**: Descriptive variable and function names
- **Error Handling**: Comprehensive try-catch blocks
- **Validation**: Input validation on all endpoints

### **Using the API**

1. **Register a User**
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "SecurePassword123",
       "displayName": "System Administrator"
     }'
   ```

2. **Login and Get Token**
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "SecurePassword123"
     }'
   ```

3. **Use Protected Endpoints**
   ```bash
   curl -X GET http://localhost:3000/students \
     -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
   ```

## **Deployment**

### **Production Build**

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### **Environment Configuration**

Production environment variables:
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db/sirha
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
```

## **Contributing**

### **Development Workflow**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper documentation
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### **Code Review Guidelines**

- All tests must pass
- Code coverage should not decrease
- Documentation must be updated
- Follow existing code style
- Add meaningful commit messages



## **Team**

- **Backend Developer**: LogDev
- **Project Type**: Academic Management System
- **Built With**: Love and lots of coffee (Marianella,Alejandra, Carlos, Sebastian, Daniel) =)

## **Support**

- **Issues**: hold on =)
- **Documentation**: [API Docs](http://localhost:3000/doc)
- **Email**: hold on =)

---

**SIRHA** - Simplifying academic management, one API call at a time.
