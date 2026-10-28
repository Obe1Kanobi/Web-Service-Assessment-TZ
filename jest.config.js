/**
 * Jest-конфигурация для Vite-проекта (ESM-config, т.к. в package.json "type": "module").
 *
 * Проблема: исходники используют `import.meta.env.VITE_API_KEY` — фичу Vite,
 * которой нет в Node/Jest. Плагин `babel-plugin-import-meta-env` (см.
 * src/api/__tests__/helpers/babel-plugin-import-meta-env.cjs) при транспиляции
 * заменяет `import.meta.env.X` на `process.env.X`, поэтому в тестах ключ задаётся
 * через `process.env.VITE_API_KEY` (см. src/api/__tests__/favoritApi.test.js).
 *
 * Важно: плагин передаётся в babel-jest строкой-путём, а не функцией, —
 * Jest сериализует transform-опции в jest-worker'ы и функции в них теряются.
 */
import { fileURLToPath } from 'node:url';

const importMetaEnvPlugin = fileURLToPath(
  new URL('./src/api/__tests__/helpers/babel-plugin-import-meta-env.cjs', import.meta.url),
);

export default {
  testEnvironment: 'node',
  // Ищем только файлы *.test.js — хелперы (например, Babel-плагин в
  // __tests__/helpers/) тестами не являются.
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.jsx?$': [
      'babel-jest',
      {
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
        plugins: [importMetaEnvPlugin],
      },
    ],
  },
  clearMocks: true,
};
