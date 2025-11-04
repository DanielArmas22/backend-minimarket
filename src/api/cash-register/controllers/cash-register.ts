/**
 * cash-register controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::cash-register.cash-register', ({ strapi }) => ({
  
  // Abrir caja
  async open(ctx) {
    try {
      const { initialAmount, userId } = ctx.request.body;

      // Validar que haya un monto inicial
      if (!initialAmount || initialAmount < 0) {
        return ctx.badRequest('El monto inicial debe ser mayor o igual a 0');
      }

      // Verificar si ya hay una caja abierta
      const openCashRegisters = await strapi.entityService.findMany('api::cash-register.cash-register', {
        filters: { status: 'open' },
        populate: ['users_permissions_user']
      });

      if (openCashRegisters && openCashRegisters.length > 0) {
        return ctx.badRequest('Ya existe una caja abierta. Debe cerrarla antes de abrir una nueva.');
      }

      // Crear nueva caja
      const cashRegister = await strapi.entityService.create('api::cash-register.cash-register', {
        data: {
          openingDate: new Date(),
          initialAmount: parseFloat(initialAmount),
          status: 'open',
          users_permissions_user: userId || null,
          publishedAt: new Date()
        },
        populate: ['users_permissions_user']
      });

      return {
        data: cashRegister,
        message: 'Caja abierta exitosamente'
      };

    } catch (error) {
      console.error('Error al abrir caja:', error);
      strapi.log.error('Error al abrir caja:', error);
      return ctx.badRequest(error.message || 'Error al abrir la caja');
    }
  },

  // Cerrar caja
  async close(ctx) {
    try {
      const { cashRegisterId, actualAmount, notes } = ctx.request.body;

      // Validar que exista el ID de la caja
      if (!cashRegisterId) {
        return ctx.badRequest('Debe proporcionar el ID de la caja a cerrar');
      }

      // Validar que haya un monto real
      if (actualAmount === undefined || actualAmount === null || actualAmount < 0) {
        return ctx.badRequest('El monto real debe ser mayor o igual a 0');
      }

      // Obtener la caja
      const cashRegister: any = await strapi.entityService.findOne('api::cash-register.cash-register', cashRegisterId, {
        populate: ['sales', 'users_permissions_user']
      });

      if (!cashRegister) {
        return ctx.notFound('Caja no encontrada');
      }

      if (cashRegister.status === 'closed') {
        return ctx.badRequest('Esta caja ya está cerrada');
      }

      // Calcular el monto esperado (inicial + ventas)
      let totalSales = 0;
      if (cashRegister.sales && Array.isArray(cashRegister.sales) && cashRegister.sales.length > 0) {
        for (const sale of cashRegister.sales) {
          const saleDetails: any = await strapi.entityService.findOne('api::sale.sale', sale.id, {
            populate: ['detail_sales']
          });
          
          if (saleDetails && saleDetails.detail_sales && Array.isArray(saleDetails.detail_sales)) {
            for (const detail of saleDetails.detail_sales) {
              totalSales += parseFloat(String(detail.subtotal || 0));
            }
          }
        }
      }

      const expectedAmount = parseFloat(String(cashRegister.initialAmount)) + totalSales;
      const difference = parseFloat(actualAmount) - expectedAmount;

      // Actualizar la caja
      const updatedCashRegister = await strapi.entityService.update(
        'api::cash-register.cash-register',
        cashRegisterId,
        {
          data: {
            closingDate: new Date(),
            expectedAmount: expectedAmount,
            actualAmount: parseFloat(actualAmount),
            difference: difference,
            status: 'closed',
            notes: notes || ''
          },
          populate: ['users_permissions_user', 'sales']
        }
      );

      return {
        data: updatedCashRegister,
        message: 'Caja cerrada exitosamente',
        summary: {
          initialAmount: cashRegister.initialAmount,
          totalSales: totalSales,
          expectedAmount: expectedAmount,
          actualAmount: parseFloat(actualAmount),
          difference: difference
        }
      };

    } catch (error) {
      console.error('Error al cerrar caja:', error);
      strapi.log.error('Error al cerrar caja:', error);
      return ctx.badRequest(error.message || 'Error al cerrar la caja');
    }
  },

  // Obtener caja abierta actual
  async getCurrentOpen(ctx) {
    try {
      const openCashRegisters = await strapi.entityService.findMany('api::cash-register.cash-register', {
        filters: { status: 'open' },
        populate: ['users_permissions_user', 'sales']
      });

      if (!openCashRegisters || openCashRegisters.length === 0) {
        return {
          data: null,
          message: 'No hay caja abierta actualmente'
        };
      }

      return {
        data: openCashRegisters[0],
        message: 'Caja abierta encontrada'
      };

    } catch (error) {
      console.error('Error al obtener caja abierta:', error);
      strapi.log.error('Error al obtener caja abierta:', error);
      return ctx.badRequest(error.message || 'Error al obtener la caja abierta');
    }
  }
}));
