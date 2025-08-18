import PDFDocument from 'pdfkit';
import { type OrderWithDetails } from "@shared/schema";

export function generateTicketPDF(order: OrderWithDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [226, 600], margin: 10 }); // Thermal printer size
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Business header
      doc.fontSize(16).font('Helvetica-Bold').text('PIZZA & CIA', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Comidas Típicas & Caldos', { align: 'center' });
      doc.text('(11) 99999-9999', { align: 'center' });
      
      // Separator
      doc.moveDown();
      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown();

      // Order details
      doc.fontSize(10).font('Helvetica');
      doc.text(`Pedido: #${order.orderNumber.toString().padStart(3, '0')}`);
      doc.text(`Data/Hora: ${order.createdAt.toLocaleString('pt-BR')}`);
      doc.text(`Vendedor: ${order.vendor.name}`);
      
      if (order.customerName) {
        doc.text(`Cliente: ${order.customerName}`);
      }

      doc.moveDown();
      doc.text('----------------------------------------', { align: 'center' });
      doc.text('ITENS', { align: 'center' });
      doc.text('----------------------------------------', { align: 'center' });

      // Items
      order.items.forEach(item => {
        const productName = `${item.product.name}${item.product.size !== 'unico' ? ` ${item.product.size}` : ''}`;
        doc.text(`${item.quantity}x ${productName}`);
        doc.text(`  R$ ${Number(item.totalPrice).toFixed(2)}`, { align: 'right' });
      });

      doc.moveDown();
      doc.text('----------------------------------------', { align: 'center' });
      
      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`TOTAL: R$ ${Number(order.totalAmount).toFixed(2)}`, { align: 'center' });
      
      doc.fontSize(10).font('Helvetica');
      doc.text('----------------------------------------', { align: 'center' });

      // Payment info
      const paymentMethodText = {
        'dinheiro': 'Dinheiro',
        'pix': 'PIX',
        'aberto': 'Em Aberto'
      }[order.paymentMethod] || order.paymentMethod;

      const paymentStatusText = order.paymentStatus === 'realizado' ? 'Realizado ✅' : 'Pendente ⏳';
      const deliveryStatusText = order.deliveryStatus === 'realizada' ? 'Entregue ✅' : 'Pendente ⏳';

      doc.text(`Forma Pagto: ${paymentMethodText}`);
      doc.text(`Status Pagto: ${paymentStatusText}`);
      doc.text(`Status Entrega: ${deliveryStatusText}`);

      doc.moveDown();
      doc.text('----------------------------------------', { align: 'center' });

      // Footer
      doc.fontSize(9).text('Obrigado pela preferência!', { align: 'center' });
      doc.text('www.pizzaecia.com.br', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
