# Поиск автозапчастей (React + Redux)

Клиентское приложение для интеграции с API-сервисом поиска автозапчастей и аналогов
[`wsprice`](https://lk.favorit-parts.ru/static/wsprice.pdf). Двухэтапный подбор номенклатуры:

1. **Поиск производителей** — по артикулу получаем список брендов.
2. **Аналоги и предложения** — по артикулу + бренду получаем аналоги и предложения по складам.

## Запуск

```bash
npm i
npm run dev
```

- Скопируйте `.env.example` в `.env` (в репозиторий он не попадёт) и при необходимости
  впишите свой ключ `VITE_API_KEY`. Ключ из примера — публичный тестовый из документации, рабочий.
- Откройте `http://localhost:5173` и введите артикул, например `0189`.

### Команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Dev-сервер Vite с прокси на API |
| `npm run build` | Продакшен-сборка в `dist/` |
| `npm run preview` | Локальный просмотр собранного приложения |
| `npm run lint` | Проверка ESLint |
| `npm test` | Jest-тесты (однократно) |
| `npm run test:watch` | Jest в watch-режиме |

## Стек

- Vite + React 19 (JS)
- Redux Toolkit: `configureStore`, `createSlice`, `createAsyncThunk` — официальный способ писать Redux,
  статусы загрузки и защита от гонок через `requestId` из коробки
- Bootstrap 5 (CSS) + `react-bootstrap` — готовые `Table`, `Spinner`, `Alert`, `ListGroup`, `Badge`
- Запросы — нативный `fetch` + `URLSearchParams` (без axios): меньше зависимостей,
  спецсимволы в номере/бренде кодируются автоматически
- Тесты — Jest + `babel-jest` (см. раздел «Тесты»)

## Структура проекта

Три слоя: `api` знает про HTTP и формат ответа, `store` — про состояние, `components` — только рисуют.

```
├── .env.example            # VITE_API_KEY (публичный тестовый ключ)
├── vite.config.js          # dev-прокси /api → http://api.favorit-parts.ru/hs/hsprice
├── jest.config.js          # Jest + плагин import.meta.env → process.env
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx            # Provider + bootstrap.min.css
    ├── App.jsx             # компоновка двух этапов
    ├── api/
    │   ├── favoritApi.js   # fetchParts(params, signal) — вся «грязь» API здесь
    │   ├── normalize.js    # isEmptyGood, toBrands, toOfferRows
    │   └── __tests__/      # Jest-тесты favoritApi
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

## Как это работает

Один слайс [`searchSlice.js`](src/store/searchSlice.js#L30), два thunk-а, у каждого этапа свой
`status` (`idle` / `loading` / `succeeded` / `failed`):

1. [`searchBrands(number)`](src/store/searchSlice.js#L6) — запрос брендов, ответ нормализуется
   в `toBrands` (уникальные бренды).
2. [`fetchOffers({ number, brand })`](src/store/searchSlice.js#L12) — запрос аналогов
   (`analogues=on`), ответ превращается в строки «товар × склад» через `toOfferRows`.

Устаревшие ответы отбрасываются по `requestId` — это защищает от гонки, когда пользователь
быстро кликает по разным брендам. Новый поиск сбрасывает этап 2.

## Почему прокси

API `api.favorit-parts.ru` **не отдаёт CORS-заголовки**, поэтому из браузера `fetch()` напрямую
заблокирован — хотя тот же URL в адресной строке открывается (к навигации CORS не применяется).
Поэтому приложение ходит на свой домен `/api/...`, а Vite в dev-режиме пересылает запрос на API
(`server.proxy` в [`vite.config.js`](vite.config.js#L7)). На хостинге нужен аналогичный rewrite
(Vercel `vercel.json` / Netlify `public/_redirects`).

## Особенности API, которые учтены

- Пустая «не найдено»-заглушка: `goods` из одного элемента с `goodsID =
  00000000-0000-0000-0000-000000000000` и пустым `brand` — такие позиции отфильтровываются
  ([`src/api/normalize.js`](src/api/normalize.js#L3))
- Ошибка приходит не HTTP-статусом, а полем `{"error": "..."}` (часто со статусом 200) —
  проверяется всегда, известные коды переводятся на русский
  ([`src/api/favoritApi.js`](src/api/favoritApi.js#L15))
- `goods.price` помечен «НЕ ИСПОЛЬЗОВАТЬ» — цена берётся из `warehouses[].price`
- Позиции с `warehouses: []` показываются приглушёнными как «Нет в наличии»
- `shipmentDate` — дата отгрузки + время, до которого можно заказать — форматируется
  через `Intl.DateTimeFormat('ru-RU')` ([`src/utils/format.js`](src/utils/format.js#L13))
- `notRefund` (необходим `info=on`) — бейдж «Невозвратный»
- Аналоги приходят в `goods[0].analogues` — искомая деталь и аналоги рендерятся отдельными таблицами
- Спецсимволы (`#`, `&`, `/`) в номере и бренде кодирует `URLSearchParams` — строка вручную не склеивается
- Превышение лимита (`Request quota exceeded!`) показывается как есть, без лишних повторных запросов

## Тесты

[`src/api/__tests__/favoritApi.test.js`](src/api/__tests__/favoritApi.test.js#L37) — Jest-тесты
единственной точки общения с API:

- валидация ключа: без `VITE_API_KEY` — понятная ошибка, запрос к сети не уходит;
- формирование URL: `key`, `number`, `info=on` по умолчанию, `brand` и `analogues` по опциям;
- проброс `signal` в `fetch` (поддержка отмены через `AbortController`);
- ответы без `goods` или с не-массивом → `[]`;
- ошибки: `AbortError` пробрасывается как есть, сетевые/HTTP/JSON-ошибки и коды API
  превращаются в понятные русские сообщения.

Нюанс: исходники используют `import.meta.env.VITE_API_KEY` — фичу Vite, которой нет в Node.
Самописный Babel-плагин
([`babel-plugin-import-meta-env.cjs`](src/api/__tests__/helpers/babel-plugin-import-meta-env.cjs))
заменяет `import.meta.env.X` на `process.env.X`, поэтому в тестах ключ задаётся через
`process.env.VITE_API_KEY` (см. [`jest.config.js`](jest.config.js#L19)).

## Как делался проект

Основную часть кода — каркас, API-слой, Redux-слайс, компоненты, тесты — написал
ИИ-ассистент (Roo Code) по техническому плану
[«План поиск автозапчастей (React + Redux)»](План%20поиск%20автозапчастей%20%28React%20%2B%20Redux%29.md).
Человек правил стили и вёрстку (например,
[`src/components/style/OffersTable.style.jsx`](src/components/style/OffersTable.style.jsx#L1)),
проверял работу и вносил правки.
