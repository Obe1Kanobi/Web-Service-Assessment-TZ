import { Spinner } from 'react-bootstrap'

export default function Loader({ label = 'Ищем…' }) {
  return (
    <div className="d-flex align-items-center gap-2 py-4 text-muted">
      <Spinner animation="border" size="sm" />
      <span>{label}</span>
    </div>
  )
}