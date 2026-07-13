
class Overflow {
  static all() {
    const types = [
      "auto",
      "hidden",
      "visible",
      "scroll",
      "x-auto",
      "y-auto",
      "x-hidden",
      "y-hidden",
    ];
    return types.map(item => "overflow-" + item);
  }
}

export const action = function () {
  return [
    ...Overflow.all()
  ];
};
