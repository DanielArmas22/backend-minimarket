# API de Órdenes de Compra (HU10)

## Descripción
Esta funcionalidad permite registrar nuevas órdenes de compra a proveedores con detalles de productos, cantidades y costos. También permite recibir órdenes (actualizando el stock) y cancelarlas.

## Content Types

### Order Buy (Orden de Compra)
**Atributos:**
- **fechaOrden** (date): Fecha de la orden
- **estado** (enum): Estado de la orden
  - `pendiente`: Orden creada, esperando recepción
  - `recibida`: Orden recibida, stock actualizado
  - `cancelada`: Orden cancelada
- **subtotal** (decimal): Subtotal sin IGV
- **igv** (decimal): Monto del IGV
- **total** (decimal): Total con IGV
- **observaciones** (text): Observaciones adicionales
- **provider** (relación): Proveedor de la orden
- **detail_order_buys** (relación): Detalles de la orden
- **users_permissions_user** (relación): Usuario que creó la orden

### Detail Order Buy (Detalle de Orden)
**Atributos:**
- **cantidad** (integer): Cantidad del producto
- **precioUnitario** (decimal): Precio unitario de compra
- **subtotal** (decimal): Subtotal del producto (cantidad × precio)
- **product** (relación): Producto
- **order_buy** (relación): Orden de compra

## Endpoints Disponibles

### 1. Crear Orden de Compra
**POST** `/api/order-buys/create-order`

Crea una nueva orden de compra con todos sus detalles.

**Body:**
```json
{
  "providerId": 1,
  "productos": [
    {
      "productId": 5,
      "cantidad": 50,
      "precioUnitario": 2.50
    },
    {
      "productId": 10,
      "cantidad": 30,
      "precioUnitario": 5.00
    }
  ],
  "igvPorcentaje": 18,
  "observaciones": "Entrega urgente",
  "userId": 1
}
```

**Parámetros:**
- `providerId` (requerido): ID del proveedor
- `productos` (requerido): Array de productos a comprar
  - `productId` (requerido): ID del producto
  - `cantidad` (requerido): Cantidad a comprar (> 0)
  - `precioUnitario` (requerido): Precio unitario de compra (> 0)
- `igvPorcentaje` (opcional): Porcentaje de IGV (por defecto 18%)
- `observaciones` (opcional): Observaciones adicionales
- `userId` (opcional): ID del usuario que crea la orden

**Respuesta exitosa:**
```json
{
  "data": {
    "id": 1,
    "fechaOrden": "2024-11-04",
    "estado": "pendiente",
    "subtotal": 275.00,
    "igv": 49.50,
    "total": 324.50,
    "observaciones": "Entrega urgente",
    "provider": {
      "id": 1,
      "razonSocial": "Distribuidora ABC S.A.C.",
      "ruc": "20123456789"
    },
    "detail_order_buys": [
      {
        "id": 1,
        "cantidad": 50,
        "precioUnitario": 2.50,
        "subtotal": 125.00,
        "product": {...}
      },
      {
        "id": 2,
        "cantidad": 30,
        "precioUnitario": 5.00,
        "subtotal": 150.00,
        "product": {...}
      }
    ]
  },
  "message": "Orden de compra creada exitosamente",
  "summary": {
    "orderId": 1,
    "provider": "Distribuidora ABC S.A.C.",
    "totalProductos": 2,
    "subtotal": 275.00,
    "igv": 49.50,
    "total": 324.50
  }
}
```

**Cálculo de totales:**
- `subtotal = Σ(cantidad × precioUnitario)` de todos los productos
- `igv = subtotal × (igvPorcentaje / 100)`
- `total = subtotal + igv`

**Errores:**
- `400`: Debe proporcionar el ID del proveedor
- `400`: Debe incluir al menos un producto en la orden
- `404`: Proveedor no encontrado
- `400`: Cada producto debe tener productId, cantidad y precioUnitario
- `400`: La cantidad debe ser mayor a 0
- `400`: El precio unitario debe ser mayor a 0
- `404`: Producto con ID X no encontrado

---

### 2. Recibir Orden de Compra
**POST** `/api/order-buys/receive`

Marca una orden como recibida y actualiza automáticamente el stock de todos los productos.

**Body:**
```json
{
  "orderId": 1
}
```

**Parámetros:**
- `orderId` (requerido): ID de la orden a recibir

**Respuesta exitosa:**
```json
{
  "data": {
    "id": 1,
    "fechaOrden": "2024-11-04",
    "estado": "recibida",
    "subtotal": 275.00,
    "igv": 49.50,
    "total": 324.50,
    "provider": {...},
    "detail_order_buys": [...]
  },
  "message": "Orden de compra recibida exitosamente. Stock actualizado.",
  "updatedProducts": [
    {
      "productId": 5,
      "productName": "Leche entera 1L",
      "previousStock": 100,
      "addedQuantity": 50,
      "newStock": 150
    },
    {
      "productId": 10,
      "productName": "Arroz 1kg",
      "previousStock": 80,
      "addedQuantity": 30,
      "newStock": 110
    }
  ]
}
```

**Proceso:**
1. Valida que la orden exista y esté en estado "pendiente"
2. Para cada producto en la orden:
   - Obtiene el stock actual
   - Suma la cantidad recibida
   - Actualiza el stock en la base de datos
3. Cambia el estado de la orden a "recibida"
4. Retorna el detalle de todos los productos actualizados

**Errores:**
- `400`: Debe proporcionar el ID de la orden
- `404`: Orden de compra no encontrada
- `400`: Esta orden ya fue recibida
- `400`: No se puede recibir una orden cancelada

---

### 3. Cancelar Orden de Compra
**POST** `/api/order-buys/cancel`

Cancela una orden de compra pendiente.

**Body:**
```json
{
  "orderId": 1,
  "motivo": "Proveedor no puede entregar en la fecha acordada"
}
```

**Parámetros:**
- `orderId` (requerido): ID de la orden a cancelar
- `motivo` (opcional): Motivo de la cancelación

**Respuesta exitosa:**
```json
{
  "data": {
    "id": 1,
    "fechaOrden": "2024-11-04",
    "estado": "cancelada",
    "subtotal": 275.00,
    "igv": 49.50,
    "total": 324.50,
    "observaciones": "Entrega urgente\nCANCELADA: Proveedor no puede entregar en la fecha acordada",
    "provider": {...},
    "detail_order_buys": [...]
  },
  "message": "Orden de compra cancelada exitosamente"
}
```

**Errores:**
- `400`: Debe proporcionar el ID de la orden
- `404`: Orden de compra no encontrada
- `400`: No se puede cancelar una orden que ya fue recibida
- `400`: Esta orden ya está cancelada

---

### 4. Endpoints CRUD Estándar

Además de los endpoints personalizados, también están disponibles los endpoints CRUD estándar:

- **GET** `/api/order-buys` - Listar todas las órdenes
- **GET** `/api/order-buys/:id` - Obtener una orden específica
- **POST** `/api/order-buys` - Crear una orden (usar mejor `/create-order`)
- **PUT** `/api/order-buys/:id` - Actualizar una orden
- **DELETE** `/api/order-buys/:id` - Eliminar una orden

## Estados de la Orden

| Estado | Descripción | Acciones Permitidas |
|--------|-------------|---------------------|
| `pendiente` | Orden creada, esperando recepción | Recibir, Cancelar |
| `recibida` | Orden recibida, stock actualizado | Ninguna (final) |
| `cancelada` | Orden cancelada | Ninguna (final) |

## Flujo de Trabajo Completo

### Caso 1: Orden Normal (Crear → Recibir)

**Paso 1: Crear la orden**
```bash
POST http://localhost:1337/api/order-buys/create-order
Content-Type: application/json

{
  "providerId": 1,
  "productos": [
    {
      "productId": 5,
      "cantidad": 100,
      "precioUnitario": 2.50
    }
  ],
  "igvPorcentaje": 18,
  "observaciones": "Entrega para el viernes",
  "userId": 1
}
```

**Paso 2: Cuando llega la mercadería, recibir la orden**
```bash
POST http://localhost:1337/api/order-buys/receive
Content-Type: application/json

{
  "orderId": 1
}
```

Esto automáticamente:
- Actualiza el stock de todos los productos
- Cambia el estado a "recibida"

---

### Caso 2: Orden Cancelada

**Paso 1: Crear la orden**
```bash
POST http://localhost:1337/api/order-buys/create-order
...
```

**Paso 2: Si surge un problema, cancelar**
```bash
POST http://localhost:1337/api/order-buys/cancel
Content-Type: application/json

{
  "orderId": 1,
  "motivo": "Proveedor sin stock"
}
```

---

## Ejemplos de Uso con cURL

### Crear orden de compra:
```bash
curl -X POST http://localhost:1337/api/order-buys/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": 1,
    "productos": [
      {
        "productId": 5,
        "cantidad": 50,
        "precioUnitario": 2.50
      },
      {
        "productId": 10,
        "cantidad": 30,
        "precioUnitario": 5.00
      }
    ],
    "igvPorcentaje": 18,
    "observaciones": "Entrega urgente",
    "userId": 1
  }'
```

### Recibir orden:
```bash
curl -X POST http://localhost:1337/api/order-buys/receive \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1
  }'
```

### Cancelar orden:
```bash
curl -X POST http://localhost:1337/api/order-buys/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "motivo": "Proveedor no puede entregar"
  }'
```

### Listar todas las órdenes:
```bash
curl http://localhost:1337/api/order-buys
```

### Obtener una orden específica:
```bash
curl http://localhost:1337/api/order-buys/1
```

## Validaciones Implementadas

✅ **Proveedor debe existir**
✅ **Al menos un producto en la orden**
✅ **Cada producto debe existir**
✅ **Cantidades deben ser mayores a 0**
✅ **Precios deben ser mayores a 0**
✅ **No se puede recibir una orden ya recibida**
✅ **No se puede recibir una orden cancelada**
✅ **No se puede cancelar una orden ya recibida**
✅ **Transacciones atómicas** para integridad de datos

## Integración con Otros Módulos

### Con Productos
- Al recibir una orden, se actualiza automáticamente el stock de cada producto
- Se valida que todos los productos existan antes de crear la orden

### Con Proveedores
- Cada orden está asociada a un proveedor
- Se valida que el proveedor exista

### Con Usuarios
- Se puede asociar cada orden con el usuario que la creó
- Útil para auditoría y trazabilidad

## Reportes Sugeridos

1. **Órdenes Pendientes**: Filtrar por `estado: "pendiente"`
2. **Órdenes Recibidas por Fecha**: Filtrar por `estado: "recibida"` y rango de fechas
3. **Órdenes por Proveedor**: Filtrar por `provider`
4. **Total de Compras por Período**: Sumar `total` de órdenes recibidas
5. **Órdenes Canceladas**: Filtrar por `estado: "cancelada"` para análisis

## Diferencias con Ventas

| Característica | Orden de Compra | Venta |
|----------------|-----------------|-------|
| Dirección | Entrada de productos | Salida de productos |
| Stock | Aumenta al recibir | Disminuye al vender |
| Precio | Precio de compra | Precio de venta |
| Relación | Con proveedor | Con cliente/usuario |
| IGV | Se paga al proveedor | Se cobra al cliente |

## Notas Importantes

⚠️ **Seguridad**: Los endpoints están configurados con `auth: false` solo para desarrollo. En producción, configura los permisos apropiados.

✅ **Transacciones**: Se usan transacciones para garantizar que la orden y sus detalles siempre estén sincronizados.

✅ **Stock Automático**: Al recibir una orden, el stock se actualiza automáticamente sin intervención manual.

✅ **Trazabilidad**: Todas las órdenes quedan registradas con fecha, proveedor, usuario y estado.

✅ **Cálculos Automáticos**: Los subtotales, IGV y total se calculan automáticamente.

## Próximas Mejoras Sugeridas

- [ ] Notificaciones cuando una orden está pendiente por mucho tiempo
- [ ] Recepción parcial de órdenes
- [ ] Devoluciones a proveedores
- [ ] Historial de precios de compra por producto
- [ ] Comparación de precios entre proveedores
- [ ] Órdenes recurrentes automáticas
