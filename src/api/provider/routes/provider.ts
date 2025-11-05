/**
 * provider router
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/providers',
      handler: 'provider.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/providers/:id',
      handler: 'provider.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/providers',
      handler: 'provider.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/providers/:id',
      handler: 'provider.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/providers/:id',
      handler: 'provider.delete',
      config: {
        auth: false,
      },
    },
  ],
};
