# Guía de Migración a MongoDB Atlas

## 📋 Requisitos Previos

- Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- MongoDB Tools instalados localmente (mongodump/mongorestore)

## 🚀 Pasos de Configuración

### 1. Crear Cluster en MongoDB Atlas

1. Ve a https://cloud.mongodb.com
2. Inicia sesión o crea una cuenta
3. Crea un nuevo proyecto
4. Crea un cluster (tier gratuito M0 es suficiente)
5. Espera a que el cluster se aprovisione (~3-5 minutos)

### 2. Configurar Acceso

#### Database Access (Usuarios)

1. En el menú lateral, ve a **Database Access**
2. Haz clic en **Add New Database User**
3. Selecciona **Password** como método de autenticación
4. Elige un nombre de usuario y contraseña segura
5. En **Database User Privileges**, selecciona **Read and write to any database**
6. Haz clic en **Add User**

#### Network Access (Acceso desde IP)

1. En el menú lateral, ve a **Network Access**
2. Haz clic en **Add IP Address**
3. Para desarrollo: selecciona **Allow Access from Anywhere** (0.0.0.0/0)
   - ⚠️ Para producción, usa IPs específicas
4. Haz clic en **Confirm**

### 3. Obtener Connection String

1. Ve a **Database** en el menú lateral
2. En tu cluster, haz clic en **Connect**
3. Selecciona **Connect your application**
4. Copia la connection string que se ve así:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 4. Configurar Variables de Entorno

1. Abre el archivo `.env.local`
2. Reemplaza `MONGODB_URI` con tu connection string de Atlas:

   ```env
   MONGODB_URI=mongodb+srv://tuusuario:tucontraseña@cluster0.xxxxx.mongodb.net/nutritrack?retryWrites=true&w=majority
   ```

   **Importante:**

   - Reemplaza `<username>` con tu usuario
   - Reemplaza `<password>` con tu contraseña
   - Agrega `/nutritrack` antes de `?retryWrites` para especificar la base de datos

3. Genera un NEXTAUTH_SECRET seguro:

   ```bash
   openssl rand -base64 32
   ```

   O usa este en Node.js:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

## 📦 Migrar Datos Existentes (Opcional)

Si tienes datos en tu MongoDB local que quieres migrar:

### Opción 1: Usando MongoDB Tools (Recomendado)

```bash
# 1. Exportar datos locales
mongodump --uri="mongodb://localhost:27017/nutritrack" --out="./backup"

# 2. Importar a Atlas (reemplaza con tu connection string)
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/nutritrack" ./backup/nutritrack
```

### Opción 2: Usando el script automatizado

```bash
node scripts/migrate-to-atlas.js
```

## 🧪 Verificar la Conexión

1. Reinicia tu servidor de desarrollo:

   ```bash
   npm run dev
   ```

2. Verifica en la consola que no hay errores de conexión

3. Prueba la aplicación:

   - Intenta hacer login
   - Crea un usuario nuevo
   - Verifica que los datos se guardan

4. En MongoDB Atlas:
   - Ve a **Database** > **Browse Collections**
   - Deberías ver tu base de datos `nutritrack` con las colecciones

## ⚠️ Solución de Problemas

### Error: "MongoServerError: bad auth"

- Verifica que el usuario y contraseña sean correctos
- Asegúrate de codificar caracteres especiales en la contraseña (usa %40 para @, %23 para #, etc.)

### Error: "MongooseServerSelectionError: Could not connect"

- Verifica que tu IP esté en la lista de Network Access
- Comprueba que la connection string sea correcta
- Asegúrate de tener conexión a internet

### Error: "ENOTFOUND cluster0.xxxxx.mongodb.net"

- Verifica que el nombre del cluster sea correcto
- Comprueba tu conexión a internet
- Intenta hacer ping al servidor

### Los datos no aparecen

- Verifica que el nombre de la base de datos esté en la connection string: `/nutritrack`
- Revisa que la migración se completó sin errores
- Ve a Atlas > Browse Collections para ver los datos

## 🔒 Seguridad en Producción

Cuando despliegues a producción:

1. **Network Access**: Restringe el acceso solo a IPs específicas de tu servidor
2. **Database User**: Crea usuarios con permisos mínimos necesarios
3. **Connection String**: Nunca la commits al repositorio
4. **NEXTAUTH_SECRET**: Usa un valor diferente y seguro en producción
5. **Backups**: Configura backups automáticos en Atlas

## 📚 Recursos Adicionales

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Tools](https://docs.mongodb.com/database-tools/)
