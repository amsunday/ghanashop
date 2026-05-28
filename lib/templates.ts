import { sanitizePhoneNumber } from './sanitize';

// Type definitions for catalog and orders
export interface ShopDetails {
  shop_name: string;
  currency_symbol: string;
  momo_network: string;
  momo_name: string;
  momo_number: string;
}

export interface CatalogProduct {
  name: string;
  price: number;
  category_name: string;
  is_available: boolean;
}

export interface InvoiceOrderItem {
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

export interface InvoiceOrder {
  id: string;
  customer_name: string;
  delivery_landmark: string;
  total_price: number;
  items: InvoiceOrderItem[];
}

export interface ReviewBroadcast {
  customer_name: string;
  rating: number;
  comment: string;
  average_rating: number;
}

/**
 * 1. Price List/Catalog Template divided by Categories
 */
export function generateCatalogMessage(
  shop: ShopDetails,
  products: CatalogProduct[],
  storefrontUrl: string
): string {
  // Group products by category
  const categories: { [key: string]: CatalogProduct[] } = {};
  products.forEach(p => {
    if (!categories[p.category_name]) {
      categories[p.category_name] = [];
    }
    categories[p.category_name].push(p);
  });

  let message = `🛒 *WELCOME TO ${shop.shop_name.toUpperCase()}!* 🛒\n\n`;
  message += `Here is our current price list. Browse below and tap the link at the bottom to order directly! 👇\n\n`;

  Object.keys(categories).forEach(catName => {
    message += `🔹 *${catName.toUpperCase()}* 🔹\n`;
    categories[catName].forEach(p => {
      const priceStr = `${shop.currency_symbol} ${p.price.toFixed(2)}`;
      const stockIndicator = p.is_available ? '✅ In Stock' : '❌ Out of Stock';
      message += `• *${p.name}* - ${priceStr} (${stockIndicator})\n`;
    });
    message += `\n`;
  });

  message += `-----------------------------------------\n`;
  message += `📲 *Order Online Instantly:* ${storefrontUrl}\n`;
  message += `We deliver directly to your doorstep/landmark! 🚚`;

  return message;
}

/**
 * 2. Localized MoMo Invoice Template
 */
export function generateMomoInvoiceMessage(
  shop: ShopDetails,
  order: InvoiceOrder
): string {
  const shortOrderId = order.id.slice(0, 8).toUpperCase();
  
  let message = `✅ *ORDER CONFIRMED! (#${shortOrderId})*\n\n`;
  message += `Hi *${order.customer_name}*, thank you for shopping with us! Here is your invoice details:\n\n`;
  
  message += `📋 *Your Order Breakdown:*\n`;
  order.items.forEach(item => {
    const subtotal = (item.quantity * item.price_at_purchase).toFixed(2);
    message += `• ${item.quantity}x *${item.product_name}* - ${shop.currency_symbol} ${subtotal}\n`;
  });
  
  message += `\n💰 *Total to Pay:* *${shop.currency_symbol} ${order.total_price.toFixed(2)}*\n`;
  message += `📍 *Delivery Landmark:* ${order.delivery_landmark}\n\n`;
  
  message += `-----------------------------------------\n`;
  message += `💳 *Mobile Money Payment Instructions:*\n`;
  message += `1. Send MoMo to: *${shop.momo_number}*\n`;
  message += `2. Network: *${shop.momo_network.toUpperCase()}*\n`;
  message += `3. Account Name: *${shop.momo_name}*\n\n`;
  message += `📲 *Important:* Once paid, please reply to this chat with your *MoMo Transaction ID* or a screenshot so we can process and dispatch your order!\n`;
  message += `-----------------------------------------\n\n`;
  message += `Thank you for your business! 🙏✨`;

  return message;
}

/**
 * 3. Review Shoutout Broadcast Template
 */
export function generateReviewShoutoutMessage(
  shop: ShopDetails,
  review: ReviewBroadcast
): string {
  const starEmojis = '⭐'.repeat(review.rating);
  
  let message = `🎉 *CUSTOMER LOVE AT ${shop.shop_name.toUpperCase()}!* 🎉\n\n`;
  message += `⭐ *${review.customer_name}* just left us a *${review.rating}-Star* review:\n\n`;
  message += `> "${review.comment}"\n\n`;
  message += `${starEmojis}\n\n`;
  message += `📈 *Our Current Rating:* ${review.average_rating.toFixed(1)} / 5.0 Stars\n`;
  message += `-----------------------------------------\n`;
  message += `We appreciate your support! Tap to order from us online:`;

  return message;
}

/**
 * 4. WhatsApp Deep Link Generator
 */
export function createWhatsAppDeepLink(phone: string, messageText: string): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(messageText);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
