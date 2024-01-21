import type { KaiosDocument } from "../../types/dom";

let hidden, visibilityChange; 

const kaiosDocument = (document as KaiosDocument);
if (typeof kaiosDocument.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof kaiosDocument.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof kaiosDocument.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
} else if (typeof kaiosDocument.mozHidden !== "undefined") {
  hidden = "mozHidden";
  visibilityChange = "mozvisibilitychange";
}

export const HIDDEN: string = hidden;
export const VISIBILITY_CHANGE: string = visibilityChange;
