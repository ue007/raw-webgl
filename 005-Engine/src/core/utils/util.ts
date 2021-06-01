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
 * Version number
 * @member {String} version
 * @static
 * @memberOf Util
 */
export { version } from '../package.json';

/**
 * Get client point from mouse event
 * @param  {MouseEvent} e - mouse event
 * @return {Object}   return client point
 * @memberOf Util
 */
export function getClientPoint(e) {
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
export function isImage(image) {
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
export function isImageBitmapSource(image) {
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
export function isImageBitmap(image) {
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
export function setCanvasSize(canvas, width, height) {
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
export function ajax(url, responseType) {
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
 * Define property for prototype
 * @param  {Object} object - prototype
 * @param  {Object} property - property
 * @param  {String} property.name - property name
 * @param  {Object} property.value - value
 * @param  {Function} property.get - get function
 * @param  {Boolean} property.noSet - whether need set function
 * @param  {Function} property.set - set function
 * @param  {Function} property.converter - function used to convert value
 * @param  {String} property.dirty - dirty flag, set dirty flag to true when value changed
 * @param  {Function} property.callback - callback function when value changed
 * @memberOf Util
 */
export function defineProperty(object, property) {
  let { name } = property,
    privateName = `_${name}`,
    descriptor;
  object[privateName] = property.value;
  descriptor = {
    configurable: true,
    enumerable: true,
    get:
      property.get ||
      function () {
        return this[privateName];
      },
  };
  if (!property.noSet) {
    descriptor.set =
      property.set ||
      function (value) {
        let self = this,
          oldValue = self[privateName];
        if (property.converter) {
          value = property.converter(value);
        }
        self[privateName] = value;
        if (property.dirty) {
          self[property.dirty] = true;
        }
        if (property.callback) {
          property.callback.call(self, oldValue, value);
        }
        self.fire({
          type: 'change',
          data: self,
          property: name,
          oldValue,
          newValue: value,
        });
      };
  }
  Object.defineProperty(object, name, descriptor);
}

/**
 * Define properties for prototype
 * @param  {Object} object - the prototype object to define properties
 * @param  {Array} properties properties
 * @memberOf Util
 */
export function defineProperties(object, properties) {
  properties.forEach((property) => {
    defineProperty(object, property);
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

/**
 * Create a debounced version of function
 * @param  {Function} func - function
 * @return {Function}      return a debounced version of function
 * @memberOf Util
 */
export function debounce(func) {
  let timer;
  return (event) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(func, 100, event);
  };
}

export const DEBUG = _DEBUG;
