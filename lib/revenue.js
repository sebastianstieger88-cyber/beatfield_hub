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
    return paidAmount(prices[0]?.price?.total);
  }
  return paidAmount(order?.priceDetails?.total);
}
