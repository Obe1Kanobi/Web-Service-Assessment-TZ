const priceFmt = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
})

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' })
const timeFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

export const formatPrice = (value) => (value == null ? '—' : priceFmt.format(value))

// shipmentDate — дата отгрузки + время, до которого можно заказать.
export function formatShipmentDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${dateFmt.format(d)}, заказ до ${timeFmt.format(d)}`
}