"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setDataToObjectAtPath = exports.onlyIfFunction = exports.isFunction = exports.Instancify = exports.extend = exports.defaultInstanceAlreadyWrittenErrorFunction = exports.deepFreeze = exports.convertPathStringToPathArray = exports.convertCustomFunctionsToTransformations = exports.clone = exports.addToPrototype = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _clone2 = require("clone");

var _clone3 = _interopRequireDefault(_clone2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Instancify(insecureData, instanceNumber, methods) {
    this.instanceNumber = instanceNumber;
    this.value = insecureData;
    addToPrototype(methods, this);
}

var addToPrototype = function addToPrototype(methods, contex) {
    Object.keys(methods).forEach(function (method) {
        contex[method] = methods[method];
    });
    return contex;
};
var clone = function clone(config, data) {
    if (config.shouldClone === false) return data;
    return config.customClone ? config.customClone(data) : (0, _clone3.default)(data);
};
var displayUnsupportedTransformationWarning = function displayUnsupportedTransformationWarning() {
    return console.warn("Trying to use on a non function for transformation methed");
};
var defaultInstanceAlreadyWrittenErrorFunction = function defaultInstanceAlreadyWrittenErrorFunction(instance) {
    return console.warn("Can't write alread written instance ->", instance);
};
var getType = function getType(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
};
var isArray = function isArray(obj) {
    return getType(obj) === "Array";
};
var isFunction = function isFunction(obj) {
    return getType(obj) === "Function";
};
var onlyIfFunction = function onlyIfFunction(obj, func) {
    if (!isFunction(obj)) {
        displayUnsupportedTransformationWarning();
        return obj;
    }
    return func();
};
var isNonNullObject = function isNonNullObject(obj) {
    return (typeof obj === "undefined" ? "undefined" : _typeof(obj)) === 'object' && obj !== null;
};
var deepFreeze = function deepFreeze(obj) {
    var shouldFreeze = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (!shouldFreeze) return obj;
    Object.getOwnPropertyNames(obj).forEach(function (name) {
        var prop = obj[name];
        if (isNonNullObject(prop)) deepFreeze(prop, shouldFreeze);
    });
    return Object.freeze(obj);
};
var getPathArray = function getPathArray(path) {
    return isArray(path) ? path : convertPathStringToPathArray(path);
};
var convertPathStringToPathArray = function convertPathStringToPathArray(path) {
    return path.replace(/[[\]]/g, '').split(".");
};
var setDataToObjectAtPath = function setDataToObjectAtPath(data, newData) {
    return function (arr) {
        var pathArray = getPathArray(arr);
        var last = pathArray.slice(-1);
        var rest = pathArray.slice(0, -1);
        var path = rest.reduce(function (acc, curr) {
            return acc[curr];
        }, data);
        try {
            path[last] = newData;
        } catch (e) {
            //could "Cannot assign to read only property" if instance was already written
            //but instead of throwing that, return the data and let the error function
            //in the writeNewInstanceOnce function get executed
        }
        return data;
    };
};
var convertCustomFunctionsToTransformations = function convertCustomFunctionsToTransformations(methods, configData, insecureData, newInstanceTransform) {
    Object.getOwnPropertyNames(configData.customSetters).forEach(function (prop) {
        methods[prop] = function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return newInstanceTransform.apply(undefined, [configData.customSetters[prop]].concat(args));
        };
    });

    Object.getOwnPropertyNames(configData.customGetters).forEach(function (prop) {
        methods[prop] = function () {
            var _configData$customGet;

            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            return (_configData$customGet = configData.customGetters)[prop].apply(_configData$customGet, [insecureData].concat(args));
        };
    });
    return methods;
};
var extend = function extend(objectToExtend, additionalProperties) {
    Object.keys(additionalProperties).forEach(function (prop) {
        objectToExtend[prop] = additionalProperties[prop];
    });
    return objectToExtend;
};

exports.addToPrototype = addToPrototype;
exports.clone = clone;
exports.convertCustomFunctionsToTransformations = convertCustomFunctionsToTransformations;
exports.convertPathStringToPathArray = convertPathStringToPathArray;
exports.deepFreeze = deepFreeze;
exports.defaultInstanceAlreadyWrittenErrorFunction = defaultInstanceAlreadyWrittenErrorFunction;
exports.extend = extend;
exports.Instancify = Instancify;
exports.isFunction = isFunction;
exports.onlyIfFunction = onlyIfFunction;
exports.setDataToObjectAtPath = setDataToObjectAtPath;