import Alert from 'react-bootstrap/Alert'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import { useDispatch, useSelector } from 'react-redux'
import BrandList from './components/BrandList'
import ErrorAlert from './components/ErrorAlert'
import Loader from './components/Loader'
import OffersTable from './components/OffersTable'
import SearchForm from './components/SearchForm'
import { fetchOffers, selectSearch } from './store/searchSlice'

export default function App() {
  const dispatch = useDispatch()
  const { query, selectedBrand, brands, offers } = useSelector(selectSearch)

  const onRetryOffers = () => {
    if (query && selectedBrand) dispatch(fetchOffers({ number: query, brand: selectedBrand }))
  }

  return (
    <Container className="py-4" fluid>
      <h1 className="h3 mb-1">Поиск автозапчастей</h1>
      <p className="text-muted mb-4">
        Шаг 1: найдите производителей по артикулу. 
        <br/>
        Шаг 2: выберите бренд, чтобы увидеть аналоги и предложения.
      </p>

      <SearchForm />

      <Row>
        <Col md={3} className="mb-4">
          <BrandList />
        </Col>

        <Col md={9}>
          <h2 className="h5 mb-2">
            Предложения
            {selectedBrand && <span className="text-muted fw-normal"> — {selectedBrand}</span>}
          </h2>

          {offers.status === 'idle' && (
            <p className="text-muted">
              {brands.status === 'succeeded'
                ? 'Выберите производителя слева'
                : 'Сначала выполните поиск по артикулу'}
            </p>
          )}
          {offers.status === 'loading' && <Loader label="Загружаем предложения…" />}
          {offers.status === 'failed' && <ErrorAlert message={offers.error} onRetry={onRetryOffers} />}
          {offers.status === 'succeeded' &&
            (offers.items.length ? (
              <OffersTable rows={offers.items} />
            ) : (
              <Alert variant="info">
                По артикулу «{query}» для бренда {selectedBrand} ничего не найдено
              </Alert>
            ))}
        </Col>
      </Row>
    </Container>
  )
}
