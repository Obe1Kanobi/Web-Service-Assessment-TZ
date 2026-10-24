# План: поиск автозапчастей (React + Redux)

Oct 23, 2026 · @Kodi

## Ключевые решения

Итог: Vite + React (JS) + Redux Toolkit + Bootstrap 5, запросы к API идут через прокси, два этапа живут в одном слайсе. Ориентир по объёму — 6–8 часов: сегодня каркас, API и этап 1, завтра этап 2, полировка и сдача.

| Вопрос | Решение | Почему |
| --- | --- | --- |
| Сборка | Vite, шаблон `react` (JS) | Быстрый старт, встроенный dev-прокси |
| Состояние | Redux Toolkit: `configureStore`, `createSlice`, `createAsyncThunk` | Официальный способ писать Redux, минимум бойлерплейта, статусы загрузки из коробки |
| Запросы | `fetch` + `URLSearchParams` | Без axios: меньше зависимостей, кодирование спецсимволов бесплатно |
| Стили | Bootstrap 5 (CSS) + `react-bootstrap` | Готовые Table, Spinner, Alert, ListGroup, Badge |
| CORS и HTTP | Прокси: `server.proxy` в Vite, rewrites на хостинге | API отдаёт http без CORS-заголовков, браузер напрямую не пустит |
| Ключ API | `.env` → `VITE_API_KEY`, в репозиторий только `.env.example` | Ключ не светится в git |
| Запуск поиска | Сабмит формы (Enter или кнопка) | Проще и предсказуемее debounce; debounce — опциональный бонус |

RTK Query тоже подошёл бы и был бы ещё короче, но в тестовом лучше показать явный слайс и thunk: проверяющему видно, что вы понимаете Redux, а не только хук из библиотеки.

В тексте задания есть строка «Ответьте на вопросы», но самих вопросов нет. Уточните у работодателя, не потерялся ли список, — ответы удобно положить в README.

## Подводные камни API

Главный риск — не React, а сам API: без прокси запросы из браузера не пройдут, а «пустой» ответ выглядит как успешный. Разберите это до вёрстки.

| Что | Как ведёт себя API | Что делать |
| --- | --- | --- |
| CORS | `http://api.favorit-parts.ru` без CORS-заголовков (проверьте в первые 10 минут) | Vite proxy: `/api` → `http://api.favorit-parts.ru/hs/hsprice/` |
| Mixed content | API по http, хостинг по https — браузер заблокирует | Тот же прокси на хостинге (Vercel/Netlify rewrites) |
| Ключ | В доке пример `00000000-0000-0000-0000-000000000001`, скорее всего нерабочий | Попросить у работодателя тестовый ключ; запасной план — моки из примеров доки |
| Ошибка | Приходит объект `{"error": "Empty key!"}`, вероятно со статусом 200 | Проверять `data.error` всегда, а не только `res.ok` |
| Не найдено | `goods` из одного элемента: `goodsID` = `00000000-0000-0000-0000-000000000000`, `brand` пустой | Отфильтровать такие элементы; пустой массив → «ничего не найдено» |
| Нет остатка | Позиция приходит с `count: 0` и `warehouses: []` | Показать строку «нет в наличии» или скрыть переключателем |
| Цена | `goods.price` помечен «НЕ ИСПОЛЬЗОВАТЬ» | Цену брать из `warehouses[].price` |
| Аналоги | При `brand` + `analogues=on` ответ — `goods[0]`, внутри массив `analogues` | Искомая деталь = `goods[0]`, аналоги = `goods[0].analogues` |
| Спецсимволы | `#`, `&`, `/` в номере и бренде ломают запрос | `URLSearchParams` кодирует сам; не склеивать строку вручную |
| Бренд со слешем | В доке `NGK/NTK` передан как `NGKNTK` | Сначала передать как есть (закодированным); если пусто — проверить вариант без спецсимволов |
| Формат номера | У CAFFARO номер `01-89`, а запрос аналогов в доке идёт с `0189` | Во втором запросе передавать введённый номер; если пусто — номер из ответа |
| Лимит | `Request quota exceeded!` для грузового ассортимента | Показать текст ошибки как есть, не дёргать API лишний раз |
| Время | `shipmentDate` — дата отгрузки и время, до которого заказать | Форматировать через `Intl.DateTimeFormat('ru-RU')` |

Опечатка в доке: в первом примере URL `number=01089`, а дальше везде `0189` — ориентируйтесь на `0189`.

## Структура проекта

Плоская структура из трёх слоёв: `api` знает про HTTP и формат ответа, `store` — про состояние, `components` — только рисуют. Больше папок для такого объёма не нужно.

```
favorit-parts-search/
├── .env.example            # VITE_API_KEY=
├── vite.config.js          # proxy /api
├── vercel.json             # rewrites для продакшена
├── README.md
└── src/
    ├── main.jsx            # Provider + bootstrap.min.css
    ├── App.jsx             # компоновка двух этапов
    ├── api/
    │   ├── favoritApi.js   # fetchParts(params, signal)
    │   └── normalize.js    # isEmptyGood, toBrands, toOfferRows
    ├── store/
    │   ├── index.js        # configureStore
    │   └── searchSlice.js  # state, thunks, селекторы
    ├── components/
    │   ├── SearchForm.jsx
    │   ├── BrandList.jsx
    │   ├── OffersTable.jsx
    │   ├── Loader.jsx
    │   └── ErrorAlert.jsx
    └── utils/
        └── format.js       # цена в ₽, дата отгрузки
```

## План по шагам

Сегодня вечером (\~3–4 ч) — шаги 0–4: к концу дня работает поиск брендов. Завтра (\~3–4 ч) — шаги 5–8: таблица предложений, полировка, деплой. Коммитьте после каждого шага — история коммитов тоже часть оценки.

### Сегодня

**Шаг 0. Проверить API (15 мин)**

- [ ] Получить рабочий ключ у работодателя (если ещё нет)
- [ ] Открыть в браузере `http://api.favorit-parts.ru/hs/hsprice/?key=<ключ>&number=0189` — убедиться, что JSON приходит
- [ ] Сохранить пару реальных ответов в `src/api/__mocks__/` (бренды и аналоги) — пригодятся, если API ляжет или упрётся в лимит

**Шаг 1. Каркас (30 мин)**

- [ ] `npm create vite@latest favorit-parts-search -- --template react`
- [ ] `npm i @reduxjs/toolkit react-redux bootstrap react-bootstrap`
- [ ] В `main.jsx`: `import 'bootstrap/dist/css/bootstrap.min.css'`
- [ ] Удалить демо-код Vite, завести `.env`, `.env.example`, добавить `.env` в `.gitignore`
- [ ] `git init`, первый коммит, репозиторий на GitHub

**Шаг 2. Прокси и слой API (45 мин)**

- [ ] Настроить `server.proxy` в `vite.config.js` (код ниже)
- [ ] Написать `fetchParts` и функции нормализации (код ниже)
- [ ] Проверить из консоли браузера: `fetchParts({ number: '0189' })` возвращает массив

**Шаг 3. Store (45 мин)**

- [ ] `searchSlice` со стейтом этапа 1 и этапа 2, два thunk-а
- [ ] Подключить `Provider` в `main.jsx`
- [ ] Поставить Redux DevTools в браузер — удобно отлаживать

**Шаг 4. Этап 1: форма и список брендов (1 ч)**

- [ ] `SearchForm`: input + кнопка, `trim()`, блокировка пустого ввода, кнопка disabled во время загрузки
- [ ] `BrandList`: ListGroup кликабельных брендов с названием детали и общим остатком
- [ ] Loader и ErrorAlert для этапа 1
- [ ] Коммит «stage 1: brand search»

### Завтра

**Шаг 5. Этап 2: аналоги и таблица (1,5 ч)**

- [ ] Клик по бренду → `fetchOffers({ number, brand })`, выбранный бренд подсвечен (`active`)
- [ ] `OffersTable`: строка на каждое предложение склада, искомая деталь сверху с бейджем «Искомая»
- [ ] Колонки: Производитель, Артикул, Наименование, Склад, Цена, Остаток, Отгрузка
- [ ] Сортировка по цене по клику на заголовок (бонус, 15 мин)

**Шаг 6. Состояния и края (1 ч)**

- [ ] Пройти таблицу из раздела «Обработка состояний» и проверить каждый случай руками
- [ ] Отмена устаревших запросов (`abort`) при быстром повторном выборе
- [ ] Новый поиск сбрасывает этап 2

**Шаг 7. Полировка (30–45 мин)**

- [ ] Адаптивность: таблица в `Table responsive`, на телефоне не ломается
- [ ] Формат цены и даты, `notRefund` → бейдж «Невозвратный» (через `info=on`, бонус)
- [ ] Прогнать `npm run lint`, убрать `console.log`

**Шаг 8. Деплой и сдача (45 мин)**

- [ ] Деплой на Vercel с rewrites, проверить на проде
- [ ] README, финальный чек-лист ниже, отправить ссылки

## Слой API и нормализация

Вся «грязь» API — прокси, ключ, поле `error`, пустая заглушка, вложенные склады — прячется в двух файлах. Компоненты и store получают уже плоские, понятные данные.

**vite.config.js** — прокси для разработки:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://api.favorit-parts.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/hs/hsprice'),
      },
    },
  },
})
```

**src/api/favoritApi.js** — один метод на оба этапа:

```js
const BASE_URL = '/api/'
const API_KEY = import.meta.env.VITE_API_KEY

const ERRORS = {
  'Empty key!': 'Не указан ключ API',
  'Invalid key client!': 'Неверный ключ API',
  'Empty number goods!': 'Введите артикул',
  'Request quota exceeded!': 'Превышен лимит запросов, попробуйте позже',
}

export async function fetchParts({ number, brand, analogues = false }, signal) {
  const params = new URLSearchParams({ key: API_KEY, number, info: 'on' })
  if (brand) params.set('brand', brand)
  if (analogues) params.set('analogues', 'on')

  let res
  try {
    res = await fetch(`${BASE_URL}?${params}`, { signal })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new Error('Нет связи с сервером. Проверьте интернет и повторите')
  }

  if (!res.ok) throw new Error(`Сервер ответил ошибкой ${res.status}`)

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('Сервер вернул некорректный ответ')
  }

  if (data.error) throw new Error(ERRORS[data.error] ?? data.error)
  return Array.isArray(data.goods) ? data.goods : []
}
```

**src/api/normalize.js** — фильтр заглушки и превращение ответа в строки таблицы:

```js
const EMPTY_ID = '00000000-0000-0000-0000-000000000000'

export const isEmptyGood = (g) => !g || g.goodsID === EMPTY_ID || !g.brand

// Этап 1: уникальные бренды
export function toBrands(goods) {
  const byBrand = new Map()
  for (const g of goods) {
    if (isEmptyGood(g) || byBrand.has(g.brand)) continue
    byBrand.set(g.brand, { brand: g.brand, number: g.number, name: g.name, count: g.count })
  }
  return [...byBrand.values()]
}

// Этап 2: строка = товар × склад
export function toOfferRows(goods) {
  const requested = goods.filter((g) => !isEmptyGood(g))
  const analogues = requested.flatMap((g) => g.analogues ?? []).filter((g) => !isEmptyGood(g))

  const items = [
    ...requested.map((g) => ({ ...g, isRequested: true })),
    ...analogues.map((g) => ({ ...g, isRequested: false })),
  ]

  return items.flatMap((item) => {
    const base = {
      goodsID: item.goodsID,
      brand: item.brand,
      number: item.number,
      name: item.name,
      isRequested: item.isRequested,
    }
    if (!item.warehouses?.length) {
      return [{ ...base, id: item.goodsID, warehouse: null, price: null, stock: 0, shipmentDate: null, notRefund: !!item.notRefund }]
    }
    return item.warehouses.map((w, i) => ({
      ...base,
      id: `${item.goodsID}-${w.id}-${i}`,
      warehouse: w.code || (w.own ? 'Наш склад' : 'Поставщик'),
      own: w.own,
      price: w.price,
      stock: w.stock,
      shipmentDate: w.shipmentDate,
      notRefund: !!(item.notRefund || w.notRefund),
    }))
  })
}
```

Ключ из `VITE_API_KEY` попадает в собранный JS — для тестового это нормально, но упомяните в README, что в продакшене ключ подставлял бы бэкенд или прокси.

## Redux store

Один слайс `search`, два thunk-а, у каждого этапа свой `status` (`idle` / `loading` / `succeeded` / `failed`). Устаревшие ответы отбрасываются по `requestId` — это защищает от гонки, когда пользователь быстро кликает по разным брендам.

&#91;embedded content: поток данных · 2 этапа, 9 шагов\]

Второй этап повторяет первый, меняются только thunk и нормализация: `fetchParts` один на оба запроса.

**src/store/searchSlice.js**

```js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchParts } from '../api/favoritApi'
import { toBrands, toOfferRows } from '../api/normalize'

export const searchBrands = createAsyncThunk('search/brands', async (number, { signal }) => {
  const goods = await fetchParts({ number }, signal)
  return toBrands(goods)
})

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
        state.offers = emptyBlock
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
```

**src/store/index.js**

```js
import { configureStore } from '@reduxjs/toolkit'
import searchReducer from './searchSlice'

export const store = configureStore({ reducer: { search: searchReducer } })
```

В `main.jsx` оберните `<App />` в `<Provider store={store}>`.

Если хочется ещё и экономить запросы — отменяйте прошлый: `dispatch(thunk)` возвращает промис с методом `abort()`, его можно хранить в `useRef` и вызывать перед новым запросом. С проверкой `requestId` это уже не обязательно, а значит бонус.

## Компоненты и UI

Экран из трёх блоков сверху вниз: форма, список брендов, таблица предложений. На десктопе бренды можно поставить слева колонкой (`Col md={3}`), таблицу справа (`Col md={9}`); на телефоне они встанут друг под друга сами.

| Компонент | Что делает | Bootstrap |
| --- | --- | --- |
| `App` | Контейнер, заголовок, раскладка этапов | `Container`, `Row`, `Col` |
| `SearchForm` | Ввод артикула, `trim()`, submit → `searchBrands` | `Form`, `InputGroup`, `Button` |
| `BrandList` | Бренды кнопками, активный подсвечен, клик → `fetchOffers` | `ListGroup action active`, `Badge` для остатка |
| `OffersTable` | Строки предложений, искомая деталь первой | `Table striped hover responsive`, `Badge` |
| `Loader` | Спиннер с подписью «Ищем…» | `Spinner` |
| `ErrorAlert` | Текст ошибки + кнопка «Повторить» | `Alert variant="danger"` |

**SearchForm** — ключевая часть:

```jsx
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
```

**OffersTable** — колонки и правила вывода:

| Колонка | Источник | Если пусто |
| --- | --- | --- |
| Производитель | `brand` + бейдж «Искомая» при `isRequested` | — |
| Артикул | `number` | — |
| Наименование | `name` | — |
| Склад | `warehouse` | «—» |
| Цена, ₽ | `price` через `Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })` | «—» |
| Остаток, шт. | `stock` | «Нет в наличии» серым |
| Отгрузка | `shipmentDate` → «31.05, заказ до 15:30» | «—» |

Строки без остатка показывайте приглушёнными (`className="text-muted"`) в конце списка: сортировка по умолчанию — сначала искомая деталь, затем по наличию, затем по цене. Сортировку делайте через `useMemo` в компоненте или селектором — в store храните данные в исходном порядке.

## Обработка состояний

Каждый этап рендерит ровно одно из четырёх состояний по своему `status`; этот же список — тест-план для шага 6.

| Случай | Как воспроизвести | Что видит пользователь |
| --- | --- | --- |
| Ещё не искали | Открыть страницу | Подсказка «Введите артикул» |
| Загрузка брендов | Ввести `0189`, Enter | Спиннер, кнопка «Найти» неактивна |
| Бренды найдены | `0189` | Список брендов, подсказка «Выберите производителя» |
| Ничего не найдено | `7260500039S` (заглушка из доки) | `Alert variant="info"`: «По артикулу … ничего не найдено» |
| Пустой ввод | Пробелы | Кнопка неактивна, запрос не уходит |
| Неверный ключ | Испортить `VITE_API_KEY` | `Alert danger`: «Неверный ключ API» |
| Нет сети | DevTools → Network → Offline | `Alert danger` + кнопка «Повторить» |
| HTTP 5xx / не JSON | Временно сломать URL в прокси | `Alert danger`: «Сервер ответил ошибкой …» |
| Загрузка предложений | Клик по бренду | Спиннер на месте таблицы, список брендов остаётся |
| Аналогов нет | Деталь без аналогов | Таблица из одной искомой позиции + строка «Аналоги не найдены» |
| Всё без остатка | Бренд с `count: 0` (например, `NGK/NTK` по `0189`) | Строки с «Нет в наличии» |
| Быстрые клики | Кликнуть три бренда подряд | Показан результат последнего клика |
| Новый поиск | Найти другой артикул | Таблица этапа 2 сбрасывается |

Кнопка «Повторить» в `ErrorAlert` повторяет последний thunk: для этапа 1 — `searchBrands(query)`, для этапа 2 — `fetchOffers({ number: query, brand: selectedBrand })`.

## Деплой, README и сдача

Сдаёте две ссылки: репозиторий и живое демо. Если демо не взлетит, рабочий репозиторий с понятным README всё равно закрывает задание.

**Vercel** — `vercel.json` в корне, query-параметры прокидываются сами:

```json
{
  "rewrites": [
    { "source": "/api/", "destination": "http://api.favorit-parts.ru/hs/hsprice/" }
  ]
}
```

**Netlify** (запасной вариант) — файл `public/_redirects`:

```
/api/*  http://api.favorit-parts.ru/hs/hsprice/:splat  200
```

На хостинге задайте переменную окружения `VITE_API_KEY` до сборки. Возможный сюрприз: российский API может не отвечать на запросы с зарубежных серверов хостинга. Тогда в README напишите, что демо работает локально через `npm run dev`, и приложите скриншоты или короткую GIF.

**README** — что в нём должно быть:

- [ ] Одна фраза о проекте и ссылка на демо
- [ ] Запуск: `npm i`, скопировать `.env.example` в `.env`, вписать ключ, `npm run dev`
- [ ] Стек и почему RTK + `createAsyncThunk`
- [ ] Зачем прокси (CORS и http) и где он настроен
- [ ] Какие особенности API учтены: заглушка «не найдено», поле `error`, цена со склада
- [ ] Что бы улучшил при большем времени: тесты на `normalize.js` (Vitest), debounce, кеш, пагинация
- [ ] Ответы на «вопросы», если работодатель их пришлёт

**Финальный чек-лист перед отправкой**

- [ ] Чистый клон: `git clone` → `npm i` → `npm run dev` работает с нуля
- [ ] `npm run build` без ошибок, `npm run lint` чистый
- [ ] Ключа нет в истории git (`git log -p | grep <ключ>` пусто)
- [ ] Все случаи из таблицы «Обработка состояний» проверены
- [ ] Для каждой позиции видны название/производитель, цена и остаток — это обязательное требование
- [ ] В консоли браузера нет ошибок и warning про `key`
- [ ] Осмысленные коммиты, без «fix», «fix2», «final»
