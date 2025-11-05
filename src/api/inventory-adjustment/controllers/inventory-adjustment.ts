/**
 * inventory-adjustment controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::inventory-adjustment.inventory-adjustment', ({ strapi }) => ({
  
  // Ajustar inventario
  async adjust(ctx) {
    try {
      const { productId, adjustmentType, quantity, reason, reasonDescription, userId } = ctx.request.body;

      // Validaciones
      if (!productId) {
        return ctx.badRequest('Debe proporcionar el ID del producto');
      }

      if (!adjustmentType || !['increase', 'decrease'].includes(adjustmentType)) {
        return ctx.badRequest('El tipo de ajuste debe ser "increase" o "decrease"');
      }

      if (!quantity || quantity <= 0) {
        return ctx.badRequest('La cantidad debe ser mayor a 0');
      }

      if (!reason || !['merma', 'conteo', 'daño', 'devolucion', 'correccion', 'otro'].includes(reason)) {
        return ctx.badRequest('Debe proporcionar un motivo válido: merma, conteo, daño, devolucion, correccion, otro');
      }

      // Obtener el producto
      const product: any = await strapi.entityService.findOne('api::product.product', productId);

      if (!product) {
        return ctx.notFound('Producto no encontrado');
      }

      const previousStock = parseInt(String(product.stock || 0));
      let newStock: number;

      // Calcular nuevo stock
      if (adjustmentType === 'increase') {
        newStock = previousStock + parseInt(String(quantity));
      } else {
        newStock = previousStock - parseInt(String(quantity));
        
        // Validar que no quede stock negativo
        if (newStock < 0) {
          return ctx.badRequest(`No se puede disminuir el stock. Stock actual: ${previousStock}, Cantidad a disminuir: ${quantity}`);
        }
      }

      // Usar transacción para asegurar consistencia
      const result = await strapi.db.transaction(async () => {
        // 1. Actualizar el stock del producto
        const updatedProduct = await strapi.entityService.update('api::product.product', productId, {
          data: {
            stock: newStock
          }
        });

        // 2. Crear el registro de ajuste
        const adjustment = await strapi.entityService.create('api::inventory-adjustment.inventory-adjustment', {
          data: {
            adjustmentDate: new Date(),
            adjustmentType: adjustmentType,
            quantity: parseInt(String(quantity)),
            reason: reason,
            reasonDescription: reasonDescription || '',
            previousStock: previousStock,
            newStock: newStock,
            product: productId,
            users_permissions_user: userId || null,
            publishedAt: new Date()
          },
          populate: ['product', 'users_permissions_user']
        });

        return {
          adjustment,
          updatedProduct
        };
      });

      return {
        data: result.adjustment,
        message: 'Ajuste de inventario realizado exitosamente',
        summary: {
          productId: productId,
          productDescription: product.descripcion,
          adjustmentType: adjustmentType,
          quantity: quantity,
          previousStock: previousStock,
          newStock: newStock,
          difference: newStock - previousStock
        }
      };

    } catch (error) {
      console.error('Error al ajustar inventario:', error);
      strapi.log.error('Error al ajustar inventario:', error);
      return ctx.badRequest(error.message || 'Error al ajustar el inventario');
    }
  },

  // Obtener historial de ajustes de un producto
  async getProductHistory(ctx) {
    try {
      const { productId } = ctx.params;

      if (!productId) {
        return ctx.badRequest('Debe proporcionar el ID del producto');
      }

      const adjustments = await strapi.entityService.findMany('api::inventory-adjustment.inventory-adjustment', {
        filters: { product: productId },
        populate: ['product', 'users_permissions_user'],
        sort: { adjustmentDate: 'desc' }
      });

      return {
        data: adjustments,
        message: 'Historial de ajustes obtenido exitosamente',
        total: adjustments.length
      };

    } catch (error) {
      console.error('Error al obtener historial:', error);
      strapi.log.error('Error al obtener historial:', error);
      return ctx.badRequest(error.message || 'Error al obtener el historial');
    }
  }
}));
