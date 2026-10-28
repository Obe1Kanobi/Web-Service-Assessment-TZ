const EMPTY_ID = '00000000-0000-0000-0000-000000000000'

export const isEmptyGood = (g) => !g || g.goodsID === EMPTY_ID || !g.brand

// Этап 1: уникальные бренды для списка производителей.
export function toBrands(goods) {
  const byBrand = new Map();
  for (const g of goods) {
    if (isEmptyGood(g) || byBrand.has(g.brand)) continue
    byBrand.set(g.brand, { brand: g.brand, number: g.number, name: g.name, count: g.count })
  }
  return [...byBrand.values()];
}

// Этап 2: строка таблицы = товар × склад.
// Искомая деталь - goods[0], аналоги - goods[0].analogues (по доке и по факту).
export function toOfferRows(goods) {
  const requested = goods.filter((g) => !isEmptyGood(g));
  const analogues = requested.flatMap((g) => g.analogues ?? []).filter((g) => !isEmptyGood(g));

  const items = [
    ...requested.map((g) => ({ ...g, isRequested: true })),
    ...analogues.map((g) => ({ ...g, isRequested: false })),
  ];

  return items.flatMap((item) => {
    const base = {
      goodsID: item.goodsID,
      brand: item.brand,
      number: item.number,
      name: item.name,
      isRequested: item.isRequested,
    }
    // Позиция без остатка: warehouses пустой или count 0.
    if (!item.warehouses?.length) {
      return [
        {
          ...base,
          id: item.goodsID,
          warehouse: null,
          price: null,
          stock: 0,
          shipmentDate: null,
          notRefund: !!item.notRefund,
        },
      ]
    }
    return item.warehouses.map((w, i) => ({
      ...base,
      id: `${item.goodsID}-${w.id}-${i}`,
      warehouse: w.code || (w.own ? 'Наш склад' : 'Поставщик'),
      own: w.own,
      // По доке goods.price — «НЕ ИСПОЛЬЗОВАТЬ», цену берём из склада.
      price: w.price,
      stock: w.stock,
      shipmentDate: w.shipmentDate,
      notRefund: !!(item.notRefund || w.notRefund),
    }))
  })
}