import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import { useDispatch, useSelector } from 'react-redux'
import { searchBrands, selectSearch } from '../store/searchSlice'

export default function SearchForm() {
  const dispatch = useDispatch()
  const { brands } = useSelector(selectSearch)
  const [value, setValue] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const number = value.trim()
    if (number) dispatch(searchBrands(number))
  }

  return (
    <Form onSubmit={onSubmit} className="mb-4">
      <InputGroup>
        <Form.Control
          placeholder="Артикул, например 0189"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="submit" disabled={!value.trim() || brands.status === 'loading'}>
          Найти
        </Button>
      </InputGroup>
    </Form>
  )
}