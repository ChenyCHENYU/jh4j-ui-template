import fs from "fs";
import path from "path";

export const getCodeList = (filename: string, varName: string = "list") => {
  const ret = [];
  const code = fs.readFileSync(path.join(__dirname, filename), "utf-8");
  const sourceArr = code.split("\n");
  let s = 0;
  let e = 0;
  for (let i = 0; i < sourceArr.length; i++) {
    const item = sourceArr[i];
    if (item.includes("const " + varName + " = [")) {
      s = i;
    }
    if (item.includes("];")) {
      e = i;
      break;
    }
  }
  const source = sourceArr.filter((_, i) => i >= s && i <= e).filter(Boolean).map(item => item.trim()).filter(item => !item.startsWith(`//`)).join(" ");
  const reg = source.match(new RegExp("const " + varName + " = (\\[.*\\])\\;"));
  const data = new Function("return " + reg[1])();
  ret.push(...data);
  return ret;
}
