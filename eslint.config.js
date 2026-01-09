import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

let tseslint = null
let typescriptParser = null
try {
  // Try to dynamically import @typescript-eslint if it's available in the environment
  // Use top-level await so this file still exports a resolved config
  // eslint-disable-next-line no-unused-vars
  tseslint = await import('@typescript-eslint/eslint-plugin').catch(() => null)
  typescriptParser = await import('@typescript-eslint/parser').catch(() => null)
} catch {
  tseslint = null
  typescriptParser = null
}

const tsExtends = []
const tsParser = typescriptParser ? (typescriptParser.default || typescriptParser) : undefined
if (tseslint && tseslint.configs) {
  if (tseslint.configs.recommendedTypeChecked) tsExtends.push(tseslint.configs.recommendedTypeChecked)
  if (tseslint.configs.stylisticTypeChecked) tsExtends.push(tseslint.configs.stylisticTypeChecked)
}

export default defineConfig([
  globalIgnores(['dist']),
  // Backend Node files: enable Node env and prevent TS parser from applying
  {
    files: ['backend-polling-app/**'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    extends: [js.configs.recommended],
  },
  // TypeScript files (if typescript tooling available, include recommended rules)
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...(tsExtends.length ? tsExtends : []),
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: ['./tsconfig.json'],
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Your custom rules here
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
  },
])
