/**
 * order-buy controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::order-buy.order-buy', ({ strapi }) => ({
  
  // Crear orden de compra completa
  async createOrder(ctx) {
    try {
      const { providerId, productos, igvPorcentaje, observaciones, userId } = ctx.request.body;

      // Validaciones
      if (!providerId) {
        return ctx.badRequest('Debe proporcionar el ID del proveedor');
      }

      if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return ctx.badRequest('Debe incluir al menos un producto en la orden');
      }

      // Validar que el proveedor exista
      const provider = await strapi.entityService.findOne('api::provider.provider', providerId);
      if (!provider) {
        return ctx.notFound('Proveedor no encontrado');
      }

      // Validar cada producto
      for (const prod of productos) {
        if (!prod.productId || !prod.cantidad || !prod.precioUnitario) {
          return ctx.badRequest('Cada producto debe tener productId, cantidad y precioUnitario');
        }
        if (prod.cantidad <= 0) {
          return ctx.badRequest('La cantidad debe ser mayor a 0');
        }
        if (prod.precioUnitario <= 0) {
          return ctx.badRequest('El precio unitario debe ser mayor a 0');
        }
      }

      console.log('Datos recibidos:', JSON.stringify({ providerId, productos, igvPorcentaje, observaciones }, null, 2));

      // Calcular totales
      let subtotal = 0;
      for (const prod of productos) {
        const subtotalProducto = parseFloat(String(prod.cantidad)) * parseFloat(String(prod.precioUnitario));
        subtotal += subtotalProducto;
      }

      const igvDecimal = igvPorcentaje ? parseFloat(String(igvPorcentaje)) / 100 : 0.18; // Por defecto 18%
      const igv = subtotal * igvDecimal;
      const total = subtotal + igv;

      // Usar transacción para asegurar consistencia
      const result = await strapi.db.transaction(async () => {
        // 1. Crear la orden de compra
        const orderBuy = await strapi.entityService.create('api::order-buy.order-buy', {
          data: {
            fechaOrden: new Date(),
            estado: 'pendiente',
            subtotal: subtotal,
            igv: igv,
            total: total,
            observaciones: observaciones || '',
            provider: providerId,
            users_permissions_user: userId || null,
            publishedAt: new Date()
          }
        });

        console.log('Orden de compra creada:', orderBuy);

        // 2. Crear los detalles de la orden
        const details = [];
        for (const prod of productos) {
          // Verificar que el producto exista
          const product = await strapi.entityService.findOne('api::product.product', prod.productId);
          if (!product) {
            throw new Error(`Producto con ID ${prod.productId} no encontrado`);
          }

          const subtotalProducto = parseFloat(String(prod.cantidad)) * parseFloat(String(prod.precioUnitario));

          const detail = await strapi.entityService.create('api::detail-order-buy.detail-order-buy', {
            data: {
              cantidad: parseInt(String(prod.cantidad)),
              precioUnitario: parseFloat(String(prod.precioUnitario)),
              subtotal: subtotalProducto,
              product: prod.productId,
              order_buy: orderBuy.id,
              publishedAt: new Date()
            }
          });

          console.log('Detalle creado:', detail);
          details.push(detail);
        }

        return {
          orderBuy,
          details
        };
      });

      // Obtener la orden completa con relaciones
      const orderComplete: any = await strapi.entityService.findOne('api::order-buy.order-buy', result.orderBuy.id, {
        populate: ['provider', 'detail_order_buys', 'users_permissions_user']
      });

      return {
        data: orderComplete,
        message: 'Orden de compra creada exitosamente',
        summary: {
          orderId: result.orderBuy.id,
          provider: provider.razonSocial,
          totalProductos: productos.length,
          subtotal: subtotal,
          igv: igv,
          total: total
        }
      };

    } catch (error) {
      console.error('Error al crear orden de compra:', error);
      strapi.log.error('Error al crear orden de compra:', error);
      return ctx.badRequest(error.message || 'Error al crear la orden de compra');
    }
  },

  // Recibir orden de compra (actualiza stock)
  async receiveOrder(ctx) {
    try {
      const { orderId } = ctx.request.body;

      if (!orderId) {
        return ctx.badRequest('Debe proporcionar el ID de la orden');
      }

      // Obtener la orden con sus detalles
      const order: any = await strapi.entityService.findOne('api::order-buy.order-buy', orderId, {
        populate: ['detail_order_buys', 'provider']
      });

      if (!order) {
        return ctx.notFound('Orden de compra no encontrada');
      }

      if (order.estado === 'recibida') {
        return ctx.badRequest('Esta orden ya fue recibida');
      }

      if (order.estado === 'cancelada') {
        return ctx.badRequest('No se puede recibir una orden cancelada');
      }

      if (order.estado !== 'aprobada') {
        return ctx.badRequest('La orden debe estar aprobada antes de poder ser recibida');
      }

      // Usar transacción
      const result = await strapi.db.transaction(async () => {
        const updatedProducts = [];

        // Actualizar stock de cada producto
        if (order.detail_order_buys && Array.isArray(order.detail_order_buys)) {
          for (const detail of order.detail_order_buys) {
            const detailComplete: any = await strapi.entityService.findOne('api::detail-order-buy.detail-order-buy', detail.id, {
              populate: ['product']
            });

            if (detailComplete && detailComplete.product) {
              const product = detailComplete.product;
              const currentStock = parseInt(String(product.stock || 0));
              const newStock = currentStock + parseInt(String(detailComplete.cantidad));

              const updatedProduct = await strapi.entityService.update('api::product.product', product.id, {
                data: {
                  stock: newStock
                }
              });

              updatedProducts.push({
                productId: product.id,
                productName: product.descripcion,
                previousStock: currentStock,
                addedQuantity: detailComplete.cantidad,
                newStock: newStock
              });
            }
          }
        }

        // Actualizar estado de la orden
        const updatedOrder = await strapi.entityService.update('api::order-buy.order-buy', orderId, {
          data: {
            estado: 'recibida'
          },
          populate: ['provider', 'detail_order_buys', 'users_permissions_user']
        });

        return {
          updatedOrder,
          updatedProducts
        };
      });

      return {
        data: result.updatedOrder,
        message: 'Orden de compra recibida exitosamente. Stock actualizado.',
        updatedProducts: result.updatedProducts
      };

    } catch (error) {
      console.error('Error al recibir orden:', error);
      strapi.log.error('Error al recibir orden:', error);
      return ctx.badRequest(error.message || 'Error al recibir la orden');
    }
  },

  // Cancelar orden de compra
  async cancelOrder(ctx) {
    try {
      const { orderId, motivo } = ctx.request.body;

      if (!orderId) {
        return ctx.badRequest('Debe proporcionar el ID de la orden');
      }

      const order = await strapi.entityService.findOne('api::order-buy.order-buy', orderId);

      if (!order) {
        return ctx.notFound('Orden de compra no encontrada');
      }

      if (order.estado === 'recibida') {
        return ctx.badRequest('No se puede cancelar una orden que ya fue recibida');
      }

      if (order.estado === 'cancelada') {
        return ctx.badRequest('Esta orden ya está cancelada');
      }

      const updatedOrder = await strapi.entityService.update('api::order-buy.order-buy', orderId, {
        data: {
          estado: 'cancelada',
          observaciones: `${order.observaciones || ''}\nCANCELADA: ${motivo || 'Sin motivo especificado'}`
        },
        populate: ['provider', 'detail_order_buys', 'users_permissions_user']
      });

      return {
        data: updatedOrder,
        message: 'Orden de compra cancelada exitosamente'
      };

    } catch (error) {
      console.error('Error al cancelar orden:', error);
      strapi.log.error('Error al cancelar orden:', error);
      return ctx.badRequest(error.message || 'Error al cancelar la orden');
    }
  },

  // Aprobar orden de compra
  async approveOrder(ctx) {
    try {
      const { orderId, approverUserId, notes } = ctx.request.body;

      if (!orderId) {
        return ctx.badRequest('Debe proporcionar el ID de la orden');
      }

      const order: any = await strapi.entityService.findOne('api::order-buy.order-buy', orderId, {
        populate: ['provider', 'detail_order_buys', 'users_permissions_user']
      });

      if (!order) {
        return ctx.notFound('Orden de compra no encontrada');
      }

      if (order.estado !== 'pendiente') {
        return ctx.badRequest('Solo se pueden aprobar órdenes en estado pendiente');
      }

      // Validación de permisos mínima
      if (approverUserId) {
        const approver = await strapi.query('plugin::users-permissions.user').findOne({ where: { id: approverUserId }, populate: ['role'] });
        const roleName = approver?.role?.name || '';
        if (roleName && !['Gerente', 'Administrador'].includes(roleName)) {
          return ctx.forbidden('No tiene permisos para aprobar órdenes');
        }
      }

      const updated = await strapi.entityService.update('api::order-buy.order-buy', orderId, {
        data: {
          estado: 'aprobada',
          approvedAt: new Date(),
          approvalNotes: notes || null,
          approvedBy: approverUserId || null,
        },
        populate: ['provider', 'detail_order_buys', 'users_permissions_user']
      });

      return {
        data: updated,
        message: `Orden de compra #${orderId} aprobada exitosamente`
      };
    } catch (error) {
      console.error('Error al aprobar orden:', error);
      strapi.log.error('Error al aprobar orden:', error);
      return ctx.badRequest(error.message || 'Error al aprobar la orden');
    }
  },

  // Rechazar orden de compra
  async rejectOrder(ctx) {
    try {
      const { orderId, approverUserId, reason, details } = ctx.request.body;

      if (!orderId) {
        return ctx.badRequest('Debe proporcionar el ID de la orden');
      }
      if (!reason) {
        return ctx.badRequest('Debe seleccionar un motivo de rechazo');
      }
      const validReasons = ['precio', 'proveedor', 'cantidad', 'prioridad', 'presupuesto', 'otro'];
      if (!validReasons.includes(reason)) {
        return ctx.badRequest('Motivo de rechazo inválido');
      }
      if (reason === 'otro' && (!details || !String(details).trim())) {
        return ctx.badRequest('Debe especificar detalles cuando el motivo es "Otro"');
      }

      const order: any = await strapi.entityService.findOne('api::order-buy.order-buy', orderId);
      if (!order) {
        return ctx.notFound('Orden de compra no encontrada');
      }
      if (order.estado !== 'pendiente') {
        return ctx.badRequest('Solo se pueden rechazar órdenes en estado pendiente');
      }

      if (approverUserId) {
        const approver = await strapi.query('plugin::users-permissions.user').findOne({ where: { id: approverUserId }, populate: ['role'] });
        const roleName = approver?.role?.name || '';
        if (roleName && !['Gerente', 'Administrador'].includes(roleName)) {
          return ctx.forbidden('No tiene permisos para rechazar órdenes');
        }
      }

      const updated = await strapi.entityService.update('api::order-buy.order-buy', orderId, {
        data: {
          estado: 'rechazada',
          rejectionReason: reason,
          rejectionDetails: details || null,
          rejectedAt: new Date(),
          rejectedBy: approverUserId || null,
        },
        populate: ['provider', 'detail_order_buys', 'users_permissions_user']
      });

      return {
        data: updated,
        message: `Orden de compra #${orderId} rechazada`
      };
    } catch (error) {
      console.error('Error al rechazar orden:', error);
      strapi.log.error('Error al rechazar orden:', error);
      return ctx.badRequest(error.message || 'Error al rechazar la orden');
    }
  },

  // Solicitar modificaciones
  async requestChanges(ctx) {
    try {
      const { orderId, requesterUserId, aspects, details } = ctx.request.body;

      if (!orderId) {
        return ctx.badRequest('Debe proporcionar el ID de la orden');
      }
      if (!Array.isArray(aspects) || aspects.length === 0) {
        return ctx.badRequest('Debe seleccionar al menos un aspecto a modificar');
      }
      if (!details || !String(details).trim()) {
        return ctx.badRequest('Debe detallar las modificaciones solicitadas');
      }

      const order: any = await strapi.entityService.findOne('api::order-buy.order-buy', orderId);
      if (!order) {
        return ctx.notFound('Orden de compra no encontrada');
      }
      if (order.estado !== 'pendiente') {
        return ctx.badRequest('Solo se pueden solicitar cambios para órdenes pendientes');
      }

      const updated = await strapi.entityService.update('api::order-buy.order-buy', orderId, {
        data: {
          estado: 'en_revision',
          modificationAspects: aspects,
          modificationDetails: details,
          modificationRequestedAt: new Date(),
          modificationRequestedBy: requesterUserId || null,
        },
        populate: ['provider', 'detail_order_buys', 'users_permissions_user']
      });

      return {
        data: updated,
        message: `Solicitud de modificación enviada para la orden #${orderId}`
      };
    } catch (error) {
      console.error('Error al solicitar modificaciones:', error);
      strapi.log.error('Error al solicitar modificaciones:', error);
      return ctx.badRequest(error.message || 'Error al solicitar modificaciones');
    }
  }
}));
