const DOMGlobals = ['window', 'document']
const NodeGlobals = ['module', 'require']

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module'
  },
  rules: {
    // 该规则旨在消除未使用的变量，函数和函数的参数。
    'no-unused-vars': [
      'error',
      // we are only using this rule to check for unused arguments since TS
      // catches unused variables but not args.
      { varsIgnorePattern: '.*', args: 'after-used', argsIgnorePattern: '^_' }
    ],
    // 该规则允许您指定您不希望在应用程序中使用的全局变量名称。
    // most of the codebase are expected to be env agnostic
    'no-restricted-globals': ['error', ...DOMGlobals, ...NodeGlobals],
    // since we target ES2015 for baseline support, we need to forbid object
    // 由于我们将ES2015作为基线支持的目标，我们需要禁止object
    // rest spread usage (both assign and destructure)
    // rest spread用法（assign和destructure）
    // 此规则不允许指定（即用户定义）语法。
    'no-restricted-syntax': [
      'error',
      // https://m.imooc.com/wenda/detail/562808 SpreadElement
      'ObjectExpression > SpreadElement',
      'ObjectPattern > RestElement'
    ]
  },
  overrides: [
    // tests, no restrictions (runs in Node / jest with jsdom)
    {
      files: ['**/__tests__/**', 'test-dts/**'],
      rules: {
        'no-restricted-globals': 'off',
        'no-restricted-syntax': 'off'
      }
    },
    // shared, may be used in any env
    {
      files: ['packages/shared/**'],
      rules: {
        'no-restricted-globals': 'off'
      }
    },
    // Packages targeting DOM
    {
      files: ['packages/{vue,runtime-dom}/**'],
      rules: {
        'no-restricted-globals': ['error', ...NodeGlobals]
      }
    },
    // Packages targeting Node
    {
      files: ['packages/{compiler-sfc,compiler-ssr,server-renderer}/**'],
      rules: {
        'no-restricted-globals': ['error', ...DOMGlobals],
        'no-restricted-syntax': 'off'
      }
    },
    // Private package, browser only + no syntax restrictions
    {
      files: ['packages/template-explorer/**'],
      rules: {
        'no-restricted-globals': ['error', ...NodeGlobals],
        'no-restricted-syntax': 'off'
      }
    }
  ]
}
