/**
 * Babel-плагин для Jest: заменяет `import.meta.env.X` на `process.env.X`.
 *
 * Зачем: исходники Vite используют `import.meta.env` — в Node/Jest этого
 * объекта нет. Плагин указан в jest.config.js (transform babel-jest) как
 * строка-путь — так он переживает сериализацию конфига в jest-worker'ы
 * (в отличие от инлайн-функции).
 *
 * Дополнительно голый `import.meta` или `import.meta.<не-env>` заменяются
 * на `{}`, чтобы не падал парсер.
 */
module.exports = function replaceImportMetaEnv({ types: t }) {
  /** Узел является MetaProperty вида import.meta? */
  const isImportMeta = (node) =>
    t.isMetaProperty(node) &&
    t.isIdentifier(node.meta, { name: 'import' }) &&
    t.isIdentifier(node.property, { name: 'meta' });

  return {
    name: 'replace-import-meta-env',
    visitor: {
      // import.meta.env.<Свойство> => process.env.<Свойство>
      MemberExpression(path) {
        const { node } = path;
        if (!node.computed && t.isIdentifier(node.property) && isImportMeta(node.object.object)) {
          path.get('object').replaceWith(
            t.memberExpression(t.identifier('process'), t.identifier('env')),
          );
          path.skip();
        }
      },
      // Голый import.meta / import.meta.<не-env> => {}, чтобы не падал парсер.
      MetaProperty(path) {
        if (isImportMeta(path.node)) {
          path.replaceWith(t.objectExpression([]));
        }
      },
    },
  };
};
