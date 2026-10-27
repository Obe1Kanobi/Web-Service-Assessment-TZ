import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { fetchParts } from '../api/favoritApi'
import { toBrands, toOfferRows } from '../api/normalize'

// Этап 1: список производителей по артикулу.
export const searchBrands = createAsyncThunk('search/brands', async (number, { signal }) => {
  const goods = await fetchParts({ number }, signal)
  return toBrands(goods)
})

// Этап 2: аналоги и предложения по артикулу + бренду.
export const fetchOffers = createAsyncThunk('search/offers', async ({ number, brand }, { signal }) => {
  const goods = await fetchParts({ number, brand, analogues: true }, signal)
  return toOfferRows(goods)
})

const emptyBlock = { items: [], status: 'idle', error: null, requestId: null }

const initialState = {
  query: '',
  selectedBrand: null,
  brands: emptyBlock,
  offers: emptyBlock,
}

// Защита от гонки: если пользователь быстро кликнул несколько брендов,
// результат применится только от последнего запроса.
const isCurrent = (block, action) => block.requestId === action.meta.requestId

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    resetSearch: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchBrands.pending, (state, action) => {
        state.query = action.meta.arg
        state.selectedBrand = null
        state.offers = emptyBlock // новый поиск сбрасывает этап 2
        state.brands = { ...emptyBlock, status: 'loading', requestId: action.meta.requestId }
      })
      .addCase(searchBrands.fulfilled, (state, action) => {
        if (!isCurrent(state.brands, action)) return
        state.brands.items = action.payload
        state.brands.status = 'succeeded'
      })
      .addCase(searchBrands.rejected, (state, action) => {
        if (!isCurrent(state.brands, action) || action.meta.aborted) return
        state.brands.status = 'failed'
        state.brands.error = action.error.message
      })
      .addCase(fetchOffers.pending, (state, action) => {
        state.selectedBrand = action.meta.arg.brand
        state.offers = { ...emptyBlock, status: 'loading', requestId: action.meta.requestId }
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        if (!isCurrent(state.offers, action)) return
        state.offers.items = action.payload
        state.offers.status = 'succeeded'
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        if (!isCurrent(state.offers, action) || action.meta.aborted) return
        state.offers.status = 'failed'
        state.offers.error = action.error.message
      })
  },
})

export const { resetSearch } = searchSlice.actions
export default searchSlice.reducer

export const selectSearch = (state) => state.search