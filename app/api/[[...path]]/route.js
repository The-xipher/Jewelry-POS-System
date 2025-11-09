import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { generateBarcode, generateBarcodeBase64, generateUniqueCode } from '@/lib/barcode';
import { generateA4Invoice, generateThermalInvoice } from '@/lib/pdf';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get collection
async function getCollection(collectionName) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

// Product APIs
async function handleProducts(request, method, segments) {
  const products = await getCollection('products');

  // GET /api/products or /api/products/search
  if (method === 'GET' && segments.length === 0) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const barcode = searchParams.get('barcode');

    let filter = {};
    if (query) {
      filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { code: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      };
    }
    if (barcode) {
      filter = { barcode };
    }

    const productList = await products.find(filter).toArray();
    return NextResponse.json(productList);
  }

  // POST /api/products - Create new product
  if (method === 'POST' && segments.length === 0) {
    const body = await request.json();
    const code = generateUniqueCode();
    const barcode = code; // Use code as barcode text

    const newProduct = {
      id: uuidv4(),
      code,
      name: body.name,
      category: body.category || 'General',
      stock: body.stock || 0,
      mrp: body.mrp || 0,
      sellPrice: body.sellPrice || 0,
      barcode,
      createdAt: new Date().toISOString()
    };

    await products.insertOne(newProduct);
    return NextResponse.json(newProduct, { status: 201 });
  }

  // GET /api/products/:id
  if (method === 'GET' && segments.length >= 1) {
    const id = segments[0];
    
    // Check for barcode endpoints
    if (segments.length === 2 && segments[1] === 'barcode') {
      const product = await products.findOne({ id });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const png = await generateBarcode(product.barcode);
      return new NextResponse(png, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    // Get single product
    const product = await products.findOne({ id });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  }

  // PUT /api/products/:id
  if (method === 'PUT' && segments.length === 1) {
    const id = segments[0];
    const body = await request.json();

    const updateData = {
      name: body.name,
      category: body.category,
      stock: body.stock,
      mrp: body.mrp,
      sellPrice: body.sellPrice,
    };

    const result = await products.updateOne(
      { id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updated = await products.findOne({ id });
    return NextResponse.json(updated);
  }

  // DELETE /api/products/:id
  if (method === 'DELETE' && segments.length === 1) {
    const id = segments[0];
    const result = await products.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

// Invoice APIs
async function handleInvoices(request, method, segments) {
  const invoices = await getCollection('invoices');
  const customers = await getCollection('customers');

  // GET /api/invoices
  if (method === 'GET' && segments.length === 0) {
    const invoiceList = await invoices.find({}).sort({ date: -1 }).toArray();
    return NextResponse.json(invoiceList);
  }

  // POST /api/invoices - Create new invoice
  if (method === 'POST' && segments.length === 0) {
    const body = await request.json();
    
    const invoice = {
      id: uuidv4(),
      date: new Date().toISOString(),
      customer: body.customer,
      discountPercent: body.discountPercent || 0,
      gstPercent: body.gstPercent || 0,
      items: body.items,
      subTotal: body.subTotal,
      grandTotal: body.grandTotal,
      paymentMode: body.paymentMode || 'Cash' // Add payment mode
    };

    // Reduce stock for each item in the invoice
    const products = await getCollection('products');
    for (const item of invoice.items) {
      if (item.productId) {
        const product = await products.findOne({ id: item.productId });
        if (product) {
          const newStock = Math.max(0, product.stock - item.qty);
          await products.updateOne(
            { id: item.productId },
            { $set: { stock: newStock } }
          );
        }
      }
    }

    await invoices.insertOne(invoice);

    // Save customer if provided
    if (body.customer?.name && body.customer?.whatsapp) {
      const existingCustomer = await customers.findOne({ 
        whatsapp: body.customer.whatsapp 
      });
      
      if (!existingCustomer) {
        await customers.insertOne({
          id: uuidv4(),
          name: body.customer.name,
          whatsapp: body.customer.whatsapp,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Generate WhatsApp message with formatted bill
let whatsappLink = null;

if (body.customer?.whatsapp) {
  // 1) Normalize phone to WhatsApp E.164-like (digits only, with country code)
  let phone = (body.customer.whatsapp || '').replace(/\D/g, '');
  // If it's a 10-digit Indian mobile, prepend 91
  if (/^[6-9]\d{9}$/.test(phone)) phone = `91${phone}`;
  // Trim leading 0s (landlines often have them)
  phone = phone.replace(/^0+/, '');

  // 2) Get shop info
  const settings = await getCollection('settings');
  const shopInfo = (await settings.findOne({ id: 'shop' })) || {
    name: 'Jewelry Store',
    phone: '',
    address: ''
  };

  // 3) Format date (DD/MM/YYYY to avoid ambiguity)
  const invoiceDate = new Date(invoice.date).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  // 4) Build items list
  const itemsList = invoice.items.map((item, idx) =>
    `${idx + 1}. 💍 *${item.name}* (${item.qty}) – ₹${(item.qty * item.price).toFixed(2)}`
  ).join('\n');

  // 5) Calculations
  const discountAmount = (invoice.subTotal || 0) * ((invoice.discountPercent || 0) / 100);
  const amountAfterDiscount = (invoice.subTotal || 0) - discountAmount;
  const gstAmount = amountAfterDiscount * ((invoice.gstPercent || 0) / 100);

  // 6) Compose message (plain UTF-16 JS string, with \n line breaks)
  let billText = `🙏 Thank you for shopping with ${shopInfo.name || 'Jewelry Store'}! 🙏

🏪 ${shopInfo.name || 'Jewelry Store'}
📍 ${shopInfo.address || '123 Main Street'}
📞 ${shopInfo.phone || '+91-9876543210'}

━━━━━━━━━━━━━━━━━━━
🧾 INVOICE DETAILS
━━━━━━━━━━━━━━━━━━━
📄 Invoice No: ${String(invoice.id || '').substring(0, 8)}
📅 Date: ${invoiceDate}
👤 Customer: ${invoice.customer?.name || 'Walk-in Customer'}
━━━━━━━━━━━━━━━━━━━

💎 ITEMS PURCHASED
${itemsList}

━━━━━━━━━━━━━━━━━━━
💰 BILLING SUMMARY
━━━━━━━━━━━━━━━━━━━
💵 Subtotal: ₹${(invoice.subTotal || 0).toFixed(2)}`;

  if ((invoice.discountPercent || 0) > 0) {
    billText += `\n💸 *Discount (${invoice.discountPercent}%):* -₹${discountAmount.toFixed(2)}`;
  }

  if ((invoice.gstPercent || 0) > 0) {
    billText += `\n🧮 *GST (${invoice.gstPercent}%):* +₹${gstAmount.toFixed(2)}`;
  }

  billText += `

💳 Payment Mode: ${invoice.paymentMode || 'Cash'}
💰 Grand Total: ₹${(invoice.grandTotal || 0).toFixed(2)}

━━━━━━━━━━━━━━━━━━━
🌟 We appreciate your trust and loyalty!
💬 For queries, contact us at ${shopInfo.phone || '+91-9876543210'}.`;

  // 7) Correct URL encoding — ONLY encodeURIComponent
  const encoded = encodeURIComponent(billText);

  // Use api.whatsapp.com or wa.me — both are fine
  whatsappLink = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
  // Or: whatsappLink = `https://wa.me/${phone}?text=${encoded}`;
}

    return NextResponse.json({ invoice, whatsappLink }, { status: 201 });
  }


  // GET /api/invoices/:id
  if (method === 'GET' && segments.length >= 1) {
    const id = segments[0];

    // Check for PDF endpoints
    if (segments.length === 2) {
      const invoice = await invoices.findOne({ id });
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const settings = await getCollection('settings');
      const shopInfo = await settings.findOne({ id: 'shop' }) || {
        name: 'Jewelry Store',
        phone: '',
        address: '',
        gst: ''
      };

      if (segments[1] === 'pdf-a4') {
        const pdfBuffer = await generateA4Invoice(invoice, shopInfo);
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
          },
        });
      }

      if (segments[1] === 'pdf-thermal') {
        const pdfBuffer = await generateThermalInvoice(invoice, shopInfo);
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="invoice-thermal-${id}.pdf"`,
          },
        });
      }
    }

    // Get single invoice
    const invoice = await invoices.findOne({ id });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json(invoice);
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

// Settings APIs
async function handleSettings(request, method, segments) {
  const settings = await getCollection('settings');

  // GET /api/settings/shop
  if (method === 'GET' && segments[0] === 'shop') {
    const shopInfo = await settings.findOne({ id: 'shop' });
    if (!shopInfo) {
      const defaultInfo = {
        id: 'shop',
        name: 'Jewelry Store',
        phone: '',
        address: '',
        gst: ''
      };
      await settings.insertOne(defaultInfo);
      return NextResponse.json(defaultInfo);
    }
    return NextResponse.json(shopInfo);
  }

  // PUT /api/settings/shop
  if (method === 'PUT' && segments[0] === 'shop') {
    const body = await request.json();
    
    // Remove any _id field from the body to avoid MongoDB immutable field error
    const { _id, ...updateData } = body;
    
    await settings.updateOne(
      { id: 'shop' },
      { $set: { ...updateData, id: 'shop' } },
      { upsert: true }
    );

    const updated = await settings.findOne({ id: 'shop' });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

// Main router
export async function GET(request, { params }) {
  try {
    const path = params?.path || [];
    
    if (path.length === 0) {
      return NextResponse.json({ 
        message: 'Jewelry POS API',
        version: '1.0.0',
        endpoints: {
          products: '/api/products',
          invoices: '/api/invoices',
          settings: '/api/settings'
        }
      });
    }

    const [resource, ...segments] = path;

    if (resource === 'products') {
      return handleProducts(request, 'GET', segments);
    }
    if (resource === 'invoices') {
      return handleInvoices(request, 'GET', segments);
    }
    if (resource === 'settings') {
      return handleSettings(request, 'GET', segments);
    }

    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const path = params?.path || [];
    const [resource, ...segments] = path;

    if (resource === 'products') {
      return handleProducts(request, 'POST', segments);
    }
    if (resource === 'invoices') {
      return handleInvoices(request, 'POST', segments);
    }

    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const path = params?.path || [];
    const [resource, ...segments] = path;

    if (resource === 'products') {
      return handleProducts(request, 'PUT', segments);
    }
    if (resource === 'settings') {
      return handleSettings(request, 'PUT', segments);
    }

    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const path = params?.path || [];
    const [resource, ...segments] = path;

    if (resource === 'products') {
      return handleProducts(request, 'DELETE', segments);
    }

    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
