import { Alert, Badge, ListGroup } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { fetchOffers, searchBrands, selectSearch } from '../store/searchSlice'
import ErrorAlert from './ErrorAlert'
import Loader from './Loader'

export default function BrandList() {
  const dispatch = useDispatch()
  const { brands, query, selectedBrand, offers } = useSelector(selectSearch)

  if (brands.status === 'idle') {
    return <p className="text-muted">Введите артикул, чтобы найти производителей</p>
  }
  if (brands.status === 'loading') return <Loader label="Ищем производителей…" />
  if (brands.status === 'failed') {
    return (
      <ErrorAlert message={brands.error} onRetry={() => dispatch(searchBrands(query))} />
    )
  }
  if (!brands.items.length) {
    return <Alert variant="info">По артикулу «{query}» ничего не найдено</Alert>
  }

  const onSelect = (brand) => {
    // Повторный клик по уже выбранному бренду не шлёт лишний запрос.
    if (brand === selectedBrand) return
    dispatch(fetchOffers({ number: query, brand }))
  }

  return (
    <>
      <p className="text-muted small mb-2">
        Найдено производителей: {brands.items.length}. Выберите, чтобы увидеть аналоги и
        предложения
      </p>
      <ListGroup>
        {brands.items.map((b) => (
          <ListGroup.Item
            key={b.brand}
            action
            active={b.brand === selectedBrand}
            onClick={() => onSelect(b.brand)}
            className="d-flex justify-content-between align-items-center"
          >
            <span>
              <strong>{b.brand}</strong>
              <span className="text-muted d-block small">
                {b.name}
                {b.number && b.name ? ' · ' : ''}
                {b.number}
              </span>
            </span>
            <Badge bg={b.count > 0 ? 'success' : 'secondary'} pill>
              {b.count} шт.
            </Badge>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  )
}