# 🚀 Guía Completa de Deployment - Vartan Sport Backend

## 📋 Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Digital Ocean](#configuración-de-digital-ocean)
3. [Instalación de Coolify](#instalación-de-coolify)
4. [Configuración de PostgreSQL](#configuración-de-postgresql)
5. [Deployment del Backend](#deployment-del-backend)
6. [Variables de Entorno](#variables-de-entorno)
7. [Solución de Problemas](#solución-de-problemas)

---

## 1️⃣ Requisitos Previos

### Lo que necesitas:
- ✅ Cuenta de Digital Ocean
- ✅ Droplet creado (Ubuntu 22.04 LTS recomendado)
- ✅ Mínimo: 2GB RAM, 1 CPU, 50GB SSD
- ✅ Dominio (opcional, pero recomendado para SSL)
- ✅ Repositorio Git (GitHub, GitLab, etc.)

---

## 2️⃣ Configuración de Digital Ocean

### Paso 1: Crear Droplet
```bash
1. Ir a Digital Ocean Dashboard
2. Create → Droplets
3. Seleccionar:
   - Ubuntu 22.04 LTS
   - Basic Plan (2GB RAM / 1 CPU)
   - Región: New York o más cercana a tus usuarios
   - Habilitar: Monitoring
4. Agregar SSH Key (recomendado)
5. Crear Droplet
```

### Paso 2: Obtener IP del Droplet
```
Tu IP será algo como: 45.55.194.246
```

### Paso 3: Configurar Firewall (UFW)
```bash
# Conectarse al droplet
ssh root@45.55.194.246

# Configurar firewall
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 8000/tcp    # Coolify
ufw allow 3001/tcp    # Frontend (si aplica)
ufw allow 8001/tcp    # Backend API
ufw allow 5432/tcp    # PostgreSQL (solo si necesitas acceso externo)
ufw enable
```

---

## 3️⃣ Instalación de Coolify

### Instalación con un solo comando:
```bash
# Conectado al droplet como root
curl -fsSL https://get.coolify.io | bash
```

### Verificar instalación:
```bash
docker ps
# Deberías ver contenedores de Coolify corriendo
```

### Acceder a Coolify:
```
http://45.55.194.246:8000
```

### Configuración inicial:
1. **Crear cuenta admin** (primera vez)
   - Email: tu@email.com
   - Contraseña segura
   
2. **Configurar servidor**
   - Coolify detectará automáticamente tu servidor local

---

## 4️⃣ Configuración de PostgreSQL en Coolify

### Opción A: Base de Datos en Coolify (Recomendado)

1. **En Coolify Dashboard:**
   ```
   Projects → Seleccionar tu proyecto
   → + New Resource
   → Database
   → PostgreSQL
   ```

2. **Configurar PostgreSQL:**
   ```
   Nombre: vartan-postgres
   Version: 15 (o la más reciente)
   Database Name: vartan_sports
   Username: postgres
   Password: [Generar contraseña segura]
   Port: 5432 (interno) → Exponer 5432 (externo) si necesitas acceso directo
   ```

3. **Guardar credenciales:**
   ```
   DB_HOST: vartan-postgres (nombre del contenedor)
   DB_PORT: 5432
   DB_USER: postgres
   DB_PASSWORD: [tu contraseña generada]
   DB_NAME: vartan_sports
   ```

### Opción B: PostgreSQL Standalone (Alternativa)

```bash
# Si prefieres instalar PostgreSQL directamente en el servidor
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Configurar usuario y base de datos
sudo -u postgres psql
CREATE DATABASE vartan_sports;
CREATE USER vartan_user WITH PASSWORD 'tu_password_segura';
GRANT ALL PRIVILEGES ON DATABASE vartan_sports TO vartan_user;
\q
```

---

## 5️⃣ Deployment del Backend en Coolify

### Paso 1: Preparar tu Repositorio

**Asegúrate de tener estos archivos en tu repo:**

#### `Dockerfile` (Ya lo tienes, pero verifica):
```dockerfile
# Build stage
FROM golang:1.25-alpine AS builder
WORKDIR /app
RUN apk add --no-cache ca-certificates git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Eliminar archivos con funciones main adicionales
RUN rm -f create_owner.go register_employees.go verify_employees.go register_all_employees.go
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app .

# Run stage
FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=America/Argentina/Buenos_Aires
COPY --from=builder /app/app .
EXPOSE 8080
CMD ["./app"]
```

#### `.dockerignore`:
```
.env
.env.local
*.exe
*.test
.git
.gitignore
docs/
tests/
*.md
docker-compose.yml
uploads/comprobantes/*
!uploads/comprobantes/.gitkeep
```

#### `.gitignore`:
```
.env
.env.local
*.exe
*.test
uploads/comprobantes/*
!uploads/comprobantes/.gitkeep
```

### Paso 2: Push a GitHub/GitLab

```bash
# En tu máquina local
git add .
git commit -m "Preparar para deployment en Coolify"
git push origin main
```

### Paso 3: Crear Aplicación en Coolify

1. **En Coolify Dashboard:**
   ```
   Projects → Tu proyecto
   → + New Resource
   → Application
   → Public Repository (o Private si tienes acceso configurado)
   ```

2. **Configurar Git:**
   ```
   Repository URL: https://github.com/tu-usuario/vartan-backend
   Branch: main
   Build Pack: Dockerfile
   ```

3. **Configurar Puertos:**
   ```
   Port Mapping:
   Container Port: 8080 → Host Port: 8001
   ```

4. **Configurar Dominio (Opcional):**
   ```
   - Si tienes dominio: api.tudominio.com
   - Si no: usa IP directa: http://45.55.194.246:8001
   ```

---

## 6️⃣ Variables de Entorno en Coolify

### Configurar Variables:

En Coolify → Tu aplicación → Environment Variables:

```env
# Base de Datos PostgreSQL
DB_HOST=vartan-postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password_segura_aqui
DB_NAME=vartan_sports

# JWT Secret (genera uno seguro)
JWT_SECRET=vartan_super_secret_key_production_2024_random_string

# Puerto
PORT=8080

# Ambiente
GIN_MODE=release
```

### 🔐 Generar JWT Secret Seguro:

```bash
# En tu terminal local
openssl rand -base64 32
# Copia el resultado y úsalo como JWT_SECRET
```

---

## 7️⃣ URLs Finales

Después del deployment:

```
Backend API: http://45.55.194.246:8001
Frontend: http://45.55.194.246:3001
PostgreSQL: localhost:5432 (interno)

Endpoints:
- Health: http://45.55.194.246:8001/health
- Login: http://45.55.194.246:8001/auth/login
- Swagger: http://45.55.194.246:8001/swagger/index.html
```

---

## 8️⃣ Configurar Frontend para Producción

### En tu archivo `.env` del frontend (Next.js/React):

```env
NEXT_PUBLIC_API_URL=http://45.55.194.246:8001
# o si tienes dominio:
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

### Actualizar archivos de configuración del frontend:

```typescript
// lib/api.ts o similar
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
```

---

## 9️⃣ Ejecutar Migraciones Iniciales

### Conectarse a la base de datos:

**Opción A: Desde Coolify**
```bash
# En Coolify, ir a tu PostgreSQL → Terminal
psql -U postgres -d vartan_sports
```

**Opción B: Desde tu máquina local**
```bash
# Instalar psql si no lo tienes
psql -h 45.55.194.246 -U postgres -d vartan_sports

# Pegar password cuando lo pida
```

### Ejecutar SQL de migración:

```sql
-- Verificar que el campo sueldo existe en usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS sueldo DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Verificar estructura
\d usuarios
\d comisiones
\d ventas

-- Ver usuarios existentes
SELECT id, nombre, email, rol, activo FROM usuarios;
```

### Registrar empleados (después del deployment):

**Opción A: Script directo (temporal)**
```bash
# Crear un archivo SQL temporal
cat > /tmp/register_employees.sql << 'EOF'
-- Registrar empleados con contraseñas hasheadas
-- Nota: Debes hashear las contraseñas con bcrypt antes
INSERT INTO usuarios (nombre, email, password_hash, rol, activo, porcentaje_comision, sueldo)
VALUES 
  ('SANTINO M', 'santinom@vartan.com', '$2a$10$...', 'empleado', true, 10.0, 0),
  ('CHOCO', 'choco@vartan.com', '$2a$10$...', 'empleado', true, 10.0, 0)
-- etc...
ON CONFLICT (email) DO NOTHING;
EOF

# Ejecutar
psql -h localhost -U postgres -d vartan_sports -f /tmp/register_employees.sql
```

**Opción B: Desde tu API (Recomendado)**
```bash
# Crear un endpoint temporal en tu backend
# O usar el script register_all_employees.go localmente
# apuntando a la base de datos de producción

# En .env temporal:
DB_HOST=45.55.194.246
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password

# Ejecutar:
go run register_all_employees.go
```

---

## 🔟 Solución de Problemas Comunes

### ❌ Error: Cannot read properties of null (reading 'map')

**Causa:** El frontend no puede conectarse al backend o recibe respuestas vacías.

**Solución:**
1. Verificar CORS en backend (ya está configurado)
2. Verificar que el backend esté corriendo:
   ```bash
   curl http://45.55.194.246:8001/health
   ```
3. Verificar variables de entorno del frontend
4. Revisar Network tab en DevTools del navegador

### ❌ Error: Connection refused

**Causa:** El backend no está escuchando en el puerto correcto.

**Solución:**
```bash
# En Coolify, revisar logs de la aplicación
# Verificar que PORT=8080 en variables de entorno
# Verificar Port Mapping: 8080 → 8001
```

### ❌ Error: Database connection failed

**Causa:** Credenciales incorrectas o PostgreSQL no accesible.

**Solución:**
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Probar conexión
psql -h localhost -U postgres -d vartan_sports

# Verificar variables de entorno en Coolify
DB_HOST=vartan-postgres  # Nombre del contenedor, no localhost
```

### ❌ Error: 502 Bad Gateway

**Causa:** El contenedor se está reiniciando o falló al iniciar.

**Solución:**
```bash
# Ver logs en Coolify
# Buscar errores de compilación o runtime
# Verificar que el Dockerfile esté correcto
```

---

## 1️⃣1️⃣ Configurar SSL/HTTPS (Opcional pero Recomendado)

### Con Dominio:

1. **En tu proveedor de dominio:**
   ```
   Crear A Record:
   api.tudominio.com → 45.55.194.246
   ```

2. **En Coolify:**
   ```
   Tu aplicación → Domains
   → Agregar dominio: api.tudominio.com
   → Coolify configurará automáticamente SSL con Let's Encrypt
   ```

3. **Actualizar frontend:**
   ```env
   NEXT_PUBLIC_API_URL=https://api.tudominio.com
   ```

---

## 1️⃣2️⃣ Monitoreo y Logs

### Ver logs en tiempo real:
```bash
# En Coolify Dashboard
Tu aplicación → Logs → Show Live Logs
```

### Logs de PostgreSQL:
```bash
# En Coolify
Tu PostgreSQL → Logs
```

### Métricas:
```bash
# En Coolify Dashboard
Server → Resources
# Verás CPU, RAM, Disk usage
```

---

## 1️⃣3️⃣ Backup de Base de Datos

### Configurar backups automáticos:

```bash
# En Coolify
Tu PostgreSQL → Backups
→ Enable Automated Backups
→ Frequency: Daily
→ Retention: 7 days
```

### Backup manual:
```bash
# Desde el droplet
docker exec vartan-postgres pg_dump -U postgres vartan_sports > backup.sql

# O desde Coolify Terminal
pg_dump -U postgres vartan_sports > /backup/vartan_$(date +%Y%m%d).sql
```

---

## 1️⃣4️⃣ Checklist Final de Deployment

- [ ] Droplet creado y accesible
- [ ] Coolify instalado
- [ ] PostgreSQL configurado en Coolify
- [ ] Base de datos creada (vartan_sports)
- [ ] Repositorio preparado con Dockerfile
- [ ] Variables de entorno configuradas en Coolify
- [ ] Backend deployado y corriendo
- [ ] Health check respondiendo: `curl http://IP:8001/health`
- [ ] Migraciones ejecutadas
- [ ] Empleados registrados
- [ ] CORS configurado correctamente
- [ ] Frontend apuntando a la URL correcta del backend
- [ ] Login funcionando
- [ ] Endpoints protegidos funcionando con JWT
- [ ] Backups configurados

---

## 📞 Comandos Útiles

```bash
# Ver todos los contenedores
docker ps -a

# Ver logs de un contenedor específico
docker logs -f container_name

# Reiniciar aplicación (en Coolify)
# Dashboard → Tu app → Restart

# Ejecutar comando en PostgreSQL
docker exec -it vartan-postgres psql -U postgres -d vartan_sports

# Ver uso de recursos
docker stats

# Limpiar espacio
docker system prune -a --volumes
```

---

## 🎯 URLs de Referencia

- **Coolify Docs:** https://coolify.io/docs
- **Digital Ocean Docs:** https://docs.digitalocean.com
- **Go + Docker:** https://docs.docker.com/language/golang/

---

## 🆘 Soporte

Si encuentras problemas:

1. **Revisar logs en Coolify**
2. **Verificar variables de entorno**
3. **Probar endpoints con curl**
4. **Revisar documentación de Coolify**

---

**¡Deployment exitoso! 🚀 Tu backend de Vartan Sport está en producción.**
