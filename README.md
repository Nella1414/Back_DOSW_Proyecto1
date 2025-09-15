"# Back_DOSW_Proyecto1" 

# SIRHA - Sistema de Reasignación de Horarios Académicos

## Objetivo del Proyecto
SIRHA tiene como objetivo **facilitar la gestión de solicitudes de cambio de materia y grupo** por parte de los estudiantes, con trazabilidad, priorización y control de capacidad.  
El sistema brinda a **profesores y decanaturas** las herramientas necesarias para evaluar y aprobar dichas solicitudes de manera eficiente, transparente y dentro de los lineamientos institucionales.

---

## Estructura del Proyecto

SIRHA/
│── dist/ # Archivos compilados de TypeScript a JavaScript
│── node_modules/ # Dependencias del proyecto
│── src/ # Código fuente principal
│ ├── admin/ # Módulo de administración (gestión global del sistema)
│ ├── auth/ # Módulo de autenticación y control de roles
│ ├── common/ # Código compartido (enums, interfaces, roles)
│ ├── groups/ # Gestión de grupos y cupos de materias
│ ├── requests/ # Gestión de solicitudes de cambio (núcleo del sistema)
│ ├── subjects/ # Gestión de materias y su información asociada
│ ├── users/ # Gestión de usuarios (estudiantes, decanaturas, admins)
│ ├── app.module.ts # Módulo raíz de la aplicación
│ ├── main.ts # Punto de entrada de la aplicación
│── test/ # Pruebas unitarias y de integración
│── .env # Variables de entorno (configuración sensible)
│── .gitignore # Exclusiones de Git
│── .prettierrc # Configuración de Prettier (formato de código)
│── eslint.config.mjs # Configuración de ESLint (estilo y calidad de código)
│── nest-cli.json # Configuración de Nest CLI
│── package.json # Dependencias, scripts y metadatos del proyecto
│── tsconfig.json # Configuración de TypeScript
│── tsconfig.build.json # Configuración de build en producción
│── README.md # Documentación del proyecto (este es el genrado por Nest Js)


---

## 📦 Breve especificación de cada módulo

- **Admin**  
  Permite la gestión de configuraciones generales, cupos especiales y supervisión global del sistema.

- **Auth**  
  Maneja autenticación y autorización mediante credenciales institucionales. Define roles: `estudiante`, `decanatura`, `admin`.

- **Common**  
  Contiene código reutilizable: enums (roles, estados), interfaces comunes, validadores.

- **Groups**  
  Administración de grupos: cupos, profesores, horarios. Permite verificar disponibilidad y evitar sobrecupo.

- **Requests**  
  Núcleo del sistema: creación, seguimiento, priorización y aprobación/rechazo de solicitudes de cambio de materia/grupo.

- **Subjects**  
  Gestión de materias: registro, asignación de grupos, control de carga 
  académica.

- **Users**  
  Manejo de usuarios: estudiantes, profesores y decanaturas, junto con su 
  información básica.

---

##  Ventajas de usar NestJS

- **Arquitectura modular** → Permite separar responsabilidades en módulos 
independientes (admin, auth, requests, etc.).
- **Escalabilidad** → Ideal para sistemas académicos que pueden crecer en 
funcionalidades.
- **Soporte para TypeScript** → Mayor seguridad en el código y reducción de 
errores.
- **Integración con bases de datos** → Fácil integración con TypeORM, Prisma u 
otros ORM.
- **Inyección de dependencias** → Facilita pruebas unitarias y mantenimiento.
- **Ecosistema robusto** → Cuenta con CLI, herramientas de testing y soporte 
para microservicios si el sistema escala.

---

##  Funcionalidades clave (según especificaciones del proyecto)

- Registro y autenticación de estudiantes.
- Creación y gestión de solicitudes de cambio de materia/grupo.
- Priorización automática de solicitudes.
- Gestión de cupos y grupos con alertas de capacidad.
- Rol de decanatura para aprobar, rechazar o solicitar información adicional.
- Generación de reportes y estadísticas de cambios académicos.

---

##  Cómo ejecutar el proyecto

1. Clonar el repositorio:
   ```bash
   git clone <url-repo>
   cd SIRHA
   nes run start:dev (Así lo ejecutamos como developers)