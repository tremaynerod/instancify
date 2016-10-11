"use strict";

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _dist = require('../../dist');

var _dist2 = _interopRequireDefault(_dist);

var _utils = require('../../dist/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assert = _chai2.default.assert;

describe('instancify', function () {
    var data = [{
        a: 1
    }, {
        b: {
            c: 2
        }
    }];
    var data2 = {
        a: [1, 2, 3],
        b: {
            c: [4]
        }
    };
    var identityTransform = function identityTransform(data) {
        return data;
    };

    describe("instancifying", function () {
        it('primitive values before and after instancifying should be equal', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var data2Instance1 = (0, _dist2.default)(data2);

            assert.equal(data[0].a, dataInstance1.value[0].a);
            assert.equal(data[1].b.c, dataInstance1.value[1].b.c);
            assert.equal(data2.a[2], data2Instance1.value.a[2]);
            assert.equal(data2.b.c[0], data2Instance1.value.b.c[0]);
        });

        it('after instancifying should have instancify properties', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var data2Instance1 = (0, _dist2.default)(data2);

            assert.property(dataInstance1, 'writeNewInstance');
            assert.property(dataInstance1, 'writeNewInstanceWithTransformation');
            assert.property(dataInstance1, 'writeNewInstanceWithPath');
            assert.property(dataInstance1, 'instanceNumber');
            assert.property(data2Instance1, 'writeNewInstance');
            assert.property(data2Instance1, 'writeNewInstanceWithTransformation');
            assert.property(data2Instance1, 'writeNewInstanceWithPath');
            assert.property(data2Instance1, 'instanceNumber');
        });

        it('data returned after instancifying is immutable', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var data2Instance1 = (0, _dist2.default)(data2);
            var tryToExtendDataInstance1 = function tryToExtendDataInstance1() {
                dataInstance1.value.a = 0;
            };
            var tryToSetDataInstance1 = function tryToSetDataInstance1() {
                dataInstance1.value[0].a = 0;
            };
            var tryToSetData2Instance1 = function tryToSetData2Instance1() {
                data2Instance1.value.a[2] = 0;
            };

            assert.throws(tryToExtendDataInstance1, "Can\'t add property a, object is not extensible");
            assert.throws(tryToSetDataInstance1, "Cannot assign to read only property \'a\' of object \'#<Object>\'");
            assert.throws(tryToSetData2Instance1, "Cannot assign to read only property \'2\' of object \'[object Array]\'");
        });
    });

    describe("instances", function () {
        it('calling a write method on an instance returns new referneces', function () {
            var dataInstance1 = (0, _dist2.default)(data).writeNewInstanceWithTransformation(identityTransform);
            var data2Instance1 = (0, _dist2.default)(data2).writeNewInstanceWithTransformation(identityTransform);

            assert.notEqual(data[0], dataInstance1.value[0]);
            assert.notEqual(data[1].b, dataInstance1.value[1].b);
            assert.notEqual(data2.a, data2Instance1.value.a);
            assert.notEqual(data2.b.c, data2Instance1.value.b.c);
        });

        it('each new instance increments instanceNumber property', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var dataInstance2 = dataInstance1.writeNewInstanceWithTransformation(identityTransform);
            var dataInstance3 = dataInstance2.writeNewInstanceWithTransformation(identityTransform);

            assert.equal(1, dataInstance1.instanceNumber);
            assert.equal(2, dataInstance2.instanceNumber);
            assert.equal(3, dataInstance3.instanceNumber);
        });

        it('each instance can only be written once', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var dataInstance2 = dataInstance1.writeNewInstanceWithTransformation(identityTransform);
            var dataInstance3 = dataInstance2.writeNewInstanceWithTransformation(identityTransform);
            var dataInstance4 = dataInstance1.writeNewInstance(1);
            var dataInstance5 = dataInstance2.writeNewInstance(1);
            var dataInstance6 = dataInstance3.writeNewInstance(1);

            assert.notEqual(1, dataInstance4.value);
            assert.notEqual(1, dataInstance5.value);
            assert.equal(1, dataInstance6.value);
        });
    });

    describe("method testing", function () {
        it('writeNewInstance', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var dataInstance2 = dataInstance1.writeNewInstance(["completely new data"]);
            var dataInstance3 = dataInstance2.writeNewInstance({
                data: "more new data"
            });

            assert.equal(dataInstance2.value[0], "completely new data");
            assert.notEqual(dataInstance3.value[0], "completely new data");
            assert.equal(dataInstance3.value.data, "more new data");
        });

        it('writeNewInstanceWithTransformation', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var dataInstance2 = dataInstance1.writeNewInstanceWithTransformation(function (data) {
                data[1].b.c = [1, 2, 3, 4, 5];
                return data;
            });

            assert.deepEqual(dataInstance2.value[1].b.c, [1, 2, 3, 4, 5]);
            assert.notDeepEqual(dataInstance1.value[1].b.c, [1, 2, 3, 4, 5]);
        });

        it('writeNewInstanceWithPath', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var dataInstance2 = dataInstance1.writeNewInstanceWithPath("[1].b.c", [1, 2, 3]);
            var data2Instance1 = (0, _dist2.default)(data2);
            var data2Instance2 = data2Instance1.writeNewInstanceWithPath(["b", "c", 0], "new value");

            assert.deepEqual(dataInstance2.value[1].b.c, [1, 2, 3]);
            assert.notDeepEqual(dataInstance1.value[1].b.c, [1, 2, 3]);
            assert.equal(data2Instance2.value.b.c[0], "new value");
            assert.notEqual(data2Instance1.value.b.c[0], "new value");
        });

        it('can lift custom methods for future instances', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var dataInstance2 = dataInstance1.lift({
                customSetters: {
                    replaceTheData: function replaceTheData(data) {
                        return "completely replaced the data";
                    }
                }
            });
            var dataInstance3 = dataInstance2.replaceTheData();

            assert.notProperty(dataInstance1, 'replaceTheData');
            assert.property(dataInstance2, 'replaceTheData');
            assert.equal(dataInstance3.value, "completely replaced the data");
        });

        it('get latest instance', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var dataInstance2 = dataInstance1.writeNewInstance(["new instance"]);
            var dataInstance3 = dataInstance2.writeNewInstance(["even newer instance"]);
            var latestInstanceFromDataInstance1 = dataInstance1.getLatestInstance();
            var latestInstanceFromDataInstance2 = dataInstance2.getLatestInstance();

            assert.equal(dataInstance3, latestInstanceFromDataInstance1);
            assert.notEqual(dataInstance3, dataInstance1);
            assert.equal(dataInstance3, latestInstanceFromDataInstance1);
            assert.notEqual(dataInstance3, dataInstance2);
        });
    });

    describe("when callback of writeNewInstanceWithTransformation returns a function", function () {
        it('if writeNewInstanceWithTransformation returns a function when callback\n            returns a function', function () {
            var getNewInstance = (0, _dist2.default)(data).writeNewInstanceWithTransformation(function (data) {
                return function () {
                    return data;
                };
            });

            assert.isFunction(getNewInstance);
        });

        it('can pass values to callback function of writeNewInstanceWithTransformation', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var dataInstance2 = dataInstance1.writeNewInstanceWithTransformation(function (data, a, b, c) {
                data[1].b.c = a + b + c;
                return data;
            }, 1, 2, 3);

            assert.equal(6, dataInstance2.value[1].b.c);
        });

        it('can initialize instancify with custom setters', function () {
            var config = {
                customSetters: {
                    changePropertyAOfFirstElement: function changePropertyAOfFirstElement(data, val) {
                        data[0].a = val;
                        return data;
                    }
                }
            };
            var dataInstance1 = (0, _dist2.default)(data, config);
            var dataInstance2 = dataInstance1.changePropertyAOfFirstElement(5);
            var dataInstance3 = dataInstance2.changePropertyAOfFirstElement(6);

            assert.equal(5, dataInstance2.value[0].a);
            assert.equal(6, dataInstance3.value[0].a);
        });

        it('can keep passing arguements to return of writeNewInstanceWithTransformation\n            until it returns a new instance', function () {
            var dataInstance1 = (0, _dist2.default)(data);
            var needMoreData = dataInstance1.writeNewInstanceWithTransformation(function (data) {
                return function (moreData) {
                    return function (evenMoreData) {
                        return function (lastPieceOfData) {
                            data[1].b.c = {
                                moreData: moreData,
                                evenMoreData: evenMoreData,
                                lastPieceOfData: lastPieceOfData
                            };
                            return data;
                        };
                    };
                };
            });
            var needEvenMoreData = needMoreData("adding more data");
            var needFinalPieceOfData = needEvenMoreData("adding even more data!");
            var dataInstance2 = needFinalPieceOfData("adding last piece of data!");

            assert.equal(dataInstance2.value[1].b.c.moreData, "adding more data");
            assert.equal(dataInstance2.value[1].b.c.evenMoreData, "adding even more data!");
            assert.equal(dataInstance2.value[1].b.c.lastPieceOfData, "adding last piece of data!");
            assert.property(dataInstance2, 'writeNewInstance');
            assert.property(dataInstance2, 'writeNewInstanceWithTransformation');
            assert.property(dataInstance2, 'writeNewInstanceWithPath');
            assert.equal(2, dataInstance2.instanceNumber);
        });
    });
});

describe('Utils', function () {
    describe('isFunction', function () {
        return describe('should return true only if it recieves a function.\n        Otherwise should return false', function () {
            it('Should return -> true', function () {
                return assert.equal(true, (0, _utils.isFunction)(function () {
                    return "I'm a function";
                }));
            });

            it('Should return -> false', function () {
                return assert.equal(false, (0, _utils.isFunction)("I'm not a function"));
            });
        });
    });

    describe('onlyIfFunction', function () {
        return describe('Given that the second argument passed to onlyIfFunction is\n            a function, that function will be executed on if the first argument\n            passed to onlyIfFunction is also a function. Otherwise it should return\n            the first arguement passed to it', function () {
            it('Should return -> onlyIfFunction was executed', function () {
                return assert.equal("onlyIfFunction was executed", (0, _utils.onlyIfFunction)(function () {
                    return "I'm a function";
                }, function () {
                    return "onlyIfFunction was executed";
                }));
            });

            it('Should return first arguement passed to it -> I\'m not a function', function () {
                return assert.equal("I'm not a function", (0, _utils.onlyIfFunction)("I'm not a function", function () {
                    return "onlyIfFunction was executed";
                }));
            });
        });
    });

    describe('setDataToObjectAtPath', function () {
        return describe('Give setDataToObjectAtPath and object and data to set to object as\n            first to arguements respectively. Then recieve a function back that accepts\n            a path that will set the data to the object', function () {
            it('Should set object at path for both path in array and string format', function () {
                var obj = {
                    a: 1,
                    b: 2,
                    c: {
                        d: null
                    }
                };

                (0, _utils.setDataToObjectAtPath)(obj, 4)("c.d");
                assert.equal(4, obj.c.d);
                (0, _utils.setDataToObjectAtPath)(obj, 5)(["c", "d"]);
                assert.equal(5, obj.c.d);
            });

            it('Should set array at path for both path in array and string format', function () {
                var arr = [1, 2, {
                    a: 1
                }];

                (0, _utils.setDataToObjectAtPath)(arr, 4)("[2].a");
                assert.equal(4, arr[2].a);
                (0, _utils.setDataToObjectAtPath)(arr, 5)([2, "a"]);
                assert.equal(5, arr[2].a);
            });

            it('After being set to another value original value should be at the path', function () {
                var arr = [1, 2, 3];

                (0, _utils.setDataToObjectAtPath)(arr, 4)("[2]");
                assert.notEqual(3, arr[2]);
            });
        });
    });

    describe('deepFreeze', function () {
        return describe("After passing an object to deepFreeze the returned object should be immutable", function () {
            it('Should throw an error when trying to set property of object returned from deepFreeze', function () {
                var immutableObj = (0, _utils.deepFreeze)({
                    a: 1,
                    b: {
                        c: 2
                    }
                });
                var tryToSetA = function tryToSetA() {
                    immutableObj.a = 2;
                };
                var tryToSetC = function tryToSetC() {
                    immutableObj.b.c = 3;
                };

                assert.throws(tryToSetA, "Cannot assign to read only property \'a\' of object \'#<Object>\'");
                assert.throws(tryToSetC, "Cannot assign to read only property \'c\' of object \'#<Object>\'");
            });

            it('If deepfreeze is set to false does not freeze', function () {
                var mutableObj = (0, _utils.deepFreeze)({
                    a: 1,
                    b: {
                        c: 2
                    }
                }, false);
                var setA = function setA() {
                    mutableObj.a = 2;
                };
                var setC = function setC() {
                    mutableObj.b.c = 3;
                };

                setA();
                assert.equal(2, mutableObj.a);
                setC();
                assert.equal(3, mutableObj.b.c);
            });

            it('Should also work with arrays', function () {
                var arr = [[0], [1]];
                var immutableArr = (0, _utils.deepFreeze)(arr, true);
                var tryToFirstInnerArray = function tryToFirstInnerArray() {
                    immutableArr[0][0] = 2;
                };

                assert.throws(tryToFirstInnerArray, "Cannot assign to read only property \'0\' of object \'[object Array]\'");
            });
        });
    });

    describe('convertPathStringToPathArray', function () {
        return describe("Should take a path string and return a path array", function () {
            it('Should return equivalent path array', function () {
                assert.deepEqual(["a", "b", "0", "c"], (0, _utils.convertPathStringToPathArray)("a.b.[0].c"));
            });

            it('Should return equivalent path array', function () {
                assert.deepEqual(["0", "1", "a", "b"], (0, _utils.convertPathStringToPathArray)("0.1.a.b"));
            });
        });
    });
});