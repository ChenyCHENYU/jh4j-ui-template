import {colorOptions, levelOptions} from "./common-util";

class BackgroundColor {
  static all() {
    const ret = [];
    colorOptions().forEach(color => {
      levelOptions().forEach(level => {
        ret.push("bg-" + color + "-" + level);
      })
    });
    ret.push("bg-white");
    return ret;
  }
}

export const background = function () {
  return [
    ...BackgroundColor.all(),
  ]
};
