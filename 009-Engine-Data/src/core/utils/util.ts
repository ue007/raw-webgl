let _DEBUG;

// if (typeof global !== 'undefined') {
//   _DEBUG = global.DEBUG;
// }

if (typeof _DEBUG === 'undefined') {
  _DEBUG = true;
}

/**
 * @namespace Util
 */

/**
 * Get client point from mouse event
 * @param  {MouseEvent} e - mouse event
 * @return {Object}   return client point
 * @memberOf Util
 */
export function getClientPoint(e: any) {
  return {
    x: (e.touches ? e.touches[0] : e).clientX,
    y: (e.touches ? e.touches[0] : e).clientY,
  };
}

/**
 * Determine whether the input is a Image
 * @param  {Object}  image - image object
 * @return {Boolean}       Return true if image is a Image
 * @memberOf Util
 */
export function isImage(
  image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
) {
  return (
    image instanceof HTMLImageElement ||
    image instanceof HTMLCanvasElement ||
    image instanceof HTMLVideoElement
  );
}

/**
 * Determine whether the input can be used for ImageBitmap source
 * @param  {Object}  image - image object
 * @return {Boolean}       return true if image can be used for ImageBitmap source
 * @memberOf Util
 */
export function isImageBitmapSource(
  image: Blob | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
) {
  return (
    image instanceof Blob ||
    image instanceof HTMLImageElement ||
    image instanceof HTMLCanvasElement ||
    image instanceof HTMLVideoElement
  );
}

export const isImageBitmapAvailable = false; // typeof ImageBitmap !== 'undefined';

/**
 * Determine whether the input is ImageBitmap
 * @param  {ImageBitmap}  image - ImageBitmap object
 * @return {Boolean}       return true if image is ImageBitmap
 * @memberOf Util
 */
export function isImageBitmap(image: ImageData | ImageBitmap) {
  return (
    image instanceof ImageData ||
    (isImageBitmapAvailable && image instanceof ImageBitmap)
  );
}

/**
 * Set canvas size
 * @param {HTMLCanvasElement} canvas - canvas
 * @param {Number} width  - width
 * @param {Number} height - height
 * @memberOf Util
 */
export function setCanvasSize(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  let ratio = window.devicePixelRatio || 1;
  width = width || canvas.width;
  height = height || canvas.height;
  // http://stackoverflow.com/questions/15892387/how-to-render-webgl-content-using-high-dpi-devices/15916364#15916364
  // https://www.khronos.org/webgl/wiki/HandlingHighDPI
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

/**
 * Perform a ajax request
 * @param  {String} url          - url
 * @param  {String} responseType - respose type
 * @return {Promise}              return Promise
 * @memberOf Util
 */
export function ajax(url: string, responseType: any) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (e) {
      if (this.readyState === 4) {
        if (this.status === 200) {
          let result = xhr.response;
          if (responseType === 'json' && typeof result === 'string') {
            result = JSON.parse(result);
          }
          resolve(result);
        } else {
          console.log('ajax error:', this.statusText);
          reject(new Error(`${this.responseURL} ${this.statusText}`));
        }
      }
    };
    xhr.open('get', url);
    if (responseType) {
      xhr.responseType = responseType;
    }
    xhr.send();
  });
}

/**
 * Convert function to URL, used for Worker
 * @param  {Function} fn - function
 * @return {DOMString}      return then converted URL
 * @memberOf Util
 */
export function fn2workerURL(fn) {
  let blob = new Blob([`(${fn.toString()})()`], {
    type: 'application/javascript',
  });
  // TODO URL.revokeObjectURL
  return URL.createObjectURL(blob);
}

export const DEBUG = _DEBUG;
