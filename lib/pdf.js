import PDFDocument from 'pdfkit';

export function generateA4Invoice(invoice, shopInfo) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Use Courier font to avoid Helvetica.afm file issues in Next.js
      doc.font('Courier');

      // Header
      doc.fontSize(20).text(shopInfo.name || 'Jewelry Store', { align: 'center' });
      doc.fontSize(10).text(shopInfo.address || '', { align: 'center' });
      doc.text(`Phone: ${shopInfo.phone || ''} | GST: ${shopInfo.gst || ''}`, { align: 'center' });
      doc.moveDown();

      // Invoice details
      doc.fontSize(12).text(`Invoice #: ${invoice.id}`, { align: 'left' });
      doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`);
      doc.text(`Customer: ${invoice.customer?.name || 'Walk-in'}`);
      if (invoice.customer?.whatsapp) {
        doc.text(`WhatsApp: ${invoice.customer.whatsapp}`);
      }
      doc.moveDown();

      // Table header
      const tableTop = doc.y;
      doc.fontSize(10).text('Item', 50, tableTop, { width: 200 });
      doc.text('Qty', 250, tableTop, { width: 50 });
      doc.text('Price', 300, tableTop, { width: 100 });
      doc.text('Total', 400, tableTop, { width: 100 });
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Items
      let y = tableTop + 25;
      invoice.items.forEach((item) => {
        doc.text(item.name, 50, y, { width: 200 });
        doc.text(item.qty.toString(), 250, y, { width: 50 });
        doc.text(`₹${item.price.toFixed(2)}`, 300, y, { width: 100 });
        doc.text(`₹${(item.qty * item.price).toFixed(2)}`, 400, y, { width: 100 });
        y += 20;
      });

      doc.moveDown();
      y = doc.y + 10;

      // Totals
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;
      doc.text(`Subtotal:`, 350, y);
      doc.text(`₹${invoice.subTotal.toFixed(2)}`, 450, y);
      y += 20;

      if (invoice.discountPercent > 0) {
        doc.text(`Discount (${invoice.discountPercent}%):`, 350, y);
        doc.text(`-₹${(invoice.subTotal * invoice.discountPercent / 100).toFixed(2)}`, 450, y);
        y += 20;
      }

      doc.fontSize(12).text(`Grand Total:`, 350, y);
      doc.text(`₹${invoice.grandTotal.toFixed(2)}`, 450, y);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export function generateThermalInvoice(invoice, shopInfo) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [226.8, 841.89], margin: 10 }); // 80mm width
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Use Courier font to avoid Helvetica.afm file issues in Next.js
      doc.font('Courier');

      // Header
      doc.fontSize(12).text(shopInfo.name || 'Jewelry Store', { align: 'center' });
      doc.fontSize(8).text(shopInfo.address || '', { align: 'center' });
      doc.text(`Ph: ${shopInfo.phone || ''}`, { align: 'center' });
      doc.text(`GST: ${shopInfo.gst || ''}`, { align: 'center' });
      doc.moveDown();

      // Invoice details
      doc.fontSize(8);
      doc.text(`Invoice: ${invoice.id}`);
      doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`);
      doc.text(`Customer: ${invoice.customer?.name || 'Walk-in'}`);
      doc.moveDown();

      // Items
      doc.text('--------------------------------');
      invoice.items.forEach((item) => {
        doc.text(`${item.name}`);
        doc.text(`  ${item.qty} x ₹${item.price} = ₹${(item.qty * item.price).toFixed(2)}`);
      });
      doc.text('--------------------------------');

      // Totals
      doc.text(`Subtotal: ₹${invoice.subTotal.toFixed(2)}`);
      if (invoice.discountPercent > 0) {
        doc.text(`Discount (${invoice.discountPercent}%): -₹${(invoice.subTotal * invoice.discountPercent / 100).toFixed(2)}`);
      }
      doc.fontSize(10).text(`TOTAL: ₹${invoice.grandTotal.toFixed(2)}`);
      doc.moveDown();
      doc.fontSize(8).text('Thank you! Visit again.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
