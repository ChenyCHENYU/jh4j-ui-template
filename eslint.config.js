const pluginVue = require("eslint-plugin-vue");
const vueParser = require("vue-eslint-parser");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/*.d.ts",
      "src/auto-imports.d.ts",
      "src/components.d.ts",
      "src/env.d.ts",
      "vite/**/*",
      "scripts/**/*"
    ]
  },
  ...pluginVue.configs["flat/essential"],
  {
    files: ["**/*.{ts,tsx,vue}"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: "module",
        extraFileExtensions: [".vue"]
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  },
  {
    files: ["**/*.{js,cjs,mjs,ts,tsx,vue}"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }]
    }
  },
  {
    files: ["**/*.vue"],
    rules: {
      "vue/multi-word-component-names": ["error", { ignores: ["index"] }],
      "vue/no-v-html": "off",
      "vue/require-default-prop": "off",
      "vue/attributes-order": "warn",
      "vue/no-unused-components": "warn"
    }
  }
];
