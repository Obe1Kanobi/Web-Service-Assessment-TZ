const BASE_URL = '/api/'
const API_KEY = import.meta.env.VITE_API_KEY

const ERRORS = {
  'Empty key!': 'Не указан ключ API',
  'Invalid key client!': 'Неверный ключ API',
  'Empty number goods!': 'Введите артикул',
  'Request quota exceeded!': 'Превышен лимит запросов, попробуйте позже',
}

/**
 * Единственный метод на оба этапа: поиск брендов (без brand/analogues)
 * и поиск аналогов (brand + analogues:true).
 * Грязный ответ API — прокси, ключ, поле error, пустая заглушка — прячем здесь.
 */
export async function fetchParts({ number, brand, analogues = false, info = true }, signal) {
  if (!API_KEY) throw new Error('Не задан ключ API. Скопируйте .env.example в .env и впишите VITE_API_KEY');

  const params = new URLSearchParams({ key: API_KEY, number });
  if (brand) params.set('brand', brand)
  if (analogues) params.set('analogues', 'on')
  if (info) params.set('info', 'on')

  let res;
  try {
    res = await fetch(`${BASE_URL}?${params}`, { signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new Error('Нет связи с сервером. Проверьте интернет и повторите');
  }

  if (!res.ok) throw new Error(`Сервер ответил ошибкой ${res.status}`);

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Сервер вернул некорректный ответ');
  }

  // API отдаёт ошибку не статусом, а полем error (часто со статусом 200).
  if (data.error) throw new Error(ERRORS[data.error] ?? data.error);
  return Array.isArray(data.goods) ? data.goods : [];
}