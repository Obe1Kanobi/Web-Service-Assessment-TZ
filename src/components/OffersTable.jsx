import { useMemo, useState } from 'react'
import { Alert, Badge, Table } from 'react-bootstrap'
import { formatPrice, formatShipmentDate } from '../utils/format'

// Строка без остатка приглушена и уходит в конец списка.
export default function OffersTable({ rows }) {
  const [priceSort, setPriceSort] = useState(null) // null | 'asc' | 'desc'

  const sorted = useMemo(() => {
    const list = [...rows]
    if (priceSort) {
      list.sort((a, b) => {
        const ap = a.price ?? Infinity
        const bp = b.price ?? Infinity
        return priceSort === 'asc' ? ap - bp : bp - ap
      })
    } else {
      // По умолчанию: искомая деталь → по наличию → по цене.
      list.sort((a, b) => {
        if (a.isRequested !== b.isRequested) return a.isRequested ? -1 : 1
        const aIn = a.stock > 0 ? 0 : 1
        const bIn = b.stock > 0 ? 0 : 1
        if (aIn !== bIn) return aIn - bIn
        return (a.price ?? Infinity) - (b.price ?? Infinity)
      })
    }
    return list
  }, [rows, priceSort])

  const hasRequested = sorted.some((r) => r.isRequested)
  const hasAnalogues = sorted.some((r) => !r.isRequested)

  const togglePriceSort = () => {
    setPriceSort((cur) => (cur === 'asc' ? 'desc' : cur === 'desc' ? null : 'asc'))
  }

  return (
    <>
      <Table striped hover responsive size="sm" className="align-middle">
        <thead>
          <tr>
            <th>Производитель</th>
            <th>Артикул</th>
            <th>Наименование</th>
            <th>Склад</th>
            <th
              className="text-end"
              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
              onClick={togglePriceSort}
              title="Сортировать по цене"
            >
              Цена, ₽ {priceSort === 'asc' ? '↑' : priceSort === 'desc' ? '↓' : ''}
            </th>
            <th className="text-end">Остаток, шт.</th>
            <th>Отгрузка</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className={r.stock === 0 ? 'text-muted' : ''}>
              <td>
                {r.brand}
                {r.isRequested && (
                  <Badge bg="primary" className="ms-1">
                    Искомая
                  </Badge>
                )}
                {r.notRefund && (
                  <Badge bg="warning" text="dark" className="ms-1">
                    Невозвратный
                  </Badge>
                )}
              </td>
              <td>{r.number}</td>
              <td>{r.name}</td>
              <td>{r.warehouse ?? '—'}</td>
              <td className="text-end">{formatPrice(r.price)}</td>
              <td className="text-end">{r.stock > 0 ? r.stock : 'Нет в наличии'}</td>
              <td>{formatShipmentDate(r.shipmentDate)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {hasRequested && !hasAnalogues && (
        <Alert variant="info" className="mt-2">
          Аналоги не найдены
        </Alert>
      )}
    </>
  )
}