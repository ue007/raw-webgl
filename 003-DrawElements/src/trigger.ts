/**
 * Trigger is an implements of Observer pattern.
 * Observers can subscribe or listen to Trigger.
 * Trigger maintains a list of listeners.
 * Trigger notifies observers or listeners when state changed or event occurred.
 * @example
 * // create a Trigger
 * let trigger = new Trigger();
 * // or create a subclass which extends Trigger
 * class Subclass extends Trigger {}
 */

type LISTENERS = {
  all?: any;
};
export class Trigger {
  _listeners: LISTENERS;

  constructor() {
    this._listeners = {};
  }

  /**
   * Listener callback function
   * @callback Trigger~callback
   * @param {Object} event - event object
   * @param {String} event.type - event type
   */

  /**
   * Add listener
   * @param {String} type - listener or event type
   * @param {Trigger~callback} listener - callback function
   * @param {Object} thisArg - the scope of listener function
   * @example
   * // use type 'all' to listen to all kind of events
   * trigger.on('all', (event) => {
   *   console.log(event);
   * });
   */
  on(type, listener, thisArg) {
    if (!type || !listener) {
      return this;
    }
    let self = this,
      listeners = self._listeners,
      bundles = listeners[type],
      bundle = {
        listener,
        thisArg,
      },
      _listener = listener._listener || listener;
    if (!bundles) {
      listeners[type] = bundle;
    } else if (Array.isArray(bundles)) {
      if (
        !bundles.some(
          (item) =>
            (item.listener._listener || item.listener) === _listener &&
            item.thisArg === bundle.thisArg
        )
      ) {
        bundles.push(bundle);
      }
    } else if (
      (bundles.listener._listener || bundles.listener) !== _listener ||
      bundles.thisArg !== bundle.thisArg
    ) {
      listeners[type] = [bundles, bundle];
    }
    return self;
  }

  /**
   * Add one-time listener
   * @param {String} type - listener or event type
   * @param {Trigger~callback} listener - callback function
   * @param {Object} thisArg - the scope of listener function
   * @example
   * trigger.once('change', (event) => {
   *   console.log(event);
   * });
   */
  once(type, listener, thisArg) {
    if (!type || !listener) {
      return this;
    }
    let self = this;
    this.on(
      type,
      function (event) {
        this._listeners = listener;
        listener.call(thisArg, event);
        self.off(type, listener, thisArg);
      },
      thisArg
    );
    return self;
  }

  /**
   * Remove listener
   * @param {String} type - listener or event type
   * @param {Trigger~callback} listener - callback function
   * @param {Object} thisArg - the scope of listener function
   * @example
   * let onChange = (event) => {
   *   console.log(event);
   * };
   * trigger.on('change', onChange);
   * trigger.off('change', onChange);
   */
  off(type, listener, thisArg) {
    let self = this,
      listeners = self._listeners,
      bundles = listeners[type];
    if (Array.isArray(bundles)) {
      bundles.some((bundle, i) => {
        if (
          (bundle.listener._listener || bundle.listener) === listener &&
          bundle.thisArg === thisArg
        ) {
          bundles.splice(i, 1);
          return true;
        }
        return false;
      });
    } else if (
      bundles &&
      (bundles.listener._listener || bundles.listener) === listener &&
      bundles.thisArg === thisArg
    ) {
      delete listeners[type];
    }
    return self;
  }

  /**
   * Notify listeners when state changed or event occurred
   * @param {Object} event - the event to notified
   * @param {String} event.type - event type
   * @example
   * trigger.fire({
   *   type: 'change',
   *   oldValue: 1,
   *   newValue: 2,
   * });
   */
  fire(event) {
    let self = this,
      listeners = self._listeners,
      strictBundles = listeners[event.type],
      allBundles = listeners.all,
      bundles;
    if (Array.isArray(strictBundles)) {
      if (allBundles) {
        bundles = strictBundles.concat(allBundles);
      } else {
        // Important, bundles will be changed if there is a once listener
        bundles = strictBundles.slice();
      }
    } else if (strictBundles) {
      if (allBundles) {
        bundles = [].concat(strictBundles, allBundles);
      } else {
        bundles = strictBundles;
      }
    } else {
      bundles = Array.isArray(allBundles) ? allBundles.slice() : allBundles;
    }
    if (Array.isArray(bundles)) {
      bundles.forEach((bundle) => {
        bundle.listener.call(bundle.thisArg, event);
      });
    } else if (bundles) {
      bundles.listener.call(bundles.thisArg, event);
    }
    return self;
  }
}
