import {defineConfig} from 'windicss/helpers';
import {safeList} from "@jhlc/common-core/src/windi-css/safe-list";


export default defineConfig({
 important: true,
 extract: {
  include: [
   './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
 },
 darkMode: 'class',
 safelist: [
   ...safeList(),
   "table"
 ],
 plugins: [],
 theme: {
  extend: {
  }
 },
})
