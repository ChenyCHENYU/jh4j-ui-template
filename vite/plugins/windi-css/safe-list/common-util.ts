export const levelOptions = function () {
  return [
    "50",
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
  ]
};
export const sizeOptions = ["auto", "full", "min", "max",
  "0", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12",
  "14", "16", "18", "20", "24", "32", "36", "40", "44", "48", "52", "56", "64", "72", "80", "96",
  "1/2", "1/3", "1/5", "3/5",
  "1/2",
  "1/3",
  "2/3",
  "1/4",
  "2/4",
  "3/4",
  "1/5",
  "2/5",
  "3/5",
  "4/5",
];

export function range(size, startAt = 1) {
  return Array.from(Array(size).keys()).map(i => i + startAt)
}

export const colorOptions = function () {
  return ["gray", "blue", "red", "yellow", "green"];
};
