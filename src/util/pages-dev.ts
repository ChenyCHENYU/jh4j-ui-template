export const getViewPage = function (module: string, view: string) {
  const list = [];

  return list.find((item) => item.name == view)?.component;
};
