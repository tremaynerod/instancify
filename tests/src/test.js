"use strict";

import chai from 'chai';
import instancify from '../../dist';
import {
    convertPathStringToPathArray,
    deepFreeze,
    isFunction,
    onlyIfFunction,
    setDataToObjectAtPath
} from '../../dist/utils';

const assert = chai.assert;

describe('instancify', () => {
    const data = [{
        a: 1
    }, {
        b: {
            c: 2
        }
    }];
    const data2 = {
        a: [1, 2, 3],
        b: {
            c: [4]
        }
    };
    const identityTransform = data => data;

    describe("instancifying", () => {
        it('primitive values before and after instancifying should be equal', () => {
            const dataInstance1 = instancify(data);
            const data2Instance1 = instancify(data2);

            assert.equal(data[0].a, dataInstance1.value[0].a);
            assert.equal(data[1].b.c, dataInstance1.value[1].b.c);
            assert.equal(data2.a[2], data2Instance1.value.a[2]);
            assert.equal(data2.b.c[0], data2Instance1.value.b.c[0]);
        });

        it('after instancifying should have instancify properties', () => {
            const dataInstance1 = instancify(data);
            const data2Instance1 = instancify(data2);

            assert.property(dataInstance1, 'writeNewInstance');
            assert.property(dataInstance1, 'writeNewInstanceWithTransformation');
            assert.property(dataInstance1, 'writeNewInstanceWithPath');
            assert.property(dataInstance1, 'instanceNumber');
            assert.property(data2Instance1, 'writeNewInstance');
            assert.property(data2Instance1, 'writeNewInstanceWithTransformation');
            assert.property(data2Instance1, 'writeNewInstanceWithPath');
            assert.property(data2Instance1, 'instanceNumber');
        });

        it('data returned after instancifying is immutable', () => {
            const dataInstance1 = instancify(data);
            const data2Instance1 = instancify(data2);
            const tryToExtendDataInstance1 = () => { dataInstance1.value.a = 0; };
            const tryToSetDataInstance1 = () => { dataInstance1.value[0].a = 0; };
            const tryToSetData2Instance1 = () => { data2Instance1.value.a[2] = 0; };

            assert.throws(tryToExtendDataInstance1, "Can\'t add property a, object is not extensible");
            assert.throws(tryToSetDataInstance1, "Cannot assign to read only property \'a\' of object \'#<Object>\'");
            assert.throws(tryToSetData2Instance1, "Cannot assign to read only property \'2\' of object \'[object Array]\'");
        });
    });

    describe("instances", () => {
        it('calling a write method on an instance returns new referneces', () => {
            const dataInstance1 = instancify(data).writeNewInstanceWithTransformation(identityTransform);
            const data2Instance1 = instancify(data2).writeNewInstanceWithTransformation(identityTransform);

            assert.notEqual(data[0], dataInstance1.value[0]);
            assert.notEqual(data[1].b, dataInstance1.value[1].b);
            assert.notEqual(data2.a, data2Instance1.value.a);
            assert.notEqual(data2.b.c, data2Instance1.value.b.c);
        });

        it('each new instance increments instanceNumber property', () => {
            const dataInstance1 = instancify(data);
            const dataInstance2 = dataInstance1.writeNewInstanceWithTransformation(identityTransform);
            const dataInstance3 = dataInstance2.writeNewInstanceWithTransformation(identityTransform);

            assert.equal(1, dataInstance1.instanceNumber);
            assert.equal(2, dataInstance2.instanceNumber);
            assert.equal(3, dataInstance3.instanceNumber);
        });

        it(`each instance can only be written once`, () => {
            const dataInstance1 = instancify(data);
            const dataInstance2 = dataInstance1.writeNewInstanceWithTransformation(identityTransform);
            const dataInstance3 = dataInstance2.writeNewInstanceWithTransformation(identityTransform);
            const dataInstance4 = dataInstance1.writeNewInstance(1);
            const dataInstance5 = dataInstance2.writeNewInstance(1);
            const dataInstance6 = dataInstance3.writeNewInstance(1);

            assert.notEqual(1, dataInstance4.value);
            assert.notEqual(1, dataInstance5.value);
            assert.equal(1, dataInstance6.value);
        });
    });

    describe("method testing", () => {
        it('writeNewInstance', () => {
            const dataInstance1 = instancify(data);
            const dataInstance2 = dataInstance1.writeNewInstance(["completely new data"]);
            const dataInstance3 = dataInstance2.writeNewInstance({
                data: "more new data"
            });

            assert.equal(dataInstance2.value[0], "completely new data");
            assert.notEqual(dataInstance3.value[0], "completely new data");
            assert.equal(dataInstance3.value.data, "more new data");
        });

        it('writeNewInstanceWithTransformation', () => {
            const dataInstance1 = instancify(data);
            const dataInstance2 = dataInstance1.writeNewInstanceWithTransformation((data) => {
                data[1].b.c = [1, 2, 3, 4, 5];
                return data;
            });

            assert.deepEqual(dataInstance2.value[1].b.c, [1, 2, 3, 4, 5]);
            assert.notDeepEqual(dataInstance1.value[1].b.c, [1, 2, 3, 4, 5]);
        });

        it('writeNewInstanceWithPath', () => {
            const dataInstance1 = instancify(data);
            const dataInstance2 = dataInstance1.writeNewInstanceWithPath("[1].b.c", [1, 2, 3]);
            const data2Instance1 = instancify(data2);
            const data2Instance2 = data2Instance1.writeNewInstanceWithPath(["b", "c", 0], "new value");

            assert.deepEqual(dataInstance2.value[1].b.c, [1, 2, 3]);
            assert.notDeepEqual(dataInstance1.value[1].b.c, [1, 2, 3]);
            assert.equal(data2Instance2.value.b.c[0], "new value");
            assert.notEqual(data2Instance1.value.b.c[0], "new value");
        });

        it('can lift custom methods for future instances', () => {
            const dataInstance1 = instancify(data);
            const dataInstance2 = dataInstance1.lift({
                customSetters: {
                    replaceTheData: (data) => "completely replaced the data"
                }
            });
            const dataInstance3 = dataInstance2.replaceTheData();

            assert.notProperty(dataInstance1, 'replaceTheData');
            assert.property(dataInstance2, 'replaceTheData');
            assert.equal(dataInstance3.value, "completely replaced the data");
        });
    });

    describe("when callback of writeNewInstanceWithTransformation returns a function", () => {
        it(`if writeNewInstanceWithTransformation returns a function when callback
            returns a function`, () => {
                const getNewInstance = instancify(data).writeNewInstanceWithTransformation((data) => () => data);

                assert.isFunction(getNewInstance);
        });

        it('can pass values to callback function of writeNewInstanceWithTransformation', () => {
            const dataInstance1 = instancify(data);
            const dataInstance2 = dataInstance1.writeNewInstanceWithTransformation((data, a, b, c) => {
                data[1].b.c = a + b + c;
                return data;
            }, 1, 2, 3);

            assert.equal(6, dataInstance2.value[1].b.c);
        });

        it('can initialize instancify with custom setters', () => {
            const config = {
                customSetters: {
                    changePropertyAOfFirstElement: (data, val) => {
                        data[0].a = val;
                        return data;
                    }
                }
            };
            const dataInstance1 = instancify(data, config);
            const dataInstance2 = dataInstance1.changePropertyAOfFirstElement(5);
            const dataInstance3 = dataInstance2.changePropertyAOfFirstElement(6);

            assert.equal(5, dataInstance2.value[0].a);
            assert.equal(6, dataInstance3.value[0].a);
        });

        it(`can keep passing arguements to return of writeNewInstanceWithTransformation
            until it returns a new instance`, () => {
            const dataInstance1 = instancify(data);
            const needMoreData = dataInstance1.writeNewInstanceWithTransformation((data) => (moreData) => (evenMoreData) => (lastPieceOfData) => {
                data[1].b.c = {
                    moreData,
                    evenMoreData,
                    lastPieceOfData
                }
                return data;
            });
            const needEvenMoreData = needMoreData("adding more data");
            const needFinalPieceOfData = needEvenMoreData("adding even more data!");
            const dataInstance2 = needFinalPieceOfData("adding last piece of data!");

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

describe('Utils', () => {
    describe('isFunction', () =>
        describe(`should return true only if it recieves a function.
        Otherwise should return false`, () => {
            it('Should return -> true', () =>
                assert.equal(true, isFunction(() => "I'm a function"))
            );

            it('Should return -> false', () =>
                assert.equal(false, isFunction("I'm not a function"))
            );
        })
    );

    describe('onlyIfFunction', () =>
        describe(`Given that the second argument passed to onlyIfFunction is
            a function, that function will be executed on if the first argument
            passed to onlyIfFunction is also a function. Otherwise it should return
            the first arguement passed to it`, () => {
            it('Should return -> onlyIfFunction was executed', () =>
                assert.equal("onlyIfFunction was executed", onlyIfFunction(() => "I'm a function", () => "onlyIfFunction was executed"))
            );

            it('Should return first arguement passed to it -> I\'m not a function', () =>
                assert.equal("I'm not a function", onlyIfFunction("I'm not a function", () => "onlyIfFunction was executed"))
            );
        })
    );

    describe('setDataToObjectAtPath', () =>
        describe(`Give setDataToObjectAtPath and object and data to set to object as
            first to arguements respectively. Then recieve a function back that accepts
            a path that will set the data to the object`, () => {
            it('Should set object at path for both path in array and string format', () => {
                    const obj = {
                        a: 1,
                        b: 2,
                        c: {
                            d: null
                        }
                    };

                    setDataToObjectAtPath(obj, 4)("c.d");
                    assert.equal(4, obj.c.d);
                    setDataToObjectAtPath(obj, 5)(["c", "d"]);
                    assert.equal(5, obj.c.d);
            });

            it('Should set array at path for both path in array and string format', () => {
                    const arr = [1, 2, {
                        a: 1
                    }];

                    setDataToObjectAtPath(arr, 4)("[2].a");
                    assert.equal(4, arr[2].a);
                    setDataToObjectAtPath(arr, 5)([2, "a"]);
                    assert.equal(5, arr[2].a);
            });

            it('After being set to another value original value should be at the path', () => {
                    const arr = [1, 2, 3];

                    setDataToObjectAtPath(arr, 4)("[2]");
                    assert.notEqual(3, arr[2]);
            });
        })
    );

    describe('deepFreeze', () =>
        describe("After passing an object to deepFreeze the returned object should be immutable", () => {
            it('Should throw an error when trying to set property of object returned from deepFreeze', () => {
                const immutableObj = deepFreeze({
                    a: 1,
                    b: {
                        c: 2
                    }
                });
                const tryToSetA = () => { immutableObj.a = 2; };
                const tryToSetC = () => { immutableObj.b.c = 3; };

                assert.throws(tryToSetA, "Cannot assign to read only property \'a\' of object \'#<Object>\'");
                assert.throws(tryToSetC, "Cannot assign to read only property \'c\' of object \'#<Object>\'");
            });

            it('If deepfreeze is set to false does not freeze', () => {
                const mutableObj = deepFreeze({
                    a: 1,
                    b: {
                        c: 2
                    }
                }, false);
                const setA = () => { mutableObj.a = 2; };
                const setC = () => { mutableObj.b.c = 3; };

                setA();
                assert.equal(2, mutableObj.a);
                setC();
                assert.equal(3, mutableObj.b.c);
            });

            it('Should also work with arrays', () => {
                const arr = [[0], [1]];
                const immutableArr = deepFreeze(arr, true);
                const tryToFirstInnerArray = () => { immutableArr[0][0] = 2; };

                assert.throws(tryToFirstInnerArray, "Cannot assign to read only property \'0\' of object \'[object Array]\'");
            });
        })
    );

    describe('convertPathStringToPathArray', () =>
        describe("Should take a path string and return a path array", () => {
            it('Should return equivalent path array', () => {
                assert.deepEqual(["a", "b", "0", "c"], convertPathStringToPathArray("a.b.[0].c"))
            });

            it('Should return equivalent path array', () => {
                assert.deepEqual(["0", "1", "a", "b"], convertPathStringToPathArray("0.1.a.b"))
            });
        })
    );
});
