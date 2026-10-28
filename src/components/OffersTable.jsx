import { useMemo, useState } from 'react'
import Table from 'react-bootstrap/Table'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import { formatPrice, formatShipmentDate } from '../utils/format'
import { Container } from 'react-bootstrap'
import { cellSide, cellFirst, cellLast, nameColumn } from './style/OffersTable.style'

// Строка без остатка приглушена и уходит в конец списка.
// Сортировка внутри каждой таблицы: по умолчанию (в наличии → по цене) или по цене.
function sortRows(list, priceSort) {
  const arr = [...list];
  if (priceSort) {
    arr.sort((a, b) => {
      const ap = a.price ?? Infinity;
      const bp = b.price ?? Infinity;
      return priceSort === 'asc' ? ap - bp : bp - ap
    })
  } else {
    arr.sort((a, b) => {
      const aIn = a.stock > 0 ? 0 : 1;
      const bIn = b.stock > 0 ? 0 : 1;
      if (aIn !== bIn) return aIn - bIn
      return (a.price ?? Infinity) - (b.price ?? Infinity)
    })
  }
  return arr
}

export default function OffersTable({ rows }) {
  const [priceSort, setPriceSort] = useState(null);

  const requested = useMemo(() => rows.filter((r) => r.isRequested), [rows]);
  const analogues = useMemo(() => rows.filter((r) => !r.isRequested), [rows]);

  const sortedRequested = useMemo(() => sortRows(requested, priceSort), [requested, priceSort]);
  const sortedAnalogues = useMemo(() => sortRows(analogues, priceSort), [analogues, priceSort]);

  const togglePriceSort = () => {
    setPriceSort((cur) => (cur === 'asc' ? 'desc' : cur === 'desc' ? null : 'asc'))
  }

  const renderRows = (list) =>
    list.map((r, index) => (
      <tr key={r.id} className={r.stock === 0 ? 'text-muted' : ''}>
        <td className="text-center" style={cellFirst}>{index + 1}</td>
        <td style={cellSide}>
          <Container
            fluid
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              {r.brand}
              {r.notRefund && (
                <Badge bg="warning" text="dark" style={{ width: 'fit-content' }}>
                  Невозвратный
                </Badge>
              )}
            </Container>
        </td>
        <td style={cellSide}>{r.number}</td>
        <td style={cellSide}>
          <span
            title={r.name}
            style={nameColumn}
          >
            {r.name}
          </span>
        </td>
        <td style={cellSide}>{r.warehouse ?? '—'}</td>
        <td style={cellSide}>{formatPrice(r.price)}</td>
        <td style={cellSide}>{r.stock > 0 ? r.stock : 'Нет в наличии'}</td>
        <td style={cellLast}>{formatShipmentDate(r.shipmentDate)}</td>
      </tr>
    ))

  const renderTable = (list) => (
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
          <th style={{ ...cellSide, width: 320 }}>Наименование</th>
          <th style={cellSide}>Склад</th>
          <th
            style={{ ...cellSide, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={togglePriceSort}
            title="Сортировать по цене"
          >
            Цена, ₽ {priceSort === 'asc' ? '↑' : priceSort === 'desc' ? '↓' : ''}
          </th>
          <th style={cellSide}>Остаток, шт.</th>
          <th style={cellLast}>Отгрузка</th>
        </tr>
      </thead>
      <tbody>{renderRows(list)}</tbody>
    </Table>
  )

  return (
    <>
      {sortedRequested.length > 0 && (
        <>
          <h3 className="h6 mt-1 mb-2">Основной бренд</h3>
          {renderTable(sortedRequested)}
        </>
      )}

      {sortedAnalogues.length > 0 ? (
        <>
          <h3 className="h6 mt-4 mb-2">Аналоги</h3>
          {renderTable(sortedAnalogues)}
        </>
      ) : (
        sortedRequested.length > 0 && (
          <Alert variant="info" className="mt-2">
            Аналоги не найдены
          </Alert>
        )
      )}
    </>
  )
}