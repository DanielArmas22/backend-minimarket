/**
 * sale controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::sale.sale', ({ strapi }) => ({
  async create(ctx) {
    try {
      const { data } = ctx.request.body;
      
      // Validar que existan productos vendidos
      if (!data.productosVendidos || !Array.isArray(data.productosVendidos) || data.productosVendidos.length === 0) {
        return ctx.badRequest('Debe incluir productos en la venta');
      }

      console.log('Datos recibidos:', JSON.stringify(data, null, 2));

      // Iniciar transacción
      const result = await strapi.db.transaction(async (trx) => {
        // 1. Crear la venta
        const sale = await strapi.entityService.create('api::sale.sale', {
          data: {
            date: data.fechaVenta || new Date(),
            total: data.totalVenta || 0,
            users_permissions_user: null, // Por ahora null como solicitas
            payment: null, // Por ahora null como solicitas
            publishedAt: new Date()
          }
        });

        console.log('Venta creada:', sale);

        // 2. Procesar cada producto vendido
        const detailSales = [];
        
        for (const productoVendido of data.productosVendidos) {
          const { productId, productName, price, quantity, subtotal } = productoVendido;

          // Obtener el producto actual para verificar stock
          const products = await strapi.entityService.findMany('api::product.product', {
            filters: { id: productId },
            populate: []
          });
          const product = products && products.length > 0 ? products[0] : null;

          if (!product) {
            throw new Error(`Producto con ID ${productId} no encontrado`);
          }

          console.log(`Producto ${productName}: Stock actual ${product.stock}, Cantidad a vender: ${quantity}`);

          // Verificar stock disponible
          if (parseInt(product.stock) < quantity) {
            throw new Error(`Stock insuficiente para el producto ${productName}. Stock disponible: ${product.stock}, Solicitado: ${quantity}`);
          }

          // 3. Actualizar stock del producto
          const newStock = parseInt(product.stock) - quantity;
          await strapi.entityService.update('api::product.product', product.id, {
            data: {
              stock: newStock
            }
          });

          console.log(`Stock actualizado para ${productName}: ${product.stock} -> ${newStock}`);

          // 4. Crear detail-sale
          const detailSale = await strapi.entityService.create('api::detail-sale.detail-sale', {
            data: {
              cantidad: quantity,
              precio_unitario: price,
              subtotal: subtotal,
              sale: sale.id,
              product: product.id,
              publishedAt: new Date()
            }
          });

          console.log('Detail sale creado:', detailSale);
          detailSales.push(detailSale);
        }

        return {
          sale,
          detailSales
        };
      });

      // Retornar la respuesta exitosa
      return {
        data: result.sale,
        details: result.detailSales,
        message: 'Venta procesada exitosamente',
        totalProductos: data.productosVendidos.length,
        totalVenta: data.totalVenta
      };

    } catch (error) {
      console.error('Error al procesar venta:', error);
      strapi.log.error('Error al crear venta:', error);
      return ctx.badRequest(error.message || 'Error al procesar la venta');
    }
  }
}));
