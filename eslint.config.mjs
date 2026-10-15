import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Ningún texto visible literal en JSX: todo pasa por next-intl.
    files: ["src/**/*.tsx"],
    rules: {
      "react/jsx-no-literals": [
        "error",
        {
          noStrings: true,
          ignoreProps: true,
          // Separadores y signos sueltos que no se traducen.
          allowedStrings: ["·", "—", "–", "/", "|", ":", ",", ".", "(", ")", "×", "=", "+", "%", "US$"],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name=/^(alt|title|placeholder|aria-label|aria-description|label)$/] > Literal",
          message: "Texto visible sin traducir: usá next-intl.",
        },
        {
          selector:
            "JSXAttribute[name.name=/^(alt|title|placeholder|aria-label|aria-description|label)$/] > JSXExpressionContainer > TemplateLiteral[expressions.length=0]",
          message: "Texto visible sin traducir: usá next-intl.",
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "screenshots/**", "test-results/**"]),
]);

export default eslintConfig;
