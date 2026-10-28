import { useMemo, useState } from 'react'
import Table from 'react-bootstrap/Table'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge' 
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

  // Каждая строка — единый светлый «блок» с синим контуром (как у кнопки поиска)
  // и скруглёнными углами. Бордер рисуется на ячейках строки, но образует
  // общий контур всей строки: отступы заданы только по вертикали (0 5px).
  const cellSide = {
    borderTop: '1px solid var(--bs-primary)',
    borderBottom: '1px solid var(--bs-primary)',
    backgroundColor: '#fff',
    textAlign: 'center'
  }
  const cellFirst = {
    ...cellSide,
    borderLeft: '1px solid var(--bs-primary)',
    borderRadius: '0.375rem 0 0 0.375rem',
  }
  const cellLast = {
    ...cellSide,
    borderRight: '1px solid var(--bs-primary)',
    borderRadius: '0 0.375rem 0.375rem 0',
  }

  return (
    <>
      <Table
        hover
        responsive
        size="sm"
        className="align-middle"
        style={{ borderCollapse: 'separate', borderSpacing: '0 5px' }}
      >
        <thead>
          <tr>
            <th className="text-center" style={cellFirst}>№</th>
            <th style={cellSide}>Производитель</th>
            <th style={cellSide}>Артикул</th>
            <th style={cellSide}>Наименование</th>
            <th style={cellSide}>Склад</th>
            <th
              className="text-end"
              style={{ ...cellSide, cursor: 'pointer', whiteSpace: 'nowrap' }}
              onClick={togglePriceSort}
              title="Сортировать по цене"
            >
              Цена, ₽ {priceSort === 'asc' ? '↑' : priceSort === 'desc' ? '↓' : ''}
            </th>
            <th className="text-end" style={cellSide}>Остаток, шт.</th>
            <th style={cellLast}>Отгрузка</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, index) => (
            <tr key={r.id} className={r.stock === 0 ? 'text-muted' : ''}>
              <td className="text-center" style={cellFirst}>{index + 1}</td>
              <td style={cellSide}>
                {r.brand}
                {r.isRequested && (
                  <Badge bg="primary">
                    Искомая
                  </Badge>
                )}
                {r.notRefund && (
                  <Badge bg="warning" text="dark">
                    Невозвратный
                  </Badge>
                )}
              </td>
              <td style={cellSide}>{r.number}</td>
              <td style={cellSide}>{r.name}</td>
              <td style={cellSide}>{r.warehouse ?? '—'}</td>
              <td className="text-end" style={cellSide}>{formatPrice(r.price)}</td>
              <td className="text-end" style={cellSide}>{r.stock > 0 ? r.stock : 'Нет в наличии'}</td>
              <td style={cellLast}>{formatShipmentDate(r.shipmentDate)}</td>
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