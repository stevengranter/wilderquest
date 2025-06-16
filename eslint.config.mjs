// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from "eslint-config-prettier/flat";
import reactCompiler from 'eslint-plugin-react-compiler'

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        plugins: {
            'react-compiler': reactCompiler,
        },
        rules: {
            'react-compiler/react-compiler': 'error',
            // First, disable the base no-unused-vars rule
            'no-unused-vars': 'off',

            // Then, enable the TypeScript-specific rule with the desired options
            '@typescript-eslint/no-unused-vars': [
                'warn', // or "error"
                {
                    'argsIgnorePattern': '^_',
                    'varsIgnorePattern': '^_',
                    'caughtErrorsIgnorePattern': '^_',
                },
            ],
        },
    },
    eslintConfigPrettier
)
