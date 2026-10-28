export const cellSide = {
  borderTop: '1px solid var(--bs-primary)',
  borderBottom: '1px solid var(--bs-primary)',
  textAlign: 'center',
}

export const cellFirst = {
  ...cellSide,
  borderLeft: '1px solid var(--bs-primary)',
  borderRadius: 'var(--bs-border-radius) 0 0 var(--bs-border-radius)',
}

export const cellLast = {
  ...cellSide,
  borderRight: '1px solid var(--bs-primary)',
  borderRadius: '0 var(--bs-border-radius) var(--bs-border-radius) 0',
}

export const nameColumn = {
  display: 'block',
  maxWidth: 320,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}