export interface SharedPageItem {
  /** 相对于 src/views/ 的路径 */
  name: string;
  /** 页面中文名 */
  label: string;
}

/** 生成 Vite 共享页面配置（用于 federation exposes） */
export const getShared = (items: SharedPageItem[]) =>
  Object.fromEntries(
    items.map((it) => [`./${it.name}`, `./src/views/${it.name}`])
  );
