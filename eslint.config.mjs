import { defineConfig, globalIgnores } from 'eslint/config'
import love from 'eslint-config-love'
import prettier from 'eslint-config-prettier/flat'

const TS_FILES = ['**/*.{ts,mts}']

export default defineConfig([
  { ...love, files: TS_FILES },

  {
    files: TS_FILES,
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-param-reassign': [
        'error',
        { props: true, ignorePropertyModificationsFor: ['req'] }
      ]
    }
  },

  {
    files: ['src/utils/logger.ts'],
    rules: {
      'no-console': 'off'
    }
  },

  prettier,

  globalIgnores(['node_modules/**'])
])
