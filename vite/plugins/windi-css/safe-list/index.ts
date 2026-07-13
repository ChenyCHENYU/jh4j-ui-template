import { flexBox } from "./flex-box";
import { border } from "./border";
import { position } from "./position";
import { pointer } from "./pointer";
import { layoutSaveList } from "./layout";
import { background } from "./background";
import { common } from "./common";
import { action } from "./action";
import { effect } from "./effect";
import { fontOptions } from "./font";
import { float } from "./float";
import { transitionAnimation } from "./transition-animation";

export const safeList = function() {
  const ret = [
      ...layoutSaveList(),
      ...flexBox(),
      ...border(),
      ...position(),
      ...pointer(),
      ...background(),
      ...common(),
      ...action(),
      ...effect(),
      ...fontOptions(),
      "table",
      ...float(),
      ...transitionAnimation(),
      "bg-blue-700",
      "text-white"
    ]
  ;
  return ret;
};
