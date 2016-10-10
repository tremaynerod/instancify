"use strict";

import _clone from "clone";

function Instancify(insecureData, instanceNumber, methods) {
    this.instanceNumber = instanceNumber;
    this.value = insecureData;
    addToPrototype(methods, this);
}

const addToPrototype = (methods, contex) => {
    Object.keys(methods).forEach((method) => {
        contex[method] = methods[method];
    })
    return contex;
}
const clone = (config, data) => {
    if(config.shouldClone === false) return data;
    return config.customClone ? config.customClone(data) : _clone(data);
}
const displayUnsupportedTransformationWarning = () => console.warn("Trying to use on a non function for transformation methed");
const defaultInstanceAlreadyWrittenErrorFunction = instance => console.warn("Can't write alread written instance ->", instance);
const getType = obj => Object.prototype.toString.call(obj).slice(8, -1);
const isArray = obj => getType(obj) === "Array";
const isFunction = obj => getType(obj) === "Function";
const onlyIfFunction = (obj, func) => {
    if(!isFunction(obj)) {
        displayUnsupportedTransformationWarning();
        return obj;
    }
    return func();
}
const isNonNullObject = obj => typeof obj === 'object' && obj !== null;
const deepFreeze = (obj, shouldFreeze = true) => {
    if(!shouldFreeze) return obj;
    Object.getOwnPropertyNames(obj).forEach(function(name) {
        const prop = obj[name];
        if(isNonNullObject(prop)) deepFreeze(prop, shouldFreeze);
    });
    return Object.freeze(obj);
}
const getPathArray = path => isArray(path) ? path : convertPathStringToPathArray(path);
const convertPathStringToPathArray = path => path.replace(/[[\]]/g,'').split(".");
const setDataToObjectAtPath = (data, newData) => arr => {
    const pathArray = getPathArray(arr);
    const last = pathArray.slice(-1);
    const rest = pathArray.slice(0,-1);
    const path = rest.reduce((acc, curr) => acc[curr], data);
    try {
        path[last] = newData;
    } catch(e) {
        //could "Cannot assign to read only property" if instance was already written
        //but instead of throwing that, return the data and let the error function
        //in the writeNewInstanceOnce function get executed
    }
    return data;
}
const convertCustomFunctionsToTransformations = (methods, configData, insecureData, newInstanceTransform) => {
    Object.getOwnPropertyNames(configData.customSetters).forEach(prop => {
        methods[prop] = (...args) => newInstanceTransform(configData.customSetters[prop], ...args);
    });

    Object.getOwnPropertyNames(configData.customGetters).forEach(prop => {
        methods[prop] = (...args) => configData.customGetters[prop](insecureData, ...args);
    });
    return methods;
}
const extend = (objectToExtend, additionalProperties) => {
    Object.keys(additionalProperties).forEach(function(prop) {
        objectToExtend[prop] = additionalProperties[prop];
    });
    return objectToExtend;
}

export {
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
}
