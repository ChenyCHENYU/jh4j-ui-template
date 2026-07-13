import {colorOptions, levelOptions, range} from "./common-util";

/**
 * border
 * rounded
 */
function borderColor() {
  const ret = [];
  colorOptions().forEach(item => {
    levelOptions().forEach(l => {
      ret.push("border-" + item + "-" + l);
    });
  });

  return ret;
}

function borderStyle() {
  return ["solid", "dashed", "dotted", "double", "none"].map(item => "border-" + item);
}

function borderSize() {
  return [
    ...range(12, 0).map(item => "border-" + item),
    ...range(12, 0).map(item => "border-x-" + item),
    ...range(12, 0).map(item => "border-y-" + item),
    ...range(12, 0).map(item => "border-b-" + item),
    ...range(12, 0).map(item => "border-t-" + item),
    ...range(12, 0).map(item => "border-l-" + item),
    ...range(12, 0).map(item => "border-r-" + item),
  ]
}


export const border = function () {
  return [
    "border",
    "rounded",
    ...borderColor(),
    ...borderStyle(),
    ...borderSize(),
    ...Rounded.all(),
  ];
};

/**
 * 圆角
 */
class Rounded {
  static sizeLevel = [
    "none",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "1/2",
    "full",
  ];

  static direction = [
    "",
    "l",
    "r",
    "t",
    "b",
    "tl",
    "tr",
    "bl",
    "br",
  ];
  static all() {
    return [
      "rounded",
      ...this.color(),
      ...this.width(),
      ...this.size(),
    ];
  }

  static color() {
    const ret = [];
    // 圆角
    colorOptions().forEach(item => {
      levelOptions().forEach(l => {
        ret.push("rounded-" + item + "-" + l);
      });
    });
    return ret;
  }

  static width() {
    const rounded = range(12, 0).map(item => "rounded-" + item);
    return rounded;
  }

  // rounded-sm
  static size() {
    const ret = [];
    this.direction.forEach(dir => {
      this.sizeLevel.forEach(size => {
        if (dir) {
          ret.push("rounded-" + dir + "-" + size);
        }
        else {
          ret.push("rounded-" + size);
        }
      })
    });
    return ret;
  }
}

/**
 * 分割线
 */
class Divide {
  static all() {
    return [
      ...this.divide(),
      ...this.color(),
      ...this.opacity(),
      ...this.style(),
    ]
  }

  static divide() {
    const sizeOptions = [1, 2, 4, 6, 8, 10, 10, 14, 16, 18, 20];
    const x = ["divide-x", "divide-x-reverse"];
    const y = ["divide-y", "divide-y-reverse"];
    sizeOptions.forEach(size => {
      x.push("divide-x-" + size);
      y.push("divide-x-" + size);
    });
    return [
      ...x,
      ...y,
    ]
  }

  static color() {
    const ret = ["divide-current"];
    const colors = colorOptions();
    const levels = levelOptions();

    colors.forEach(color => {
      levels.forEach(l => {
        ret.push("divide-" + color + "-" + l);
      });
    });
    return ret;
  }

  static opacity() {
    const levels = [0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100];
    return levels.map(l => {
      return "divide-opacity-" + l;
    })
  }

  static style() {
    return ["divide-solid", "divide-dashed", "divide-dotted", "divide-double", "divide-none"];
  }
}
