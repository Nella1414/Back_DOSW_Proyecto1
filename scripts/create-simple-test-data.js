const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CONFIGURACIÓN SIMPLE PARA TESTING\n');

// 1. Leer configuración del .env
console.log('1. Leyendo configuración...');
let mongoUri;
try {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');

  for (const line of envLines) {
    if (line.startsWith('MONGODB_URI=')) {
      mongoUri = line.substring(12).trim();
      break;
    }
  }
} catch (error) {
  console.log('Error leyendo .env:', error.message);
  process.exit(1);
}

if (!mongoUri) {
  console.log('MONGODB_URI no encontrado en .env');
  process.exit(1);
}

console.log('✅ MongoDB Atlas configurado correctamente');

// 2. Verificar servidor
console.log('\n2. Verificando que el servidor esté corriendo...');
try {
  execSync('curl -f http://localhost:3000/api > NUL 2>&1', { stdio: 'pipe' });
  console.log('✅ Servidor corriendo en http://localhost:3000');
} catch (error) {
  console.log('❌ Servidor no está corriendo. Ejecuta: npm run start:dev');
  process.exit(1);
}

console.log('\n🎯 DATOS DE PRUEBA PARA THUNDER CLIENT\n');

console.log('=== CREDENCIALES DE LOGIN ===');
console.log('Email: juan.perez@estudiante.edu');
console.log('Password: password123');
console.log('Código Estudiante: SIS2024001\n');

console.log('=== CONFIGURAR ENVIRONMENT EN THUNDER CLIENT ===');
console.log('Nombre: Student Schedule System');
console.log('Variables:');
console.log(JSON.stringify({
  baseUrl: "http://localhost:3000",
  studentEmail: "juan.perez@estudiante.edu",
  studentCode: "SIS2024001",
  authToken: ""
}, null, 2));

console.log('\n=== PRIMER REQUEST ===');
console.log('POST {{baseUrl}}/auth/login');
console.log('Content-Type: application/json');
console.log('Body:');
console.log(JSON.stringify({
  email: "{{studentEmail}}",
  password: "password123"
}, null, 2));

console.log('\n📌 NOTA IMPORTANTE:');
console.log('1. Si los datos no existen, ejecútalos manualmente:');
console.log('   - npm run start:dev (en una terminal)');
console.log('   - Luego usa Thunder Client para crear el usuario');
console.log('2. O ejecuta el seeder completo con NestJS directamente');

console.log('\n✅ ¡Listo para testing!');