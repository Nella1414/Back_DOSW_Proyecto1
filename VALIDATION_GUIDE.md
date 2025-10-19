# Guía de Validaciones Server - SIRHA API

## 📋 Resumen

Esta implementación cumple con los requisitos de **FEAT-018 US-0069** para validaciones detalladas en el servidor con respuestas 422 específicas por campo.

## ✅ Criterios de Aceptación Cumplidos

- [x] **Errores 422 incluyen detalles por campo**
- [x] **Mensajes son claros y accionables**
- [x] **Validaciones cubren todos los casos edge**

## 🛠️ Componentes Implementados

### 1. Filtro de Excepciones de Validación
**Archivo:** `src/common/filters/validation-exception.filter.ts`

Convierte errores de `class-validator` en respuestas 422 estructuradas:

```json
{
  "statusCode": 422,
  "error": "Validation Failed",
  "message": "Los datos enviados contienen errores de validación",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/students",
  "errors": [
    {
      "field": "code",
      "message": "El código debe tener formato válido (ej: EST001, PROG2024)",
      "value": "abc",
      "constraint": "isStudentCode"
    }
  ]
}
```

### 2. Validadores Personalizados
**Archivo:** `src/common/validators/custom-validators.ts`

#### Validadores Disponibles:

- **`@IsStudentCode()`** - Códigos de estudiante (formato: EST001, PROG2024)
- **`@IsValidName()`** - Nombres con letras, espacios y acentos
- **`@IsStrongPassword()`** - Contraseñas seguras (8+ chars, mayús, minús, número)
- **`@IsMongoId()`** - ObjectIds válidos de MongoDB

### 3. DTOs Mejorados

#### CreateStudentDto
```typescript
@IsStudentCode({ message: 'El código debe tener formato válido (ej: EST001, PROG2024)' })
code: string;

@IsValidName({ message: 'El primer nombre solo puede contener letras, espacios y acentos' })
firstName: string;

@IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
email?: string;

@Matches(/^\+?[1-9]\d{1,14}$/, { message: 'El teléfono debe tener formato válido (ej: +57 300 123 4567)' })
phone?: string;
```

#### CreateCourseDto
```typescript
@Matches(/^[A-Z]{2,4}[0-9]{3,4}$/, {
  message: 'El código debe seguir el formato: 2-4 letras + 3-4 números (ej: CS101, MATH1001)',
})
code: string;

@ArrayMaxSize(10, { message: 'No puede tener más de 10 prerrequisitos' })
@Matches(/^[A-Z]{2,4}[0-9]{3,4}$/, { each: true, message: 'Cada prerrequisito debe tener formato válido (ej: CS101)' })
prerequisites?: string[];
```

#### LoginAuthDto & RegisterAuthDto
```typescript
@IsEmail({}, { message: 'Debe ser un correo electrónico válido (ej: usuario@dominio.com)' })
email: string;

@MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
password: string;

@IsValidName({ message: 'El nombre solo puede contener letras, espacios y acentos' })
name: string;
```

## 🧪 Ejemplos de Uso

### Controlador de Ejemplos
**Archivo:** `src/common/examples/validation-examples.controller.ts`

Proporciona endpoints para probar las validaciones:

- `POST /validation-examples/student` - Prueba validaciones de estudiantes
- `POST /validation-examples/course` - Prueba validaciones de cursos  
- `POST /validation-examples/login` - Prueba validaciones de login

### Casos de Prueba

#### 1. Estudiante Inválido
```bash
curl -X POST http://localhost:3000/validation-examples/student \
  -H "Content-Type: application/json" \
  -d '{
    "code": "abc",
    "firstName": "Juan123",
    "lastName": "",
    "programId": "123",
    "email": "correo-malo",
    "phone": "123abc",
    "currentSemester": 15
  }'
```

**Respuesta 422:**
```json
{
  "statusCode": 422,
  "error": "Validation Failed",
  "message": "Los datos enviados contienen errores de validación",
  "errors": [
    {
      "field": "code",
      "message": "El código debe tener formato válido (ej: EST001, PROG2024)",
      "value": "abc",
      "constraint": "isStudentCode"
    },
    {
      "field": "firstName", 
      "message": "El primer nombre solo puede contener letras, espacios y acentos",
      "value": "Juan123",
      "constraint": "isValidName"
    },
    {
      "field": "lastName",
      "message": "El apellido es obligatorio",
      "value": "",
      "constraint": "isNotEmpty"
    },
    {
      "field": "programId",
      "message": "El ID del programa debe ser un ObjectId válido de MongoDB",
      "value": "123",
      "constraint": "isMongoId"
    },
    {
      "field": "email",
      "message": "Debe ser un correo electrónico válido",
      "value": "correo-malo",
      "constraint": "isEmail"
    },
    {
      "field": "phone",
      "message": "El teléfono debe tener formato válido (ej: +57 300 123 4567)",
      "value": "123abc",
      "constraint": "matches"
    },
    {
      "field": "currentSemester",
      "message": "El semestre no puede ser mayor a 12",
      "value": 15,
      "constraint": "max"
    }
  ]
}
```

#### 2. Curso Inválido
```bash
curl -X POST http://localhost:3000/validation-examples/course \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CS",
    "name": "CS",
    "description": "Curso",
    "credits": 15,
    "prerequisites": ["ABC"],
    "academicLevel": 10
  }'
```

**Respuesta 422:**
```json
{
  "statusCode": 422,
  "error": "Validation Failed", 
  "message": "Los datos enviados contienen errores de validación",
  "errors": [
    {
      "field": "code",
      "message": "El código debe tener entre 5 y 10 caracteres",
      "value": "CS",
      "constraint": "length"
    },
    {
      "field": "name",
      "message": "El nombre debe tener entre 5 y 100 caracteres",
      "value": "CS",
      "constraint": "length"
    },
    {
      "field": "description",
      "message": "La descripción debe tener entre 20 y 1000 caracteres",
      "value": "Curso",
      "constraint": "length"
    },
    {
      "field": "credits",
      "message": "El curso no puede tener más de 10 créditos",
      "value": 15,
      "constraint": "max"
    },
    {
      "field": "prerequisites",
      "message": "Cada prerrequisito debe tener formato válido (ej: CS101)",
      "value": ["ABC"],
      "constraint": "matches"
    },
    {
      "field": "academicLevel",
      "message": "El nivel académico no puede ser mayor a 8",
      "value": 10,
      "constraint": "max"
    }
  ]
}
```

## 🔧 Configuración

### 1. Activar el Filtro Global
En `main.ts`:
```typescript
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

app.useGlobalFilters(new ValidationExceptionFilter());
```

### 2. Configurar ValidationPipe
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: false, // Mostrar errores detallados
    stopAtFirstError: false, // Recopilar todos los errores
  }),
);
```

## 📚 Documentación Swagger

Todos los endpoints incluyen documentación completa en Swagger con:

- Ejemplos de datos válidos e inválidos
- Descripción de respuestas 422
- Esquemas de error detallados
- Casos de uso específicos

**Acceso:** `http://localhost:3000/doc`

## 🎯 Beneficios para el Frontend

### 1. Errores Específicos por Campo
```javascript
// Frontend puede mapear errores directamente a campos
const fieldErrors = response.data.errors.reduce((acc, error) => {
  acc[error.field] = error.message;
  return acc;
}, {});

// Mostrar error específico en cada campo
setFieldError('code', fieldErrors.code);
setFieldError('firstName', fieldErrors.firstName);
```

### 2. Mensajes Accionables
- Mensajes en español claro
- Ejemplos de formato correcto
- Información específica sobre qué corregir

### 3. Validación Consistente
- Mismo formato de respuesta en toda la API
- Validaciones reutilizables entre módulos
- Manejo uniforme de errores

## 🚀 Casos Edge Cubiertos

### Validaciones de Formato
- Códigos de estudiante/curso con regex específico
- Emails con formato válido
- Teléfonos con formato internacional
- URLs válidas para imágenes

### Validaciones de Rango
- Créditos de curso (1-10)
- Semestre académico (1-12)
- Nivel académico (1-8)
- Longitud de arrays (prerrequisitos, objetivos)

### Validaciones de Contenido
- Nombres solo con letras y acentos
- ObjectIds válidos de MongoDB
- Contraseñas con requisitos de seguridad
- Arrays con límites mínimos y máximos

### Validaciones Anidadas
- Objetos dentro de objetos
- Arrays de objetos complejos
- Validaciones condicionales

## 📝 Próximos Pasos

1. **Integrar en más módulos** - Aplicar el patrón a todos los DTOs
2. **Validaciones asíncronas** - Verificar unicidad en base de datos
3. **Validaciones condicionales** - Reglas que dependen de otros campos
4. **Internacionalización** - Soporte para múltiples idiomas
5. **Métricas de validación** - Tracking de errores más comunes

## 🔍 Testing

Para probar las validaciones:

1. **Iniciar servidor:** `npm run start:dev`
2. **Acceder a Swagger:** `http://localhost:3000/doc`
3. **Probar endpoints:** Sección "Validation Examples"
4. **Verificar respuestas 422** con datos inválidos

---

**Implementación completada por:** Equipo de Desarrollo SIRHA  
**Fecha:** Enero 2024  
**Versión:** 1.0.0