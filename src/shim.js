const XHR = XMLHttpRequest;

export function shimXHR() {
  const xhrProto = XMLHttpRequest.prototype;
  XMLHttpRequest = function() {
    return new XHR({
      mozAnon: true,
      mozSystem: true,
      mozBackgroundRequest: true,
    });
  };
  XMLHttpRequest.prototype = xhrProto;
}

export function removeNoscript() {
  const noscript = document.querySelectorAll('noscript');
  for (let i = 0, e = noscript.length; i < e; i++) {
    noscript[i].remove();
  }
}
