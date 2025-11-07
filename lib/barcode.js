import bwipjs from 'bwip-js';

export async function generateBarcode(text, format = 'code128') {
  try {
    const png = await bwipjs.toBuffer({
      bcid: format,
      text: text,
      scale: 3,
      height: 10,
      includetext: false,
    });

    return png;
  } catch (error) {
    console.error('Barcode generation error:', error);
    throw new Error('Failed to generate barcode');
  }
}

export function generateBarcodeBase64(png) {
  return `data:image/png;base64,${png.toString('base64')}`;
}

export function generateUniqueCode() {
  const prefix = 'JWL';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}
