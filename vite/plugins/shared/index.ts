import fs from "node:fs";
import path from "node:path";
import { list as pages } from "./pages";
import { list as flowDetails } from "./flow-detail";
import { list as messageDetails } from "./message-detail";
import { getShared } from "./utils";
import type { SharedPageItem } from "./utils";

const configuredPages = [...pages, ...flowDetails, ...messageDetails];
const viewsDirectory = path.resolve(process.cwd(), "src/views");

export function getSharedPageItems(debug = false): SharedPageItem[] {
  return configuredPages.filter((item) => {
    const page = path.resolve(viewsDirectory, item.name);
    const exists =
      page.startsWith(`${viewsDirectory}${path.sep}`) && fs.existsSync(page);

    if (!exists && debug) {
      console.log("Missing exposed page:", page);
    }
    return exists;
  });
}

export function getSharedComponents(items: SharedPageItem[]) {
  return getShared(items);
}
