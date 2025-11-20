#!/usr/bin/env node

/**
 * Script de migración de MongoDB local a MongoDB Atlas
 * 
 * USO:
 * 1. Asegúrate de tener mongodump y mongorestore instalados
 * 2. Exporta tu base de datos local: 
 *    mongodump --db nutritrack --out ./backup
 * 3. Importa a Atlas usando tu connection string:
 *    mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/nutritrack" ./backup/nutritrack
 * 
 * ALTERNATIVA - Usando este script (requiere Node.js):
 * npm run migrate-to-atlas
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOCAL_URI = 'mongodb://localhost:27017/nutritrack';
const BACKUP_DIR = './mongodb-backup';

console.log('🚀 Script de Migración a MongoDB Atlas\n');

// Verificar que existe .env.local con MONGODB_URI
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: No se encontró el archivo .env.local');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const atlasUriMatch = envContent.match(/MONGODB_URI=(.+)/);

if (!atlasUriMatch || atlasUriMatch[1].includes('localhost')) {
  console.error('❌ Error: Actualiza MONGODB_URI en .env.local con tu URL de MongoDB Atlas');
  console.log('\nEjemplo:');
  console.log('MONGODB_URI=mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/nutritrack?retryWrites=true&w=majority\n');
  process.exit(1);
}

const ATLAS_URI = atlasUriMatch[1].trim();

console.log('📦 Paso 1: Crear backup de la base de datos local...');
try {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }
  execSync(`mongodump --uri="${LOCAL_URI}" --out="${BACKUP_DIR}"`, { stdio: 'inherit' });
  console.log('✅ Backup creado exitosamente\n');
} catch (error) {
  console.error('❌ Error al crear backup. ¿Está MongoDB corriendo localmente?');
  process.exit(1);
}

console.log('📤 Paso 2: Restaurar datos en MongoDB Atlas...');
try {
  execSync(`mongorestore --uri="${ATLAS_URI}" "${BACKUP_DIR}/nutritrack"`, { stdio: 'inherit' });
  console.log('✅ Datos restaurados exitosamente en Atlas\n');
} catch (error) {
  console.error('❌ Error al restaurar en Atlas. Verifica tu connection string.');
  process.exit(1);
}

console.log('🎉 ¡Migración completada exitosamente!');
console.log('\n📋 Próximos pasos:');
console.log('1. Verifica los datos en MongoDB Atlas');
console.log('2. Reinicia tu servidor de desarrollo');
console.log('3. Prueba la aplicación para confirmar la conexión\n');

// Limpiar backup (opcional)
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('¿Deseas eliminar el backup local? (s/n): ', (answer) => {
  if (answer.toLowerCase() === 's') {
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
    console.log('🗑️  Backup eliminado');
  }
  readline.close();
});
