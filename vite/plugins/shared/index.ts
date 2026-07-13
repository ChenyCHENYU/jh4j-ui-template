import fs from "fs";
import { list as pages } from "./pages";
import { list as flowDetails } from "./flow-detail";
import { list as messageDetails } from "./message-detail";
import { getShared } from "./utils";

export const getSharedComponents = function () {
  const ret: Record<string, string> = {
    ...getShared(pages)
  };

  // 过滤不存在的文件
  for (const [key, page] of Object.entries(ret)) {
    if (!fs.existsSync(page)) {
      console.log("文件不存在" + page);
      delete ret[key];
    }
  }

  // 审批详情
  Object.assign(ret, getShared(flowDetails));

  // 消息详情
  Object.assign(ret, getShared(messageDetails));

  return ret;
};
