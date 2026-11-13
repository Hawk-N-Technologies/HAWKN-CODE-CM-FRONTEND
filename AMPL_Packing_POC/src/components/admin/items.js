/** Convert editor rows into API items; returns null if any row is incomplete. */
export function toApiItems(items) {
  const result = items.map((item) => ({ sku_id: Number(item.sku_id), quantity: Number(item.quantity) }));
  return result.every((item) => item.sku_id > 0 && item.quantity >= 1) ? result : null;
}
