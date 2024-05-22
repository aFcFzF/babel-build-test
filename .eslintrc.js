/**
 * @file eslintrc
 * @author alfielv
 */

// 文件保留而不是直接合入package.json/eslintConfig。 为vscode静态检查使用。
module.exports = {
  extends: ['@tencent/eslint-config-crm-app'],
  parserOptions: {
    // 指定在当前项目路径下寻找’./tsconfig.json‘。（npm包已经配置过"project: './tsconfig.json'"）
    tsconfigRootDir: __dirname,
    warnOnUnsupportedTypeScriptVersion: false,
  },
  rules: {
    'linebreak-style': ['off', 'windows'],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      {
        accessibility: 'explicit',
        overrides: {
          accessors: 'explicit',
          constructors: 'no-public',
          methods: 'explicit',
          properties: 'off',
          parameterProperties: 'explicit',
        },
      },
    ],
    'prefer-nullish-coalescing': 'off',
    'no-param-reassign': 'off',
    'react-hooks/exhaustive-deps': ['error'],
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      },
    ],
  },
};
