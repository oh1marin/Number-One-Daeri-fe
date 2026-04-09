import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** next lint 비대화형 실행용 — 규칙은 next/core-web-vitals 만 */
export default [...compat.extends("next/core-web-vitals")];
