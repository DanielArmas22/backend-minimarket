/**
 * cash-register router
 */

export default {
  routes: [
    // Rutas personalizadas PRIMERO (antes de las rutas con parámetros)
    {
      method: 'GET',
      path: '/cash-registers/current-open',
      handler: 'cash-register.getCurrentOpen',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/cash-registers/open',
      handler: 'cash-register.open',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/cash-registers/close',
      handler: 'cash-register.close',
      config: {
        auth: false,
      },
    },
    // Rutas CRUD estándar (con parámetros al final)
    {
      method: 'GET',
      path: '/cash-registers',
      handler: 'cash-register.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/cash-registers/:id',
      handler: 'cash-register.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/cash-registers',
      handler: 'cash-register.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/cash-registers/:id',
      handler: 'cash-register.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/cash-registers/:id',
      handler: 'cash-register.delete',
      config: {
        auth: false,
      },
    },
  ],
};
