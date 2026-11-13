import { btnSecondary, input } from "../ui/ui";

/**
 * Rows of "SKU + quantity" for a box configuration.
 * items: [{ sku_id: "", quantity: "" }]
 */
export default function ItemsEditor({ items, onChange, skus }) {
  const activeSkus = skus.filter((sku) => sku.is_active);
  const update = (index, changes) => onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, { sku_id: "", quantity: "" }]);
  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const taken = new Set(items.filter((_, i) => i !== index).map((other) => String(other.sku_id)));
        return (
          <div key={index} className="flex gap-2">
            <select className={input} aria-label={`SKU ${index + 1}`} value={item.sku_id}
              onChange={(event) => update(index, { sku_id: event.target.value })}>
              <option value="">Choose SKU…</option>
              {activeSkus.map((sku) => (
                <option key={sku.id} value={sku.id} disabled={taken.has(String(sku.id))}>
                  {sku.code} — {sku.name}
                </option>
              ))}
            </select>
            <input type="number" min="1" max="10000" className={`${input} w-28`} aria-label={`Quantity ${index + 1}`}
              placeholder="Qty" value={item.quantity}
              onChange={(event) => update(index, { quantity: event.target.value })} />
            <button type="button" className={btnSecondary} onClick={() => remove(index)} disabled={items.length === 1}
              aria-label={`Remove row ${index + 1}`}>
              ×
            </button>
          </div>
        );
      })}
      <div className="flex items-center justify-between">
        <button type="button" className={btnSecondary} onClick={add}>+ Add SKU</button>
        <span className="text-sm text-cm-text-muted">Total per box: <strong>{total}</strong></span>
      </div>
    </div>
  );
}

