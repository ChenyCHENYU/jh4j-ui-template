import {colorOptions, levelOptions} from "./common-util";

/**
 * 特效
 */
export const effect = function () {
  return [
    ...BoxShadow.all()
  ]
};

const sizeOpt = ["sm", "md", "lg", "xl", "2xl", "3xl", "inner", "none"]
class BoxShadow {
  static all() {
    return [
      ...this.size(),
      ...this.color(),
    ];
  }

  static size() {
    return [
      ...sizeOpt.map(s => "shadow-" + s),
      ...sizeOpt.map(s => "drop-shadow-" + s)
    ];
  }

  static color() {
    const ret = [];
    colorOptions().forEach(color => {
      levelOptions().forEach(l => {
        ret.push("shadow-" + color + "-" + l);
        ret.push("drop-shadow-" + color + "-" + l);
      })
    });
    return ret;
  }
}
