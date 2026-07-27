export function naira(amount) {
  const n = Number(amount || 0);
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
