import {sizeOptions} from "./common-util";

function positionSize() {
  const types = [
    "top", "-top", "left", "-left", "right", "-right", "bottom", "-bottom"
  ];
  const ret = [];
  types.forEach(t => {
    sizeOptions.forEach(size => {
      ret.push(t + "-" + size);
    });
  });
  return ret;
}
export const position = function () {
  return [
    "absolute", "relative", "fixed", "sticky",
    ...positionSize(),
  ];
};
