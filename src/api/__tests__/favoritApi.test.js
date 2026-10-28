/**
 * Тесты для src/api/favoritApi.js — единственная точка общения с
 * API Favorit Parts (аналоги/бренды).
 *
 * Ключ API в исходнике читается из `import.meta.env.VITE_API_KEY`.
 * В Jest его заменяет process.env (см. плагин replaceImportMetaEnv в jest.config.js),
 * поэтому перед каждым require() модуля задаём process.env.VITE_API_KEY,
 * а сам модуль перезагружаем через jest.resetModules().
 */

const API_KEY = '00000000-0000-0000-0000-000000000001';
const NUMBER = '0451003835';
const GOODS = [{ brand: 'BOSCH', article: NUMBER }];

/** Перезагружает модуль favoritApi с указанным ключом API и возвращает fetchParts. */
function loadFetchParts(apiKey = API_KEY) {
  jest.resetModules();
  process.env.VITE_API_KEY = apiKey;
  // eslint-disable-next-line global-require
  return require('../favoritApi').fetchParts;
}

/** Мокает fetch ответом от API. По умолчанию — успешный JSON. */
function mockResponse({ ok = true, status = 200, body = {} } = {}) {
  global.fetch.mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  });
}

/** Возвращает распарсенный URL последнего вызова fetch (base — для относительного '/api/...'). */
function lastFetchUrl() {
  return new URL(global.fetch.mock.calls.at(-1)[0], 'http://localhost');
}

describe('fetchParts', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete process.env.VITE_API_KEY;
  });

  describe('валидация ключа API', () => {
    it('бросает понятную ошибку, если VITE_API_KEY не задан', async () => {
      const fetchParts = loadFetchParts('');
      await expect(fetchParts({ number: NUMBER })).rejects.toThrow(
        'Не задан ключ API. Скопируйте .env.example в .env и впишите VITE_API_KEY',
      );
    });

    it('не делает запрос к сети, если ключ не задан', async () => {
      const fetchParts = loadFetchParts('');
      await fetchParts({ number: NUMBER }).catch(() => {});
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('успешный запрос', () => {
    it('возвращает массив goods из ответа API', async () => {
      const fetchParts = loadFetchParts();
      mockResponse({ body: { goods: GOODS } });

      await expect(fetchParts({ number: NUMBER })).resolves.toEqual(GOODS);
    });

    it('формирует URL: key, number, info=on по умолчанию, без brand и analogues', async () => {
      const fetchParts = loadFetchParts();
      mockResponse();

      await fetchParts({ number: NUMBER });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const url = lastFetchUrl();
      expect(url.pathname).toBe('/api/');
      expect(url.searchParams.get('key')).toBe(API_KEY);
      expect(url.searchParams.get('number')).toBe(NUMBER);
      expect(url.searchParams.get('info')).toBe('on');
      expect(url.searchParams.get('brand')).toBeNull();
      expect(url.searchParams.get('analogues')).toBeNull();
    });

    it('добавляет brand и analogues=on, а info убирает, если опции переданы явно', async () => {
      const fetchParts = loadFetchParts();
      mockResponse();

      await fetchParts({ number: NUMBER, brand: 'BOSCH', analogues: true, info: false });

      const url = lastFetchUrl();
      expect(url.searchParams.get('brand')).toBe('BOSCH');
      expect(url.searchParams.get('analogues')).toBe('on');
      expect(url.searchParams.get('info')).toBeNull();
    });

    it('пробрасывает signal в fetch (поддержка отмены через AbortController)', async () => {
      const fetchParts = loadFetchParts();
      const controller = new AbortController();
      mockResponse();

      await fetchParts({ number: NUMBER }, controller.signal);

      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), {
        signal: controller.signal,
      });
    });
  });

  describe('ответ без goods', () => {
    it('возвращает [], если в ответе нет массива goods', async () => {
      const fetchParts = loadFetchParts();
      mockResponse({ body: { total: 10 } });

      await expect(fetchParts({ number: NUMBER })).resolves.toEqual([]);
    });

    it('возвращает [], если goods не массив', async () => {
      const fetchParts = loadFetchParts();
      mockResponse({ body: { goods: 'not-an-array' } });

      await expect(fetchParts({ number: NUMBER })).resolves.toEqual([]);
    });
  });

  describe('ошибки', () => {
    /**
     * Отмену запроса нельзя прятать за «Нет связи с сервером» —
     * именно по AbortError компоненты отличают отмену от реальной ошибки.
     */
    it('пробрасывает AbortError как есть, без подмены сообщения', async () => {
      const fetchParts = loadFetchParts();
      const abortError = new DOMException('Aborted', 'AbortError');
      global.fetch.mockRejectedValue(abortError);

      await expect(fetchParts({ number: NUMBER })).rejects.toBe(abortError);
    });

    it('превращает сетевую ошибку в русское сообщение о связи', async () => {
      const fetchParts = loadFetchParts();
      global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(fetchParts({ number: NUMBER })).rejects.toThrow(
        'Нет связи с сервером. Проверьте интернет и повторите',
      );
    });

    it('бросает ошибку с HTTP-статусом, если ответ не OK', async () => {
      const fetchParts = loadFetchParts();
      mockResponse({ ok: false, status: 500 });

      await expect(fetchParts({ number: NUMBER })).rejects.toThrow(
        'Сервер ответил ошибкой 500',
      );
    });

    it('бросает ошибку, если тело ответа — некорректный JSON', async () => {
      const fetchParts = loadFetchParts();
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token < in JSON')),
      });

      await expect(fetchParts({ number: NUMBER })).rejects.toThrow(
        'Сервер вернул некорректный ответ',
      );
    });

    it('переводит известную ошибку API в русское сообщение', async () => {
      const fetchParts = loadFetchParts();
      mockResponse({ body: { error: 'Empty key!' } });

      await expect(fetchParts({ number: NUMBER })).rejects.toThrow(
        'Не указан ключ API',
      );
    });

    it('переводит превышение лимита запросов в русское сообщение', async () => {
      const fetchParts = loadFetchParts();
      mockResponse({ body: { error: 'Request quota exceeded!' } });

      await expect(fetchParts({ number: NUMBER })).rejects.toThrow(
        'Превышен лимит запросов, попробуйте позже',
      );
    });

    it('пробрасывает неизвестную ошибку API как есть', async () => {
      const fetchParts = loadFetchParts();
      mockResponse({ body: { error: 'Some unknown error code' } });

      await expect(fetchParts({ number: NUMBER })).rejects.toThrow(
        'Some unknown error code',
      );
    });
  });
});
