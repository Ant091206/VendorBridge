/**
 * priceCalculator.js — Centralized quotation calculation logic
 */

export const calculateQuotationAmounts = (items) => {
  let subtotal = 0;
  let tax_amount = 0;
  let discount_amount = 0;
  let grand_total = 0;

  const calculatedItems = (items || []).map((item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const taxPct = parseFloat(item.tax_percentage) || 0;
    const discPct = parseFloat(item.discount_percentage) || 0;

    const baseAmount = qty * price;
    const discAmt = baseAmount * (discPct / 100);
    const taxableAmt = baseAmount - discAmt;
    const taxAmt = taxableAmt * (taxPct / 100);
    const totalAmt = taxableAmt + taxAmt;

    subtotal += baseAmount;
    discount_amount += discAmt;
    tax_amount += taxAmt;
    grand_total += totalAmt;

    return {
      rfq_item_id: Number(item.rfq_item_id),
      quantity: qty,
      unit_price: price,
      tax_percentage: taxPct,
      discount_percentage: discPct,
      total_amount: Number(totalAmt.toFixed(2))
    };
  });

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax_amount: Number(tax_amount.toFixed(2)),
    discount_amount: Number(discount_amount.toFixed(2)),
    grand_total: Number(grand_total.toFixed(2)),
    items: calculatedItems
  };
};
