# 🎯 GUÍA COMPLETA DE TESTING - EXPERIENCIA DE ESTUDIANTE

## 🚀 PREPARACIÓN DEL ENTORNO

### 1. Configurar el entorno de prueba
```bash
# En la raíz del proyecto
node scripts/setup-test-environment.js
```

### 2. Iniciar el servidor
```bash
npm run start:dev
```

### 3. Verificar que el servidor está corriendo
Visita: http://localhost:3000/api
Deberías ver la documentación de Swagger.

---

## 👤 CREDENCIALES DE PRUEBA

```
📧 Email: juan.perez@estudiante.edu
🎒 Código Estudiante: SIS2024001
🏫 Facultad: Ingeniería
🎓 Programa: Ingeniería de Sistemas
📅 Semestre Actual: 3
```

---

## 🔐 PASO 1: AUTENTICACIÓN

### Obtener Token JWT
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@estudiante.edu",
    "password": "password123"
  }'
```

**Respuesta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "juan.perez@estudiante.edu",
    "displayName": "Juan Pérez",
    "roles": ["STUDENT"]
  }
}
```

⚠️ **IMPORTANTE**: Guarda el `access_token` para usarlo en las siguientes requests.

---

## 📅 PASO 2: VER MI HORARIO ACTUAL

### Request
```bash
curl -X GET http://localhost:3000/students/SIS2024001/schedule \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Respuesta esperada
```json
{
  "studentId": "SIS2024001",
  "studentName": "Juan Pérez",
  "currentSemester": 3,
  "period": "2024-1",
  "schedule": [
    {
      "dayOfWeek": 1,
      "dayName": "Lunes",
      "classes": [
        {
          "courseCode": "MAT101",
          "courseName": "Cálculo Diferencial",
          "groupNumber": "A",
          "startTime": "08:00",
          "endTime": "10:00",
          "room": "LAB-1"
        },
        {
          "courseCode": "PRG101",
          "courseName": "Programación I",
          "groupNumber": "A",
          "startTime": "14:00",
          "endTime": "16:00",
          "room": "LAB-2"
        }
      ]
    },
    {
      "dayOfWeek": 3,
      "dayName": "Miércoles",
      "classes": [
        {
          "courseCode": "MAT101",
          "courseName": "Cálculo Diferencial",
          "groupNumber": "A",
          "startTime": "08:00",
          "endTime": "10:00",
          "room": "LAB-1"
        },
        {
          "courseCode": "PRG101",
          "courseName": "Programación I",
          "groupNumber": "A",
          "startTime": "14:00",
          "endTime": "16:00",
          "room": "LAB-2"
        }
      ]
    }
  ]
}
```

### ✅ ¿Qué verificar?
- [x] Solo ves TUS materias inscritas
- [x] Horarios organizados por día
- [x] Información completa (sala, horario, grupo)
- [x] Solo periodo actual (2024-1)

---

## 📊 PASO 3: VER MI HISTORIAL ACADÉMICO (SEMÁFORO)

### Request
```bash
curl -X GET http://localhost:3000/students/SIS2024001/academic-history \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Respuesta esperada
```json
{
  "studentId": "SIS2024001",
  "currentSemester": 3,
  "academicHistory": {
    "currentCourses": [
      {
        "periodCode": "2024-1",
        "courseCode": "MAT101",
        "courseName": "Cálculo Diferencial",
        "credits": 4,
        "status": "ENROLLED",
        "color": "yellow"
      },
      {
        "periodCode": "2024-1",
        "courseCode": "PRG101",
        "courseName": "Programación I",
        "credits": 4,
        "status": "ENROLLED",
        "color": "yellow"
      }
    ],
    "passedCourses": [
      {
        "periodCode": "2023-2",
        "courseCode": "FIS101",
        "courseName": "Física I",
        "credits": 4,
        "grade": 4.2,
        "status": "PASSED",
        "color": "green"
      }
    ],
    "failedCourses": [
      {
        "periodCode": "2023-2",
        "courseCode": "MAT201",
        "courseName": "Cálculo Integral",
        "credits": 4,
        "grade": 2.1,
        "status": "FAILED",
        "color": "red"
      }
    ]
  }
}
```

### ✅ ¿Qué verificar?
- [x] 🟡 **Amarillo**: Materias actuales (ENROLLED)
- [x] 🟢 **Verde**: Materias aprobadas con nota
- [x] 🔴 **Rojo**: Materias reprobadas con nota
- [x] Separación clara por estado académico

---

## 🔄 PASO 4: VER GRUPOS DISPONIBLES PARA CAMBIO

Primero, veamos qué grupos están disponibles para hacer un cambio:

### Request
```bash
curl -X GET "http://localhost:3000/course-groups/available" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Respuesta esperada
```json
[
  {
    "groupId": "673f...",
    "courseCode": "FIS101",
    "courseName": "Física I",
    "groupNumber": "B",
    "maxStudents": 25,
    "currentEnrollments": 0,
    "availableSpots": 25,
    "schedule": [
      {
        "dayOfWeek": 2,
        "dayName": "Martes",
        "startTime": "08:00",
        "endTime": "10:00",
        "room": "LAB-FIS"
      },
      {
        "dayOfWeek": 4,
        "dayName": "Jueves",
        "startTime": "08:00",
        "endTime": "10:00",
        "room": "LAB-FIS"
      }
    ]
  }
]
```

---

## 📝 PASO 5: SOLICITAR CAMBIO DE MATERIA

### Escenario 1: Cambio VÁLIDO (Sin conflictos)
Vamos a intentar cambiar de Programación I Grupo A a Programación I Grupo B:

```bash
curl -X POST http://localhost:3000/change-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "sourceGroupId": "ID_DEL_GRUPO_PROGRAMACION_A",
    "targetGroupId": "ID_DEL_GRUPO_PROGRAMACION_B",
    "reason": "Conflicto con horario de trabajo"
  }'
```

### Respuesta esperada (ÉXITO)
```json
{
  "id": "673f...",
  "radicado": "CR-202412-0001",
  "studentId": "SIS2024001",
  "studentName": "Juan Pérez",
  "programName": "Ingeniería de Sistemas",
  "periodCode": "2024-1",
  "sourceCourse": {
    "courseCode": "PRG101",
    "courseName": "Programación I",
    "groupNumber": "A",
    "schedule": [...]
  },
  "targetCourse": {
    "courseCode": "PRG101",
    "courseName": "Programación I",
    "groupNumber": "B",
    "schedule": [...]
  },
  "state": "PENDING",
  "priority": 1,
  "createdAt": "2024-12-27T..."
}
```

### ✅ ¿Qué verificar?
- [x] Solicitud creada con radicado único
- [x] Estado inicial: PENDING
- [x] Información completa de grupos origen/destino
- [x] Validaciones pasaron correctamente

---

### Escenario 2: Cambio INVÁLIDO (Con conflictos)
Ahora intentemos un cambio que debería fallar por cruce de horarios:

```bash
curl -X POST http://localhost:3000/change-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "sourceGroupId": "ID_DEL_GRUPO_PROGRAMACION_A",
    "targetGroupId": "ID_DEL_GRUPO_FISICA_A",
    "reason": "Quiero cambiar a Física"
  }'
```

### Respuesta esperada (ERROR)
```json
{
  "statusCode": 400,
  "message": "Solicitud de cambio inválida",
  "errors": [
    "Conflicto de horario: Lunes de 15:00 a 17:00",
    "Conflicto de horario: Miércoles de 15:00 a 17:00"
  ],
  "warnings": []
}
```

### ✅ ¿Qué verificar?
- [x] Sistema detecta cruces de horario automáticamente
- [x] Mensaje de error claro y específico
- [x] Solicitud NO se crea cuando hay conflictos

---

## 👀 PASO 6: VER MIS SOLICITUDES

### Request
```bash
curl -X GET http://localhost:3000/change-requests/student/my-requests \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Respuesta esperada
```json
{
  "message": "Feature coming soon",
  "studentCode": "SIS2024001"
}
```

*Nota: Esta funcionalidad está marcada como TODO y se implementaría en la siguiente iteración.*

---

## 🔧 PASO 7: TESTEAR VALIDACIONES ESPECÍFICAS

### Test 1: Solicitar cambio sin autenticación
```bash
curl -X POST http://localhost:3000/change-requests \
  -H "Content-Type: application/json" \
  -d '{
    "sourceGroupId": "test",
    "targetGroupId": "test",
    "reason": "test"
  }'
```

**Resultado esperado:** `401 Unauthorized`

### Test 2: Intentar ver horario de otro estudiante
```bash
curl -X GET http://localhost:3000/students/OTRO_CODIGO/schedule \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Resultado esperado:** `403 Forbidden` o solo tu información

### Test 3: Solicitar cambio cuando no hay periodo activo
```bash
# Primero desactivar periodo (requiere ADMIN)
# Luego intentar solicitud de cambio
```

**Resultado esperado:** Error indicando que no hay periodo activo

---

## 🎯 ESCENARIOS DE TESTING COMPLETOS

### ✅ Funcionalidades que DEBES poder hacer:
1. **Ver tu horario personal** ✓
2. **Ver tu historial académico con colores** ✓
3. **Solicitar cambios válidos** ✓
4. **Recibir errores en cambios inválidos** ✓
5. **Ver información detallada de solicitudes** ✓

### ❌ Funcionalidades que NO debes poder hacer:
1. **Ver horarios de otros estudiantes** ✗
2. **Crear/modificar grupos de materias** ✗ (Solo ADMIN)
3. **Aprobar/rechazar solicitudes** ✗ (Solo DEAN)
4. **Modificar datos de otros estudiantes** ✗

---

## 🐛 POSIBLES PROBLEMAS Y SOLUCIONES

### Problema: Token JWT inválido
**Síntoma:** `401 Unauthorized`
**Solución:** Vuelve a hacer login y obtén un nuevo token

### Problema: IDs no existen
**Síntoma:** `404 Not Found`
**Solución:** Usa los IDs que retorna el seeder o consulta los endpoints de listado

### Problema: Servidor no responde
**Síntoma:** Connection refused
**Solución:** Verifica que el servidor esté corriendo en puerto 3000

### Problema: Base de datos vacía
**Síntoma:** Respuestas vacías
**Solución:** Ejecuta nuevamente el seeder

---

## 📊 CHECKLIST DE TESTING

### Autenticación ✅
- [ ] Login exitoso
- [ ] Token JWT válido
- [ ] Acceso denegado sin token

### Horarios ✅
- [ ] Ver horario personal
- [ ] Solo materias inscritas
- [ ] Información completa (días, horas, salas)

### Historial Académico ✅
- [ ] Materias actuales (amarillo)
- [ ] Materias aprobadas (verde) con nota
- [ ] Materias reprobadas (rojo) con nota

### Solicitudes de Cambio ✅
- [ ] Crear solicitud válida
- [ ] Validación de conflictos de horario
- [ ] Validación de cupos disponibles
- [ ] Generación de radicado único
- [ ] Estados correctos (PENDING)

### Seguridad ✅
- [ ] No acceso a datos de otros estudiantes
- [ ] No acceso a funciones de ADMIN/DEAN
- [ ] Validación de permisos por endpoint

---

## 🎉 ¡FELICITACIONES!

Si completaste todos los pasos, has probado exitosamente:

✅ **Sistema de horarios personales**
✅ **Historial académico tipo semáforo**
✅ **Solicitudes de cambio con validaciones**
✅ **Seguridad y permisos por rol**
✅ **Detección automática de conflictos**

El sistema está funcionando correctamente desde la perspectiva del estudiante. 🎓