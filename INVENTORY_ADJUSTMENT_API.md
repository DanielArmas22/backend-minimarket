# API de Ajuste de Inventario (HU9)

## Descripción
Esta funcionalidad permite aumentar o disminuir manualmente el stock de un producto, especificando el motivo del ajuste (merma, conteo, daño, devolución, corrección u otro).

## Content Type: Inventory Adjustment

### Atributos
- **adjustmentDate** (datetime, requerido): Fecha y hora del ajuste
- **adjustmentType** (enum, requerido): Tipo de ajuste ('increase' o 'decrease')
- **quantity** (integer, requerido): Cantidad a ajustar (debe ser mayor a 0)
- **reason** (enum, requerido): Motivo del ajuste
  - `merma`: Pérdida de producto
  - `conteo`: Ajuste por conteo físico
  - `daño`: Producto dañado
  - `devolucion`: Devolución de producto
  - `correccion`: Corrección de error
  - `otro`: Otro motivo
- **reasonDescription** (text): Descripción adicional del motivo
- **previousStock** (biginteger, requerido): Stock anterior al ajuste
- **newStock** (biginteger, requerido): Stock después del ajuste
- **product** (relación): Producto ajustado
- **users_permissions_user** (relación): Usuario que realizó el ajuste

## Endpoints Disponibles

### 1. Ajustar Inventario
**POST** `/api/inventory-adjustments/adjust`

Ajusta el stock de un producto y registra el ajuste en el historial.

**Body:**
```json
{
  "productId": 1,
  "adjustmentType": "decrease",
  "quantity": 5,
  "reason": "merma",
  "reasonDescription": "Producto vencido",
  "userId": 1
}
```

**Parámetros:**
- `productId` (requerido): ID del producto a ajustar
- `adjustmentType` (requerido): "increase" (aumentar) o "decrease" (disminuir)
- `quantity` (requerido): Cantidad a ajustar (número entero positivo)
- `reason` (requerido): Motivo del ajuste (merma, conteo, daño, devolucion, correccion, otro)
- `reasonDescription` (opcional): Descripción adicional
- `userId` (opcional): ID del usuario que realiza el ajuste

**Respuesta exitosa:**
```json
{
  "data": {
    "id": 1,
    "adjustmentDate": "2024-11-04T00:00:00.000Z",
    "adjustmentType": "decrease",
    "quantity": 5,
    "reason": "merma",
    "reasonDescription": "Producto vencido",
    "previousStock": 100,
    "newStock": 95,
    "product": {...},
    "users_permissions_user": {...}
  },
  "message": "Ajuste de inventario realizado exitosamente",
  "summary": {
    "productId": 1,
    "productDescription": "Leche entera 1L",
    "adjustmentType": "decrease",
    "quantity": 5,
    "previousStock": 100,
    "newStock": 95,
    "difference": -5
  }
}
```

**Errores:**
- `400`: Debe proporcionar el ID del producto
- `400`: El tipo de ajuste debe ser "increase" o "decrease"
- `400`: La cantidad debe ser mayor a 0
- `400`: Debe proporcionar un motivo válido
- `404`: Producto no encontrado
- `400`: No se puede disminuir el stock (stock insuficiente)

---

### 2. Obtener Historial de Ajustes de un Producto
**GET** `/api/inventory-adjustments/product/:productId/history`

Obtiene el historial completo de ajustes de un producto específico.

**Parámetros de URL:**
- `productId`: ID del producto

**Ejemplo:**
```
GET /api/inventory-adjustments/product/1/history
```

**Respuesta exitosa:**
```json
{
  "data": [
    {
      "id": 3,
      "adjustmentDate": "2024-11-04T10:00:00.000Z",
      "adjustmentType": "increase",
      "quantity": 50,
      "reason": "conteo",
      "reasonDescription": "Conteo físico mensual",
      "previousStock": 95,
      "newStock": 145,
      "product": {...},
      "users_permissions_user": {...}
    },
    {
      "id": 2,
      "adjustmentDate": "2024-11-03T15:30:00.000Z",
      "adjustmentType": "decrease",
      "quantity": 3,
      "reason": "daño",
      "reasonDescription": "Envases rotos",
      "previousStock": 98,
      "newStock": 95,
      "product": {...},
      "users_permissions_user": {...}
    },
    {
      "id": 1,
      "adjustmentDate": "2024-11-03T12:00:00.000Z",
      "adjustmentType": "decrease",
      "quantity": 5,
      "reason": "merma",
      "reasonDescription": "Producto vencido",
      "previousStock": 100,
      "newStock": 95,
      "product": {...},
      "users_permissions_user": {...}
    }
  ],
  "message": "Historial de ajustes obtenido exitosamente",
  "total": 3
}
```

**Errores:**
- `400`: Debe proporcionar el ID del producto

---

### 3. Endpoints CRUD Estándar

Además de los endpoints personalizados, también están disponibles los endpoints CRUD estándar:

- **GET** `/api/inventory-adjustments` - Listar todos los ajustes
- **GET** `/api/inventory-adjustments/:id` - Obtener un ajuste específico
- **POST** `/api/inventory-adjustments` - Crear un ajuste (usar mejor `/adjust`)
- **PUT** `/api/inventory-adjustments/:id` - Actualizar un ajuste
- **DELETE** `/api/inventory-adjustments/:id` - Eliminar un ajuste

## Tipos de Ajuste

### Increase (Aumentar)
Se usa cuando se necesita **aumentar** el stock:
- Devolución de productos
- Corrección de error (se contó menos de lo que había)
- Conteo físico (se encontró más stock)

**Ejemplo:**
```json
{
  "productId": 1,
  "adjustmentType": "increase",
  "quantity": 10,
  "reason": "devolucion",
  "reasonDescription": "Cliente devolvió producto en buen estado"
}
```

### Decrease (Disminuir)
Se usa cuando se necesita **disminuir** el stock:
- Merma (pérdida de producto)
- Producto dañado
- Conteo físico (se encontró menos stock)
- Corrección de error (se contó más de lo que había)

**Ejemplo:**
```json
{
  "productId": 1,
  "adjustmentType": "decrease",
  "quantity": 5,
  "reason": "merma",
  "reasonDescription": "Producto vencido"
}
```

## Motivos de Ajuste

| Motivo | Descripción | Uso Común |
|--------|-------------|-----------|
| `merma` | Pérdida de producto | Vencimiento, deterioro natural |
| `conteo` | Ajuste por conteo físico | Inventario periódico, diferencias encontradas |
| `daño` | Producto dañado | Roturas, productos en mal estado |
| `devolucion` | Devolución de producto | Cliente devuelve, proveedor acepta devolución |
| `correccion` | Corrección de error | Error de registro, error de sistema |
| `otro` | Otro motivo | Cualquier otro caso no contemplado |

## Validaciones

1. **Stock no puede ser negativo**: Al disminuir, el sistema valida que el stock no quede negativo
2. **Cantidad debe ser positiva**: No se permiten cantidades 0 o negativas
3. **Producto debe existir**: Se valida que el producto exista antes de ajustar
4. **Transacciones atómicas**: El ajuste del stock y el registro del historial se hacen en una transacción

## Flujo de Trabajo Recomendado

### Caso 1: Producto Dañado
1. Identificar el producto dañado
2. Llamar a `POST /api/inventory-adjustments/adjust`:
```json
{
  "productId": 5,
  "adjustmentType": "decrease",
  "quantity": 3,
  "reason": "daño",
  "reasonDescription": "Envases rotos durante transporte",
  "userId": 1
}
```

### Caso 2: Conteo Físico Mensual
1. Realizar conteo físico del inventario
2. Para cada diferencia encontrada, ajustar:
```json
{
  "productId": 10,
  "adjustmentType": "increase",
  "quantity": 5,
  "reason": "conteo",
  "reasonDescription": "Conteo físico octubre 2024 - se encontraron 5 unidades más",
  "userId": 1
}
```

### Caso 3: Producto Vencido (Merma)
1. Identificar productos vencidos
2. Ajustar el inventario:
```json
{
  "productId": 15,
  "adjustmentType": "decrease",
  "quantity": 10,
  "reason": "merma",
  "reasonDescription": "Productos vencidos - fecha vencimiento: 2024-10-30",
  "userId": 1
}
```

## Ejemplos de Uso con cURL

### Ajustar inventario (disminuir por merma):
```bash
curl -X POST http://localhost:1337/api/inventory-adjustments/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "adjustmentType": "decrease",
    "quantity": 5,
    "reason": "merma",
    "reasonDescription": "Producto vencido",
    "userId": 1
  }'
```

### Ajustar inventario (aumentar por devolución):
```bash
curl -X POST http://localhost:1337/api/inventory-adjustments/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "adjustmentType": "increase",
    "quantity": 3,
    "reason": "devolucion",
    "reasonDescription": "Cliente devolvió producto en buen estado",
    "userId": 1
  }'
```

### Obtener historial de ajustes:
```bash
curl http://localhost:1337/api/inventory-adjustments/product/1/history
```

### Listar todos los ajustes:
```bash
curl http://localhost:1337/api/inventory-adjustments
```

## Integración con Otros Módulos

### Con Productos
- Cada ajuste actualiza automáticamente el campo `stock` del producto
- Se mantiene un registro histórico de todos los cambios

### Con Usuarios
- Se puede asociar cada ajuste con el usuario que lo realizó
- Útil para auditoría y trazabilidad

## Reportes Sugeridos

1. **Reporte de Mermas**: Filtrar ajustes por `reason: "merma"`
2. **Reporte de Daños**: Filtrar ajustes por `reason: "daño"`
3. **Historial de Producto**: Usar endpoint `/product/:productId/history`
4. **Ajustes por Usuario**: Filtrar por `users_permissions_user`
5. **Ajustes por Fecha**: Filtrar por rango de `adjustmentDate`

## Notas Importantes

⚠️ **Seguridad**: Los endpoints están configurados con `auth: false` solo para desarrollo. En producción, configura los permisos apropiados en el panel de administración.

✅ **Trazabilidad**: Todos los ajustes quedan registrados con fecha, usuario, motivo y descripción.

✅ **Integridad**: Se usan transacciones para garantizar que el stock y el historial siempre estén sincronizados.

✅ **Validaciones**: El sistema previene errores comunes como stock negativo o cantidades inválidas.
