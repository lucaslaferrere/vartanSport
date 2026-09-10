# Alta de un cliente nuevo

Checklist para dar de alta un cliente nuevo sobre la misma infraestructura de Coolify.
Modelo: una base de datos y una instancia de cada servicio por cliente (no multi-tenant).

Convención de subdominios (reemplazar `<cliente>` por un slug corto, ej. `mayorea`):

- Backend: `api-<cliente>.lrsolutions.com.ar`
- Admin (vartan-frontend_v1): `<cliente>.lrsolutions.com.ar`
- Catálogo público (vartan-catalogo): `catalogo-<cliente>.lrsolutions.com.ar`

## 1. Base de datos

Crear una base Postgres nueva en la instancia de Coolify (no reutilizar la de otro cliente).
Anotar host, puerto, usuario, password y nombre de la base.

## 2. Backend (este repo)

Crear un servicio nuevo en Coolify a partir de este repo/Dockerfile. Variables de entorno:

```
DATABASE_URL=postgres://usuario:password@host:5432/nombre_db?sslmode=disable
JWT_SECRET=<generar uno nuevo por cliente, no reutilizar>
```

(o en su defecto `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` sueltos)

- Las migraciones corren solas al bootear (`config.AutoMigrate` en `main.go`), no hay paso manual.
- **Volumen persistente obligatorio**: montar `./uploads` como volumen en Coolify — si no, las fotos de producto y de catálogo se pierden en cada redeploy (el filesystem del contenedor es efímero).
- **CORS**: agregar los 3 subdominios del cliente nuevo (admin, catálogo — el backend no necesita agregarse a sí mismo) a `AllowOrigins` en `main.go` (línea ~71) y redeployar. Hoy es una lista hardcodeada en código, no una env var.
- Una vez arriba, correr el binario de alta del dueño (ver paso 4).

## 3. Frontend admin (vartan-frontend_v1)

Deploy nuevo apuntando al backend de este cliente:

```
NEXT_PUBLIC_API_URL=https://api-<cliente>.lrsolutions.com.ar
```

## 4. Crear el usuario dueño

Con el backend del cliente ya levantado y conectado a su base:

```bash
go run ./cmd/tools/create-owner -nombre "Nombre del dueño" -email "email@cliente.com" -password "unaClaveTemporal"
```

Correrlo apuntando al `.env`/variables de ese entorno (mismo `DATABASE_URL` que usa el backend del cliente). Avisarle al dueño que cambie la password apenas entre.

Los demás binarios en `cmd/tools/` (`register-all-employees`, `register-employees`, `verify-employees`, `create-user`) tienen datos hardcodeados del cliente original (Vartan Sports) y **no sirven tal cual para un cliente nuevo** — si un cliente nuevo necesita precargar empleados, hay que adaptar la lista a mano o cargarlos desde la UI.

## 5. Catálogo público (vartan-catalogo)

Deploy nuevo del proyecto en `C:\Users\lafer\OneDrive\Desktop\vartan-catalogo`. Variables de entorno:

```
NEXT_PUBLIC_API_URL=https://api-<cliente>.lrsolutions.com.ar
NEXT_PUBLIC_WHATSAPP_NUMBER=<whatsapp del cliente, formato 549XXXXXXXXXX>
NEXT_PUBLIC_BUSINESS_NAME=<nombre comercial del cliente>
```

`next.config.ts` ya tiene un wildcard para `api-*.lrsolutions.com.ar` — no hace falta tocarlo si el subdominio del backend sigue esa convención.

**Branding manual** (no son env vars, son cosméticos — cada cliente es un fork/copy del repo):
- `app/layout.tsx` línea ~22: `title` del `<head>`.
- `components/Header.tsx` y `app/CatalogoClient.tsx`: texto del logo "VARTAN SPORTS".
- Paleta de colores en `tailwind.config.ts` si el cliente quiere otro acento en vez del verde.

## 6. Verificación

- Login en el admin con el usuario dueño creado.
- Alta de un producto de prueba con `visible_catalogo: true` y stock.
- Ver que aparezca en el catálogo público.
- Simular un pedido desde el catálogo y confirmarlo desde el admin (cuando esa pantalla de admin exista — ver notas pendientes del flujo de catálogo).
