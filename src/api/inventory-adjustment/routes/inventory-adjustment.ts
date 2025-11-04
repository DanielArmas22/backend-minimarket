/**
 * inventory-adjustment router
 */

export default {
  routes: [
    // Rutas personalizadas PRIMERO (antes de las rutas con parámetros)
    {
      method: 'POST',
      path: '/inventory-adjustments/adjust',
      handler: 'inventory-adjustment.adjust',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/inventory-adjustments/product/:productId/history',
      handler: 'inventory-adjustment.getProductHistory',
      config: {
        auth: false,
      },
    },
    // Rutas CRUD estándar (con parámetros al final)
    {
      method: 'GET',
      path: '/inventory-adjustments',
      handler: 'inventory-adjustment.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/inventory-adjustments/:id',
      handler: 'inventory-adjustment.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/inventory-adjustments',
      handler: 'inventory-adjustment.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/inventory-adjustments/:id',
      handler: 'inventory-adjustment.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/inventory-adjustments/:id',
      handler: 'inventory-adjustment.delete',
      config: {
        auth: false,
      },
    },
  ],
};
