import PDFDocument from '@foliojs-fork/pdfkit';

export function generateA4Invoice(invoice, shopInfo) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

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
      
      if (invoice.gstPercent > 0) {
        const discountAmount = invoice.subTotal * (invoice.discountPercent / 100);
        const amountAfterDiscount = invoice.subTotal - discountAmount;
        const gstAmount = amountAfterDiscount * (invoice.gstPercent / 100);
        doc.text(`GST (${invoice.gstPercent}%):`, 350, y);
        doc.text(`+₹${gstAmount.toFixed(2)}`, 450, y);
        y += 20;
      }

      doc.fontSize(12).text(`Grand Total:`, 350, y);
      doc.text(`₹${invoice.grandTotal.toFixed(2)}`, 450, y);

      doc.end();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      reject(error);
    }
  });
}

export function generateThermalInvoice(invoice = {}, shopInfo = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Page / layout
      const pageWidth = 226.8; // 80mm in points
      const margin = 8;
      const doc = new PDFDocument({ size: [pageWidth, 600], margin, bufferPages: true });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (e) => reject(e));

      // Content area
      const contentLeft = margin;
      const contentRight = pageWidth - margin;
      const contentWidth = contentRight - contentLeft;

      // Column widths (tuned to match image)
      const snWidth = 12;
      const qtyWidth = 20;
      const priceWidth = 50;
      const amtWidth = 50;
      // compute X positions from right so totals line up
      const amtX = contentRight - amtWidth;
      const priceX = amtX - 6 - priceWidth;
      const qtyX = priceX - 6 - qtyWidth;
      const itemX = contentLeft + snWidth + 6; // leave a small gap after SN
      const itemWidth = qtyX - 6 - itemX;

      // small helpers
      const drawSeparator = (y) => {
        doc.save();
        doc.moveTo(contentLeft, y).lineTo(contentRight, y).stroke();
        doc.restore();
      };

      // Fonts & header
      doc.font('Helvetica-Bold').fontSize(13).text(shopInfo.name || 'BUSINESS NAME', { align: 'center' });
      doc.font('Helvetica').fontSize(8);
      (shopInfo.address || 'Address Line 1\nCity, State, ZIP').split('\n').forEach(line => {
        doc.text(line.trim(), { align: 'center' });
      });
      if (shopInfo.phone) doc.text(`PHONE: ${shopInfo.phone}`, { align: 'center' });
      if (shopInfo.gst) doc.text(`GSTIN: ${shopInfo.gst}`, { align: 'center' });

      doc.moveDown(0.4);

      // Bill No (left) and Date (right) on same Y
      const billDateY = doc.y;
      const halfWidth = contentWidth / 2;
      doc.font('Helvetica').fontSize(8);
      doc.text(`Bill No: ${invoice.id || 'IN-XXXX'}`, contentLeft, billDateY, { width: halfWidth, align: 'left' });
      const dateStr = invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN') : '';
      doc.text(`Date: ${dateStr}`, contentLeft + halfWidth, billDateY, { width: halfWidth, align: 'right' });

      doc.moveDown(0.4);

      // Customer name (if any)
      if (invoice.customer?.name) {
        doc.text(`Customer: ${invoice.customer.name}`, { align: 'left' });
        doc.moveDown(0.2);
      }

      // separator (drawn)
      drawSeparator(doc.y + 2);
      doc.moveDown(0.5);

      // Table header
      doc.font('Helvetica-Bold').fontSize(8);
      const headerY = doc.y;
      doc.text('SN', contentLeft, headerY, { width: snWidth, align: 'left' });
      doc.text('Item', itemX, headerY, { width: itemWidth, align: 'left' });
      doc.text('Qty', qtyX, headerY, { width: qtyWidth, align: 'right' });
      doc.text('Price', priceX, headerY, { width: priceWidth, align: 'right' });
      doc.text('Amt', amtX, headerY, { width: amtWidth, align: 'right' });

      doc.font('Helvetica').fontSize(8);
      doc.moveDown(0.5);

      // Items
      (invoice.items || []).forEach((item, idx) => {
        const y = doc.y;
        const total = (typeof item.totalWithTax === 'number') ? item.totalWithTax : (item.qty || 0) * (item.price || 0);
        doc.text(String(idx + 1), contentLeft, y, { width: snWidth, align: 'left' });

        // item name allowed to wrap inside itemWidth
        doc.text(item.name || '', itemX, y, { width: itemWidth, align: 'left' });

        // qty / price / amt must be on same Y (first line)
        doc.text(String(item.qty || 0), qtyX, y, { width: qtyWidth, align: 'right' });
        doc.text(Number(item.price || 0).toFixed(2), priceX, y, { width: priceWidth, align: 'right' });
        doc.text(Number(total).toFixed(2), amtX, y, { width: amtWidth, align: 'right' });

        // move down consistently (wraps are handled by PDFKit)
        doc.moveDown(0.6);
      });

      // separator line
      drawSeparator(doc.y + 2);
      doc.moveDown(0.4);

      // Totals area (right aligned amounts to amt column)
      const currentY = doc.y;
      // Subtotal label left, value right aligned in amt column
      doc.font('Helvetica').fontSize(8);
      doc.text('Subtotal:', contentLeft, currentY, { width: contentWidth - amtWidth - 6, align: 'left' });
      doc.text(Number(invoice.subTotal || 0).toFixed(2), amtX, currentY, { width: amtWidth, align: 'right' });

      // Discount (if any)
      let yPos = doc.y + 8;
      const discountPercent = Number(invoice.discountPercent || 0);
      if (discountPercent > 0) {
        const discountAmount = ((invoice.subTotal || 0) * discountPercent) / 100;
        doc.text(`Discount (${discountPercent}%):`, contentLeft, yPos, { width: contentWidth - amtWidth - 6, align: 'left' });
        doc.text(`-${discountAmount.toFixed(2)}`, amtX, yPos, { width: amtWidth, align: 'right' });
        yPos += 10;
      }

      // GST (single line)
      const gstPercent = Number(invoice.gstPercent || 0);
      const discountAmount = ((invoice.subTotal || 0) * discountPercent) / 100;
      const amountAfterDiscount = (invoice.subTotal || 0) - discountAmount;
      const gstAmount = (amountAfterDiscount * gstPercent) / 100;
      doc.text(`GST (${gstPercent}%):`, contentLeft, yPos, { width: contentWidth - amtWidth - 6, align: 'left' });
      doc.text(gstAmount.toFixed(2), amtX, yPos, { width: amtWidth, align: 'right' });

      doc.moveDown(2);

      // Draw separator before TOTAL
      drawSeparator(doc.y + 2);
      doc.moveDown(0.6);

      // Grand total (bold)
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('TOTAL:', contentLeft, doc.y, { width: contentWidth - amtWidth - 6, align: 'left' });
      doc.text(Number(invoice.grandTotal || (invoice.subTotal || 0) + gstAmount).toFixed(2), amtX, doc.y, { width: amtWidth, align: 'right' });

      doc.moveDown(0.6);
      drawSeparator(doc.y + 2);
      doc.moveDown(1);

      // Footer
      doc.font('Helvetica-Bold').fontSize(9).text('Thank You!', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
   }
 });
}