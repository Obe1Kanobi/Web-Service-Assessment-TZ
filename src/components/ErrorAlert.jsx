import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'

export default function ErrorAlert({ message, onRetry }) {
  return (
    <Alert
      variant="danger"
      className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-0"
    >
      <span className="mb-0">{message}</span>
      {onRetry && (
        <Button size="sm" variant="outline-danger" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </Alert>
  )
}