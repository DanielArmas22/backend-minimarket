/**
 * role controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::role.role' as any, ({ strapi }: any) => ({
  // Método personalizado para obtener roles activos
  async findActive(ctx: any) {
    try {
      const roles = await strapi.entityService.findMany('api::role.role' as any, {
        filters: { activo: true },
        sort: { nivel: 'asc', nombre: 'asc' },
        ...ctx.query,
      });

      return { data: roles };
    } catch (error) {
      ctx.throw(500, 'Error al obtener roles activos');
    }
  },

  // Método personalizado para validar permisos antes de crear/actualizar
  async create(ctx: any) {
    try {
      const { data } = ctx.request.body;
      
      // Validar estructura de permisos
      if (data.permisos && typeof data.permisos !== 'object') {
        return ctx.badRequest('Los permisos deben ser un objeto JSON válido');
      }

      const result = await super.create(ctx);
      return result;
    } catch (error) {
      ctx.throw(500, 'Error al crear el rol');
    }
  },

  async update(ctx: any) {
    try {
      const { data } = ctx.request.body;
      
      // Validar estructura de permisos
      if (data.permisos && typeof data.permisos !== 'object') {
        return ctx.badRequest('Los permisos deben ser un objeto JSON válido');
      }

      const result = await super.update(ctx);
      return result;
    } catch (error) {
      ctx.throw(500, 'Error al actualizar el rol');
    }
  }
}));
