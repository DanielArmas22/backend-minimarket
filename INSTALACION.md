# Guía de Instalación y Ejecución - Backend Minimarket

## Requisitos Previos
- Node.js >= 18.0.0 y <= 22.x.x
- npm >= 6.0.0

## Pasos de Instalación

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Copia el archivo `env.example` y renómbralo a `.env`:

```bash
# En Windows PowerShell
Copy-Item env.example .env

# O manualmente crea un archivo .env con el siguiente contenido:
```

**Contenido mínimo del archivo `.env`:**
```env
# Server
HOST=0.0.0.0
PORT=1337

# Secrets (CAMBIAR EN PRODUCCIÓN)
APP_KEYS=toBeModified1,toBeModified2
API_TOKEN_SALT=tobemodified
ADMIN_JWT_SECRET=tobemodified
TRANSFER_TOKEN_SALT=tobemodified
JWT_SECRET=tobemodified

# Database
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

**IMPORTANTE:** En producción, genera claves seguras para los secrets.

### 3. Ejecutar en Modo Desarrollo
```bash
npm run develop
```

El servidor se iniciará en: **http://localhost:1337**

El panel de administración estará en: **http://localhost:1337/admin**

### 4. Primera Vez - Crear Usuario Administrador
La primera vez que accedas a `/admin`, deberás crear un usuario administrador:
- Nombre
- Email
- Contraseña

## Comandos Disponibles

### Desarrollo
```bash
npm run develop
# Inicia Strapi con auto-reload habilitado
```

### Producción
```bash
# Compilar
npm run build

# Iniciar
npm run start
```

### Otros Comandos
```bash
# Consola de Strapi
npm run console

# Ejecutar script de ejemplo
npm run seed:example
```

## Estructura del Proyecto

```
backend-minimarket/
├── src/
│   ├── api/                    # APIs y Content Types
│   │   ├── cash-register/      # ✨ HU7: Apertura y cierre de caja
│   │   ├── sale/               # Ventas
│   │   ├── product/            # Productos
│   │   └── ...
│   ├── components/             # Componentes reutilizables
│   └── index.ts               # Punto de entrada
├── config/                     # Configuración de Strapi
├── database/                   # Archivos de base de datos
├── public/                     # Archivos públicos
└── .env                       # Variables de entorno (NO COMMITEAR)
```

## Content Types Disponibles

- **Cash Register** (cash-register) - Apertura y cierre de caja
- **Sale** (sale) - Ventas
- **Detail Sale** (detail-sale) - Detalles de venta
- **Product** (product) - Productos
- **Provider** (provider) - Proveedores
- **Order Buy** (order-buy) - Órdenes de compra
- **Pay** (pay) - Pagos
- **Promotion** (promotion) - Promociones
- Y más...

## Funcionalidad HU7: Apertura y Cierre de Caja

Ver documentación completa en: **CASH_REGISTER_API.md**

### Endpoints Principales:
- `POST /api/cash-registers/open` - Abrir caja
- `POST /api/cash-registers/close` - Cerrar caja
- `GET /api/cash-registers/current-open` - Obtener caja abierta

### Características:
✅ Registro de monto inicial al abrir caja
✅ Cálculo automático de ventas del turno
✅ Cálculo de diferencias (sobrante/faltante)
✅ Solo una caja abierta a la vez
✅ Asociación de ventas a la caja abierta
✅ Notas de cierre

## Configurar Permisos

1. Accede al panel de administración: http://localhost:1337/admin
2. Ve a **Settings** → **Users & Permissions Plugin** → **Roles**
3. Selecciona el rol (ej: Public o Authenticated)
4. Habilita los permisos necesarios para cada Content Type

### Permisos Recomendados para Cash Register:
- ✅ find (listar)
- ✅ findOne (ver uno)
- ✅ create (crear)
- ✅ update (actualizar)
- ✅ open (abrir caja)
- ✅ close (cerrar caja)
- ✅ getCurrentOpen (obtener caja abierta)

## Solución de Problemas

### Error: "Ya existe una caja abierta"
- Solo puede haber una caja abierta a la vez
- Cierra la caja actual antes de abrir una nueva

### Error de conexión a la base de datos
- Verifica que el archivo `.env` exista y tenga la configuración correcta
- Para SQLite (por defecto), no se requiere configuración adicional

### Puerto 1337 en uso
- Cambia el puerto en el archivo `.env`:
  ```env
  PORT=3000
  ```

## Recursos Adicionales

- [Documentación de Strapi](https://docs.strapi.io)
- [API de Cash Register](./CASH_REGISTER_API.md)
- [Strapi CLI](https://docs.strapi.io/dev-docs/cli)

## Contacto y Soporte

Para preguntas o problemas, consulta la documentación oficial de Strapi o revisa los logs del servidor.
