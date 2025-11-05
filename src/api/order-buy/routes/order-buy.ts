/**
 * order-buy router
 */

export default {
  routes: [
    // Rutas personalizadas PRIMERO (antes de las rutas con parámetros)
    {
      method: 'POST',
      path: '/order-buys/create-order',
      handler: 'order-buy.createOrder',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/order-buys/receive',
      handler: 'order-buy.receiveOrder',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/order-buys/approve',
      handler: 'order-buy.approveOrder',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/order-buys/reject',
      handler: 'order-buy.rejectOrder',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/order-buys/request-changes',
      handler: 'order-buy.requestChanges',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/order-buys/cancel',
      handler: 'order-buy.cancelOrder',
      config: {
        auth: false,
      },
    },
    // Rutas CRUD estándar (con parámetros al final)
    {
      method: 'GET',
      path: '/order-buys',
      handler: 'order-buy.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/order-buys/:id',
      handler: 'order-buy.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/order-buys',
      handler: 'order-buy.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/order-buys/:id',
      handler: 'order-buy.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/order-buys/:id',
      handler: 'order-buy.delete',
      config: {
        auth: false,
      },
    },
  ],
};
