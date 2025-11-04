/**
 * cash-register router
 */

import { factories } from '@strapi/strapi';

const defaultRouter = factories.createCoreRouter('api::cash-register.cash-register');

const customRouter = (innerRouter, extraRoutes = []) => {
  let routes;
  return {
    get prefix() {
      return innerRouter.prefix;
    },
    get routes() {
      if (!routes) routes = innerRouter.routes.concat(extraRoutes);
      return routes;
    },
  };
};

const myExtraRoutes = [
  {
    method: 'POST',
    path: '/cash-registers/open',
    handler: 'cash-register.open',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'POST',
    path: '/cash-registers/close',
    handler: 'cash-register.close',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/cash-registers/current-open',
    handler: 'cash-register.getCurrentOpen',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

export default customRouter(defaultRouter, myExtraRoutes);
