import { range, sizeOptions } from './common-util';

class Size {
  static width() {
    return sizeOptions.map((item) => 'w-' + item);
  }

  static height() {
    return sizeOptions.map((item) => 'h-' + item);
  }

  static all() {
    return [...this.width(), ...this.height()];
  }
}

/**
 * 间隔
 */
class Space {
  static all() {
    return [...this.padding(), ...this.margin(), ...this.space()];
  }

  static space() {
    const size = range(6, 0);
    const types = ['space-x', 'space-y'];
    const ret = [];
    types.forEach((type) => {
      size.forEach((s) => {
        ret.push(type + '-' + s);
      });
    });
    return ret;
  }

  static padding() {
    const ret = [];
    ['pl', 'pr', 'pt', 'pb', 'px', 'py', 'p'].forEach((type) => {
      sizeOptions.forEach((size) => {
        ret.push(type + '-' + size);
      });
    });
    return ret;
  }
  static margin() {
    const ret = [];
    ['ml', 'mr', 'mt', 'mb', 'mx', 'my', 'm'].forEach((type) => {
      sizeOptions.forEach((size) => {
        ret.push(type + '-' + size);
      });
    });
    return ret;
  }
}

/**
 * grid布局
 */

class Grid {
  static gridCols() {
    return sizeOptions.map((item) => 'grid-cols-' + item);
  }

  static colSpan() {
    return sizeOptions.map((item) => "col-span-" + item);
  }

  static gridRows() {
    const res: string[] = [];
    for (let i = 0; i < 12; i++) {
      res.push("grid-rows-" + (i + 1));
    }
    return res;
  }

  static all() {
    return [
      'grid',
      ...this.gridCols(),
      ...this.colSpan(),
      ...this.gridRows(),
    ];
  }
}

/**
 * gap布局
 */

class Gap {
  static gapX() {
    return sizeOptions.map((item) => 'gap-x-' + item);
  }

  static gapY() {
    return sizeOptions.map((item) => 'gap-y-' + item);
  }

  static gap() {
    return sizeOptions.map((item) => 'gap-' + item);
  }

  static all() {
    return [...this.gapX(), ...this.gapY(), ...this.gap()];
  }
}

class TextLayout {
  static all() {
    return [
      "text-right",
      "text-left",
      "text-justify",
      "text-start",
      "text-end",
    ];
  }
}

export const layoutSaveList = function () {
  return [...Size.all(), ...Space.all(), ...Grid.all(), ...Gap.all(), ...TextLayout.all()];
};
