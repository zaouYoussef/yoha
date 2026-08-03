/**
 * Polyfills légers pour vieux WebViews Android / Safari.
 * Chargé avant l'hydratation React (beforeInteractive).
 */
(function () {
  'use strict';

  try {
    if (typeof queueMicrotask !== 'function') {
      window.queueMicrotask = function (cb) {
        Promise.resolve()
          .then(cb)
          .catch(function (err) {
            setTimeout(function () {
              throw err;
            }, 0);
          });
      };
    }
  } catch (_) {}

  try {
    if (typeof Object.hasOwn !== 'function') {
      Object.hasOwn = function (obj, prop) {
        return Object.prototype.hasOwnProperty.call(Object(obj), prop);
      };
    }
  } catch (_) {}

  try {
    if (!Array.prototype.at) {
      Object.defineProperty(Array.prototype, 'at', {
        value: function (n) {
          var len = this.length;
          var i = Math.trunc(n) || 0;
          if (i < 0) i += len;
          if (i < 0 || i >= len) return undefined;
          return this[i];
        },
        writable: true,
        configurable: true,
      });
    }
  } catch (_) {}

  try {
    if (!String.prototype.replaceAll) {
      String.prototype.replaceAll = function (search, replacement) {
        if (Object.prototype.toString.call(search) === '[object RegExp]') {
          if (!search.global) {
            throw new TypeError('String.prototype.replaceAll called with a non-global RegExp');
          }
          return this.replace(search, replacement);
        }
        return this.split(String(search)).join(String(replacement));
      };
    }
  } catch (_) {}

  try {
    if (typeof globalThis === 'undefined') {
      // eslint-disable-next-line no-global-assign
      window.globalThis = window;
    }
  } catch (_) {}

  try {
    if (typeof structuredClone !== 'function') {
      window.structuredClone = function (value) {
        return JSON.parse(JSON.stringify(value));
      };
    }
  } catch (_) {}
})();
