"use strict";

import {
    addToPrototype,
    clone,
    convertCustomFunctionsToTransformations,
    convertPathStringToPathArray,
    deepFreeze,
    defaultInstanceAlreadyWrittenErrorFunction,
    extend,
    Instancify,
    isFunction,
    onlyIfFunction,
    setDataToObjectAtPath
} from "./utils";

const returnPartiallyAppliedFunction = (state, partiallyAppliedFunction) => (...args) => _writeNewInstance(state, partiallyAppliedFunction(...args));
const writeNewInstanceOnce = (state, writeNewInstanceFunc) => {
    if(state.instanceData.instanceAlreadyWritten) {
        const frozenInstanceData = state.instanceData.frozenInstanceData;
        state.configData.errorFunction(frozenInstanceData);
        return frozenInstanceData;
    } else {
        state.instanceData.instanceAlreadyWritten = true;
        return writeNewInstanceFunc();
    }
}
const _writeNewInstance = (state, insecureData) => isFunction(insecureData) ? returnPartiallyAppliedFunction(state, insecureData) : writeNewInstanceOnce(state, () => createNewInstance(clone(state.configData, insecureData), insecureData, state.configData));
const writeNewInstance = state => newData => _writeNewInstance(state, newData);
const writeNewInstanceWithTransformation = (state, secureData) => (transformation, ...args) => onlyIfFunction(transformation, () => _writeNewInstance(state, transformation(secureData, ...args)));
const writeNewInstanceWithPath = (state, secureData) => (path, newData) => _writeNewInstance(state, setDataToObjectAtPath(secureData, newData)(path));
const addFrozenInstanceToInstanceData = (frozenInsecureData, instanceData) => {
    instanceData.frozenInstanceData = frozenInsecureData;
    return frozenInsecureData;
}
const lift = (state, secureData) => newMethods => {
    extend(state.configData.customSetters, newMethods.customSetters || {});
    extend(state.configData.customGetters, newMethods.customGetters || {});
    return _writeNewInstance(state, secureData);
}
const addCustomMethods = (obj, configData, insecureData, writeNewInstanceWithTransformationPartial) => convertCustomFunctionsToTransformations(obj, configData, insecureData, writeNewInstanceWithTransformationPartial);
const createNewInstance = (secureData, insecureData, configData) => {
    const state = {
        configData,
        instanceData: {
            instanceAlreadyWritten: false,
            frozenInstanceData: null
        }
    };
    const writeNewInstanceWithTransformationPartial = writeNewInstanceWithTransformation(state, secureData);

    return addFrozenInstanceToInstanceData(
        deepFreeze(
            new Instancify(insecureData, state.configData.instanceNumber++, addCustomMethods({
                lift: lift(state, secureData),
                writeNewInstance: writeNewInstance(state),
                writeNewInstanceWithTransformation: writeNewInstanceWithTransformationPartial,
                writeNewInstanceWithPath: writeNewInstanceWithPath(state, secureData)
            }, configData, insecureData, writeNewInstanceWithTransformationPartial)),
        state.configData.shouldFreeze),
    state.instanceData);
}
const initConfigData = (userConfig) => ({
    errorFunction: userConfig.errorFunction || defaultInstanceAlreadyWrittenErrorFunction,
    shouldFreeze: userConfig.shouldFreeze,
    customSetters: userConfig.customSetters || {},
    customGetters: userConfig.customGetters || {},
    instanceNumber: 1,
    shouldClone: userConfig.shouldClone,
    customClone: userConfig.customClone
});

module.exports = (initialData, userConfig = {}) => createNewInstance(clone(userConfig, initialData), initialData, initConfigData(userConfig));
