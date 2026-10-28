import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'

export default function Loader({ label = 'Ищем…' }) {
  return (
    <Container className="d-flex align-items-center gap-2 py-4 text-muted">
      <Spinner animation="border" size="sm" />
      <span>{label}</span>
    </Container>
  )
}