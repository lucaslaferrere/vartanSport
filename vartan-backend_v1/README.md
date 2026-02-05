# VartanSport Backend API

Backend para el sistema de gestión de VartanSport desarrollado en Go con Gin Framework.

## 📋 Requisitos Previos

- **Go** 1.21 o superior
- **Docker** y **Docker Compose**
- **Git**

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/vartan-backend.git
cd vartan-backend
```

### 2. Levantar la base de datos con Docker

```bash
docker-compose up -d
```

Esto iniciará un contenedor de MySQL/PostgreSQL con la configuración necesaria.

### 3. Instalar dependencias de Go

```bash
go mod download
```

### 4. Ejecutar el servidor

```bash
go run main.go
```

El servidor estará disponible en: `http://localhost:8080`

## 🔧 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `docker-compose up -d` | Levanta la base de datos en segundo plano |
| `docker-compose down` | Detiene y elimina los contenedores |
| `docker-compose logs -f` | Ver logs de la base de datos |
| `go run main.go` | Inicia el servidor de desarrollo |
| `go build -o vartan-backend` | Compila el proyecto |
| `go test ./...` | Ejecuta todos los tests |

## 📡 Endpoints Principales

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario

### Productos
- `GET /api/productos` - Listar productos activos (con stock total)
- `GET /api/productos/:id` - Obtener producto por ID
- `POST /api/owner/productos` - Crear producto (solo dueño)
- `PUT /api/owner/productos/:id` - Actualizar producto (solo dueño)
- `DELETE /api/owner/productos/:id` - Eliminar producto (solo dueño)

### Stock
- `GET /api/stock` - Listar todo el stock
- `GET /api/stock/producto/:id` - Stock por producto
- `POST /api/owner/stock` - Agregar stock (crea múltiples registros por talle/color)
- `PUT /api/owner/stock/:id` - Actualizar cantidad de stock

### Health Check
- `GET /health` - Verificar estado del servidor

## 📦 Estructura de Datos

### Enums de Talles
```
S, M, L, XL, XXL
```

### Enums de Colores
```
Blanco, Negro, Azul, Rojo, Verde, Amarillo, Gris, Rosa, Morado, Naranja
```

### Crear Producto
```json
POST /api/owner/productos
{
  "nombre": "Remera Deportiva",
  "costo_unitario": 2500.00,
  "talles": ["S", "M", "L", "XL"],
  "colores": ["Blanco", "Negro", "Azul"]
}
```

### Crear Stock (múltiples registros)
```json
POST /api/owner/stock
{
  "producto_id": 1,
  "talles": ["S", "M"],
  "colores": ["Blanco", "Negro"],
  "cantidad": 10
}
```
Este ejemplo crea 4 registros de stock (2 talles × 2 colores) con cantidad 10 cada uno.

### Respuesta de Productos
```json
{
  "id": 1,
  "nombre": "Remera Deportiva",
  "costo_unitario": 2500.00,
  "activo": true,
  "fecha_creacion": "2026-02-05T10:00:00Z",
  "talles_disponibles": ["S", "M", "L", "XL"],
  "colores_disponibles": ["Blanco", "Negro", "Azul"],
  "stock_total": 40
}
```

## 🔐 Credenciales de Prueba

```
Email: admin@vartansport.com
Password: admin123
```

## 🗄️ Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=vartan_db
JWT_SECRET=tu_jwt_secret_key
PORT=8080
```

## 📂 Estructura del Proyecto

```
vartan-backend/
├── config/          # Configuración de base de datos
├── controllers/     # Controladores (lógica de endpoints)
├── middleware/      # Middlewares (autenticación, roles)
├── models/          # Modelos de datos
├── routes/          # Definición de rutas
├── docs/            # Documentación Swagger
├── tests/           # Tests unitarios
├── main.go          # Punto de entrada
├── docker-compose.yml
└── go.mod
```

## 🧪 Ejecutar Tests

```bash
go test ./tests/...
```

## 📖 Documentación Swagger

Una vez iniciado el servidor, accede a:
```
http://localhost:8080/swagger/index.html
```

---

Desarrollado para VartanSport © 2026
