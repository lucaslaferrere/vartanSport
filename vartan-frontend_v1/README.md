# Vartan Frontend

## Descripción General
Este proyecto es el frontend de la aplicación Vartan Sports, un sistema de control de stock desarrollado con **Next.js** y **TypeScript**. La estructura del proyecto está diseñada para ser modular y escalable, facilitando la integración con un backend existente.

---

## Estructura del Proyecto

### 1. **Carpeta `app/`**
Contiene las páginas principales de la aplicación, organizadas según el sistema de enrutamiento de Next.js. Cada subcarpeta representa una ruta.
- **Ejemplo:** `dashboard/page.tsx` representa la ruta `/dashboard`.

### 2. **Carpeta `src/`**
Esta carpeta contiene la lógica principal y los componentes reutilizables del proyecto.

#### a) **`components/`**
Componentes reutilizables divididos en subcarpetas según su funcionalidad:
- **`Layouts/`**: Contiene el diseño principal de la aplicación, incluyendo el `Drawer` y el `Header`.
  - `AppLayout.tsx`: Layout principal que envuelve las páginas internas.
  - `MainLayout/`: Subcomponentes como `Drawer` y `Header`.
- **`Buttons/`**: Botones reutilizables como `PrimaryButton` y `OutlineButton`.
- **`Modals/`**: Componentes para modales animados y de diálogo.
- **`Notifications/`**: Manejo de notificaciones con contexto.

#### b) **`services/`**
Servicios para interactuar con el backend. Cada archivo representa un módulo específico:
- `auth.service.ts`: Manejo de autenticación.
- `cliente.service.ts`: Servicios relacionados con clientes.
- `producto.service.ts`: Servicios relacionados con productos.

#### c) **`redux/`**
Configuración de Redux para el manejo del estado global:
- `store.ts`: Configuración del store.
- `provider.tsx`: Proveedor de Redux para envolver la aplicación.
- `features/`: Slices de Redux para diferentes entidades.

#### d) **`utils/`**
Funciones utilitarias reutilizables:
- `formatDate.ts`: Formateo de fechas.
- `getBreadcrumbs.ts`: Generación de breadcrumbs dinámicos.

#### e) **`libraries/`**
Configuración de bibliotecas externas:
- `api.ts`: Cliente Axios configurado para interactuar con el backend.

#### f) **`hooks/`**
Custom hooks para encapsular lógica reutilizable:
- `useMounted.ts`: Hook para verificar si un componente está montado.

---

## Flujo de Autenticación
1. **Login:**
   - El usuario envía sus credenciales al backend.
   - El backend devuelve un token que se almacena en cookies seguras.
2. **Intercepción de Requests:**
   - Los tokens se incluyen automáticamente en los headers de las solicitudes.
   - Si el token expira, se intenta refrescar automáticamente.
3. **Logout:**
   - Se eliminan las cookies y se redirige al usuario a la página de login.

---

## Layout Principal
El layout principal (`AppLayout`) incluye:
- **Drawer:** Menú lateral para la navegación.
- **Header:** Encabezado con acciones globales.
- **Contenido Dinámico:** Renderizado de las páginas internas.

---

## Scripts Disponibles
- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Genera una versión de producción.
- `npm run start`: Inicia el servidor en modo producción.

---

## Recomendaciones
- **Variables de Entorno:** Asegúrate de configurar `NEXT_PUBLIC_API_URL` en un archivo `.env.local`.
- **Seguridad:** Usa HTTPS y configura correctamente las cookies para producción.

---

## Contacto
Para dudas o soporte, contacta al equipo de desarrollo.
