/** Zero is a valid voucher purchase; null/empty is an unknown amount. */
export function paidAmount(value) {
  if (value === null || value === undefined || typeof value === 'boolean' || (typeof value === 'string' && !value.trim())) return null;
  const amount=Number(value);
  return Number.isFinite(amount)&&amount>=0 ? Math.round(amount*100)/100 : null;
}
export function packageRevenue(booking,listPrice) { return paidAmount(booking.paid_amount) ?? listPrice; }
export function wixPaidAmount(order) {
  const prices=order?.pricing?.prices;
  if(Array.isArray(prices)) {
    // Recurring and multi-period pricing cannot establish a one-time Season receipt.
    if(prices.length!==1 || order.pricing.subscription) return null;
    const amount = paidAmount(prices[0]?.price?.total);
    // Wix can return an empty zero-valued billing schedule for a paid, future
    // subscription. It is not evidence of a free purchase or a 100% coupon.
    if (amount === 0 && paidAmount(order.planPrice) > 0
      && paidAmount(prices[0]?.price?.subtotal) === 0
      && !(paidAmount(prices[0]?.price?.discount) > 0)) return null;
    return amount;
  }
  return paidAmount(order?.priceDetails?.total);
}
