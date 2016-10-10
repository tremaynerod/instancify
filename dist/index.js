"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _utils = require("./utils");

var returnPartiallyAppliedFunction = function returnPartiallyAppliedFunction(state, partiallyAppliedFunction) {
    return function () {
        return _writeNewInstance(state, partiallyAppliedFunction.apply(undefined, arguments));
    };
};
var writeNewInstanceOnce = function writeNewInstanceOnce(state, writeNewInstanceFunc) {
    if (state.instanceData.instanceAlreadyWritten) {
        var frozenInstanceData = state.instanceData.frozenInstanceData;
        state.configData.errorFunction(frozenInstanceData);
        return frozenInstanceData;
    } else {
        state.instanceData.instanceAlreadyWritten = true;
        return writeNewInstanceFunc();
    }
};
var _writeNewInstance = function _writeNewInstance(state, insecureData) {
    return (0, _utils.isFunction)(insecureData) ? returnPartiallyAppliedFunction(state, insecureData) : writeNewInstanceOnce(state, function () {
        return createNewInstance((0, _utils.clone)(state.configData, insecureData), insecureData, state.configData);
    });
};
var writeNewInstance = function writeNewInstance(state) {
    return function (newData) {
        return _writeNewInstance(state, newData);
    };
};
var writeNewInstanceWithTransformation = function writeNewInstanceWithTransformation(state, secureData) {
    return function (transformation) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        return (0, _utils.onlyIfFunction)(transformation, function () {
            return _writeNewInstance(state, transformation.apply(undefined, [secureData].concat(args)));
        });
    };
};
var writeNewInstanceWithPath = function writeNewInstanceWithPath(state, secureData) {
    return function (path, newData) {
        return _writeNewInstance(state, (0, _utils.setDataToObjectAtPath)(secureData, newData)(path));
    };
};
var addFrozenInstanceToInstanceData = function addFrozenInstanceToInstanceData(frozenInsecureData, instanceData) {
    instanceData.frozenInstanceData = frozenInsecureData;
    return frozenInsecureData;
};
var lift = function lift(state, secureData) {
    return function (newMethods) {
        (0, _utils.extend)(state.configData.customSetters, newMethods.customSetters || {});
        (0, _utils.extend)(state.configData.customGetters, newMethods.customGetters || {});
        return _writeNewInstance(state, secureData);
    };
};
var addCustomMethods = function addCustomMethods(obj, configData, insecureData, writeNewInstanceWithTransformationPartial) {
    return (0, _utils.convertCustomFunctionsToTransformations)(obj, configData, insecureData, writeNewInstanceWithTransformationPartial);
};
var createNewInstance = function createNewInstance(secureData, insecureData, configData) {
    var state = {
        configData: configData,
        instanceData: {
            instanceAlreadyWritten: false,
            frozenInstanceData: null
        }
    };
    var writeNewInstanceWithTransformationPartial = writeNewInstanceWithTransformation(state, secureData);

    return addFrozenInstanceToInstanceData((0, _utils.deepFreeze)(new _utils.Instancify(insecureData, state.configData.instanceNumber++, addCustomMethods({
        lift: lift(state, secureData),
        writeNewInstance: writeNewInstance(state),
        writeNewInstanceWithTransformation: writeNewInstanceWithTransformationPartial,
        writeNewInstanceWithPath: writeNewInstanceWithPath(state, secureData)
    }, configData, insecureData, writeNewInstanceWithTransformationPartial)), state.configData.shouldFreeze), state.instanceData);
};
var initConfigData = function initConfigData(userConfig) {
    return {
        errorFunction: userConfig.errorFunction || _utils.defaultInstanceAlreadyWrittenErrorFunction,
        shouldFreeze: userConfig.shouldFreeze,
        customSetters: userConfig.customSetters || {},
        customGetters: userConfig.customGetters || {},
        instanceNumber: 1,
        shouldClone: userConfig.shouldClone,
        customClone: userConfig.customClone
    };
};
var instancify = function instancify(initialData) {
    var userConfig = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return createNewInstance((0, _utils.clone)(userConfig, initialData), initialData, initConfigData(userConfig));
};

exports.default = instancify;