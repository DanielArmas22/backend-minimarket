# API de Apertura y Cierre de Caja (HU7)

## Descripción
Esta funcionalidad permite registrar el monto inicial al abrir caja y calcular diferencias al cierre del turno.

## Content Type: Cash Register

### Atributos
- **openingDate** (datetime, requerido): Fecha y hora de apertura de caja
- **closingDate** (datetime): Fecha y hora de cierre de caja
- **initialAmount** (decimal, requerido): Monto inicial con el que se abre la caja
- **expectedAmount** (decimal): Monto esperado al cierre (inicial + ventas)
- **actualAmount** (decimal): Monto real contado al cierre
- **difference** (decimal): Diferencia entre monto esperado y real
- **status** (enum): Estado de la caja ('open' o 'closed')
- **notes** (text): Notas adicionales sobre el cierre
- **users_permissions_user** (relación): Usuario que maneja la caja
- **sales** (relación): Ventas asociadas a esta caja

## Endpoints Disponibles

### 1. Abrir Caja
**POST** `/api/cash-registers/open`

Abre una nueva caja registradora. Solo puede haber una caja abierta a la vez.

**Body:**
```json
{
  "initialAmount": 100.00,
  "userId": 1  // Opcional
}
```

**Respuesta exitosa:**
```json
{
  "data": {
    "id": 1,
    "openingDate": "2024-11-03T23:00:00.000Z",
    "initialAmount": 100.00,
    "status": "open",
    "users_permissions_user": {...}
  },
  "message": "Caja abierta exitosamente"
}
```

**Errores:**
- `400`: Ya existe una caja abierta
- `400`: El monto inicial debe ser mayor o igual a 0

---

### 2. Cerrar Caja
**POST** `/api/cash-registers/close`

Cierra una caja abierta y calcula las diferencias entre el monto esperado y el real.

**Body:**
```json
{
  "cashRegisterId": 1,
  "actualAmount": 550.00,
  "notes": "Cierre de turno mañana"  // Opcional
}
```

**Respuesta exitosa:**
```json
{
  "data": {
    "id": 1,
    "openingDate": "2024-11-03T23:00:00.000Z",
    "closingDate": "2024-11-04T07:00:00.000Z",
    "initialAmount": 100.00,
    "expectedAmount": 550.00,
    "actualAmount": 550.00,
    "difference": 0.00,
    "status": "closed",
    "notes": "Cierre de turno mañana"
  },
  "message": "Caja cerrada exitosamente",
  "summary": {
    "initialAmount": 100.00,
    "totalSales": 450.00,
    "expectedAmount": 550.00,
    "actualAmount": 550.00,
    "difference": 0.00
  }
}
```

**Cálculo de diferencia:**
- `expectedAmount = initialAmount + totalSales`
- `difference = actualAmount - expectedAmount`
- Si `difference > 0`: Hay sobrante
- Si `difference < 0`: Hay faltante
- Si `difference = 0`: Cuadra perfecto

**Errores:**
- `400`: Debe proporcionar el ID de la caja a cerrar
- `400`: El monto real debe ser mayor o igual a 0
- `404`: Caja no encontrada
- `400`: Esta caja ya está cerrada

---

### 3. Obtener Caja Abierta Actual
**GET** `/api/cash-registers/current-open`

Obtiene la caja que está actualmente abierta.

**Respuesta exitosa (con caja abierta):**
```json
{
  "data": {
    "id": 1,
    "openingDate": "2024-11-03T23:00:00.000Z",
    "initialAmount": 100.00,
    "status": "open",
    "users_permissions_user": {...},
    "sales": [...]
  },
  "message": "Caja abierta encontrada"
}
```

**Respuesta (sin caja abierta):**
```json
{
  "data": null,
  "message": "No hay caja abierta actualmente"
}
```

---

### 4. Endpoints CRUD Estándar

Además de los endpoints personalizados, también están disponibles los endpoints CRUD estándar de Strapi:

- **GET** `/api/cash-registers` - Listar todas las cajas
- **GET** `/api/cash-registers/:id` - Obtener una caja específica
- **POST** `/api/cash-registers` - Crear una caja (usar mejor `/open`)
- **PUT** `/api/cash-registers/:id` - Actualizar una caja
- **DELETE** `/api/cash-registers/:id` - Eliminar una caja

## Relación con Ventas

Para asociar una venta a la caja abierta, al crear una venta incluye el campo `cash_register`:

```json
{
  "data": {
    "date": "2024-11-03T23:30:00.000Z",
    "cash_register": 1,  // ID de la caja abierta
    "payment": 1,
    "users_permissions_user": 1
  }
}
```

## Flujo de Trabajo Recomendado

1. **Inicio de turno:**
   - Llamar a `POST /api/cash-registers/open` con el monto inicial
   - Guardar el ID de la caja abierta

2. **Durante el turno:**
   - Al crear ventas, asociarlas con la caja abierta usando el campo `cash_register`

3. **Fin de turno:**
   - Contar el dinero en caja (monto real)
   - Llamar a `POST /api/cash-registers/close` con el ID de la caja y el monto real
   - El sistema calculará automáticamente:
     - Total de ventas del turno
     - Monto esperado (inicial + ventas)
     - Diferencia (sobrante o faltante)

## Configuración de Permisos

Para usar estos endpoints, asegúrate de configurar los permisos en el panel de administración de Strapi:

1. Ve a **Settings** → **Users & Permissions Plugin** → **Roles**
2. Selecciona el rol apropiado (ej: Authenticated)
3. En **Cash-register**, habilita:
   - `find` (listar cajas)
   - `findOne` (ver una caja)
   - `create` (crear caja)
   - `update` (actualizar caja)
   - `open` (abrir caja)
   - `close` (cerrar caja)
   - `getCurrentOpen` (obtener caja abierta)

## Ejemplos de Uso con cURL

### Abrir caja:
```bash
curl -X POST http://localhost:1337/api/cash-registers/open \
  -H "Content-Type: application/json" \
  -d '{"initialAmount": 100.00, "userId": 1}'
```

### Cerrar caja:
```bash
curl -X POST http://localhost:1337/api/cash-registers/close \
  -H "Content-Type: application/json" \
  -d '{"cashRegisterId": 1, "actualAmount": 550.00, "notes": "Cierre turno mañana"}'
```

### Obtener caja abierta:
```bash
curl http://localhost:1337/api/cash-registers/current-open
```
