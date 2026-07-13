import {colorOptions, levelOptions} from "./common-util";

class Color {
  static all() {
    const ret = [];
    colorOptions().forEach(color => {
      levelOptions().forEach(l => {
        ret.push("text-" + color + "-" + l);
      });
    });
    ret.push("text-white");
    return ret;
  }
}

export const common = function () {
  return [
    ...Color.all(),
  ]
};
