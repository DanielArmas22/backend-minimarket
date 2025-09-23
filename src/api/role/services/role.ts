/**
 * role service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::role.role' as any, ({ strapi }: any) => ({
  // Método para validar permisos de un rol
  async validatePermissions(permissions: object): Promise<boolean> {
    try {
      // Estructura esperada de permisos
      const expectedKeys = ['dashboard', 'productos', 'ventas', 'clientes', 'reportes', 'configuracion'];
      const permissionKeys = Object.keys(permissions);
      
      // Verificar que tenga las claves esperadas
      const hasValidKeys = expectedKeys.every(key => permissionKeys.includes(key));
      
      if (!hasValidKeys) {
        return false;
      }

      // Verificar que cada permiso tenga la estructura correcta
      for (const [key, value] of Object.entries(permissions)) {
        if (typeof value !== 'object' || value === null) {
          return false;
        }
        
        const permissionValue = value as any;
        const requiredActions = ['ver', 'crear', 'editar', 'eliminar'];
        
        for (const action of requiredActions) {
          if (typeof permissionValue[action] !== 'boolean') {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  },

  // Método para obtener roles por nivel
  async findByLevel(level: number) {
    return await strapi.entityService.findMany('api::role.role' as any, {
      filters: { nivel: level, activo: true },
      sort: { nombre: 'asc' },
    });
  },

  // Método para verificar si un nombre de rol ya existe
  async checkRoleNameExists(nombre: string, excludeId?: number): Promise<boolean> {
    const filters: any = { nombre };
    
    if (excludeId) {
      filters.id = { $ne: excludeId };
    }

    const existingRole = await strapi.entityService.findMany('api::role.role' as any, {
      filters,
      limit: 1,
    });

    return Array.isArray(existingRole) ? existingRole.length > 0 : false;
  }
}));
