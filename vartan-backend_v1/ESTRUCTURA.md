# 📁 Estructura del Proyecto - Vartan Backend

## 📂 Estructura de Carpetas

```
vartan-backend_v1/
│
├── 📂 config/              # Configuración de base de datos
├── 📂 controllers/         # Controladores de la API
├── 📂 middleware/          # Middleware (autenticación, permisos)
├── 📂 models/             # Modelos de datos (GORM)
├── 📂 routes/             # Definición de rutas
├── 📂 docs/               # Documentación Swagger
├── 📂 tests/              # Tests unitarios
│
├── 📂 cmd/                # Comandos y herramientas
│   └── tools/            # Scripts Go utilitarios
│
├── 📂 bin/                # Ejecutables compilados
├── 📂 logs/               # Archivos de log
├── 📂 sql/                # Scripts SQL (migraciones)
├── 📂 scripts/            # Scripts de prueba y diagnóstico (.ps1)
├── 📂 setup-scripts/      # Scripts de inicio y configuración
├── 📂 test-data/          # Datos de prueba (.json)
├── 📂 test-results/       # Resultados de pruebas (.txt)
├── 📂 uploads/            # Archivos subidos
│   └── comprobantes/     # Comprobantes de ventas
│
├── main.go               # Punto de entrada principal
├── go.mod                # Dependencias Go
├── go.sum                # Checksums de dependencias
├── Dockerfile            # Configuración Docker
├── docker-compose.yml    # Docker Compose
└── README.md             # Este archivo
```

## 🚀 Comandos Principales

### Desarrollo Local
```bash
# Iniciar el servidor
go run main.go

# Compilar
go build -o bin/vartan-backend.exe

# Con Docker
docker-compose up -d
```

### Scripts Disponibles

**Setup (en setup-scripts/):**
- `setup.ps1` - Configuración inicial
- `start-backend.ps1` - Iniciar backend
- `restart-backend.ps1` - Reiniciar backend

**Testing (en scripts/):**
- `test-endpoints.ps1` - Probar todos los endpoints
- `test-ventas.ps1` - Probar endpoints de ventas
- `test-comision.ps1` - Probar comisiones
- `verify-token.ps1` - Verificar autenticación

### Herramientas (en cmd/tools/)
```bash
# Crear usuario dueño
go run cmd/tools/create_owner.go

# Registrar empleados
go run cmd/tools/register_employees.go

# Verificar empleados
go run cmd/tools/verify_employees.go
```

## 📝 Variables de Entorno

Crear archivo `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=vartan_sports
JWT_SECRET=tu_secreto_aqui
PORT=8080
```

## 🗄️ Base de Datos

Scripts SQL en la carpeta `sql/`:
- `migrations.sql` - Migraciones principales
- `migracion-droplet.sql` - Migración para producción
- `fix_gastos_table.sql` - Correcciones de tabla gastos

## 📊 Endpoints Principales

- `/health` - Health check
- `/auth/login` - Login
- `/auth/register` - Registro
- `/api/*` - Endpoints protegidos

Ver documentación completa en `/docs/swagger.yaml`

## 🧪 Testing

Logs de pruebas se guardan en `test-results/`
Datos de prueba JSON en `test-data/`

## 📦 Build para Producción

```bash
# Compilar para producción
go build -o bin/vartan-backend.exe

# Con Docker
docker build -t vartan-backend .
docker run -p 8080:8080 vartan-backend
```

## 🔒 Seguridad

- JWT para autenticación
- Roles: dueño, vendedor
- Middleware de autorización en `/middleware/auth.go`

## 📞 Soporte

Logs del servidor en `logs/backend-output.log` y `logs/backend-error.log`
