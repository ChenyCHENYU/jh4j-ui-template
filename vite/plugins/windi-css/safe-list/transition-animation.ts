export const transitionAnimation = function () {
  const transition = ["ease-linear", "ease-in", "ease-out", "ease-in-out"];
  const duration = [0, 75, 100, 150, 200, 300, 500, 700, 1000];
  const property = [
    "", "none", "all", "colors", "opacity", "shadow", "transform"
  ];

  return [
    ...transition,
    ...duration.map(item => "duration-" + item),
    ...property.map(item => {
      if (!item) {
        return "transition";
      }
      return "transition-" + item;
    }),
    ...duration.map(item => "delay-" + item),
  ];

};
