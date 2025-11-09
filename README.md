# Jewelry POS System

A modern, feature-rich Point-of-Sale system built with Next.js 14, designed specifically for jewelry stores and retail businesses.

## Features

### 📦 Inventory Management
- Add, edit, and delete products
- Automatic barcode generation for each product
- Stock tracking and management
- Product categorization
- Search by name, code, or category

### 💳 Billing
- Quick product search and barcode scanning
- Real-time cart management
- Customer information capture
- Configurable discount and GST
- Multiple payment modes (Cash, Card, UPI, Net Banking)
- Optional WhatsApp number for invoice sharing

### 🧾 Invoicing
- Automatic invoice generation
- PDF export (A4 and Thermal formats)
- WhatsApp sharing with formatted bill
- Invoice history and tracking
- Print-ready thermal receipts

### 🖨️ Barcode Printing
- Generate barcodes for inventory items
- Print-ready barcode labels
- Support for standard barcode formats

### ⚙️ Settings
- Configure shop information
- Set default GST percentage
- Store contact details
- Customize business information for invoices

### 🎨 User Interface
- Modern, responsive design
- Dark mode support
- Mobile-friendly interface
- Intuitive navigation

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand
- **Barcode Generation**: bwip-js
- **PDF Generation**: PDFKit
- **Charts**: Recharts
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ 
- MongoDB instance (local or cloud)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Jewelry-POS-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run dev:turbo    # Start with Turbopack (faster)
```

### Production
```bash
npm run build        # Build for production
npm run start        # Start production server
```

### Other
```bash
npm run lint         # Run ESLint
```

## Usage Guide

### 1. Initial Setup
- Navigate to **Settings** and configure your shop information
- Set your default GST percentage
- Save the settings

### 2. Add Inventory
- Go to **Inventory** → **Add New**
- Enter product details (name, category, price, stock)
- System automatically generates unique code and barcode
- Save the product

### 3. Process a Sale
- Navigate to **Billing**
- Search products or scan barcodes
- Add items to cart
- Enter customer name (phone number is optional)
- Apply discount if needed
- Select payment mode
- Click **Generate Bill**

### 4. Invoice Options
- **Print**: Print thermal receipt
- **Share**: Share formatted bill via WhatsApp (if phone number provided)
- **View**: Check invoice history in **Invoices** section

### 5. Print Barcodes
- Go to **Barcode Print**
- Select products to print
- Generate printable barcode labels

## Project Structure

```
Jewelry-POS-System/
├── app/
│   ├── api/[[...path]]/       # API routes
│   ├── billing/               # Billing page
│   ├── inventory/             # Inventory management
│   ├── invoices/              # Invoice history
│   ├── barcode-print/         # Barcode printing
│   ├── settings/              # Settings page
│   └── layout.js              # Root layout
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── navbar.js              # Navigation bar
│   └── theme-toggle.js        # Dark mode toggle
├── lib/
│   ├── db.js                  # Database connection
│   ├── barcode.js             # Barcode utilities
│   ├── pdf.js                 # PDF generation
│   └── utils.js               # Helper functions
├── store/
│   ├── cartStore.js           # Cart state management
│   └── settingsStore.js       # Settings state
├── .env                       # Environment variables
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind CSS config
└── package.json               # Dependencies
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products?query=search` - Search products
- `GET /api/products?barcode=code` - Search by barcode
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get single product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/:id/barcode` - Get barcode image

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get single invoice
- `GET /api/invoices/:id/pdf-a4` - Download A4 PDF
- `GET /api/invoices/:id/pdf-thermal` - Download thermal PDF

### Settings
- `GET /api/settings/shop` - Get shop settings
- `PUT /api/settings/shop` - Update shop settings

## Features in Detail

### WhatsApp Integration
When a customer phone number is provided:
- Automatically generates formatted bill message with emojis
- Creates shareable WhatsApp link
- Includes invoice details, items, and totals
- Supports Unicode characters and proper encoding

### Barcode System
- Unique codes generated for each product
- Standard barcode format support
- Print-ready labels
- Quick scanning during billing

### PDF Invoices
Two formats available:
- **A4 Format**: Standard professional invoice
- **Thermal Format**: Optimized for thermal printers (58mm/80mm)

### Dark Mode
- System-wide theme toggle
- Persists user preference
- Respects system settings
- Smooth transitions

## Configuration

### MongoDB Setup
1. Create a MongoDB database (local or Atlas)
2. Add connection string to `.env`
3. Collections are created automatically

### GST Configuration
- Set default GST percentage in Settings
- Automatically applied to all bills
- Can be overridden per transaction

### Shop Information
Configure in Settings:
- Shop Name
- Phone Number
- Address
- GST Number
- Default GST Percentage

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Verify your `MONGODB_URI` in `.env`
- Check if MongoDB service is running
- Ensure network connectivity

**Build Errors**
- Clear `.next` folder and rebuild
- Delete `node_modules` and reinstall
- Check Node.js version (18+)

**Barcode Not Generating**
- Ensure product has a valid code
- Check browser console for errors
- Verify bwip-js installation

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm run start
   ```

3. **Environment Variables**
   - Set `MONGODB_URI` on your hosting platform
   - Configure any CORS settings if needed

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is proprietary software.

## Support

For issues or questions, please contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2025
