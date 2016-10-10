# Instancify

Simple CoW (copy on write) strategy for javascript data structures.

## Getting Started
npm install instancify
```javascript
const instancify = require("instancify").default;
const instance1 = instancify([1,2,3]);
```

## Guarantees
- All data accessible from instancify is read only

- No external references to the instancify internal data so must use instancify methods to access data

- Every write returns a brand new instance with brand new references

- Can only set an instance once so instance always follow a linear path

### Uses
Basic use
```javascript
const instance1 = instancify([1,2,3]);
const instance2 = instance1.writeNewInstanceWithTransformation(data => data.map(val => val + 1));
//instance1 and instance2 share no refernces with each other
```
Works with 3rd party libraries like ramda and lodash
```javascript
const instance1 = instancify([1,2,3]);
const instance2 = instance1.writeNewInstanceWithTransformation(data => R.pipe(R.map(val => val + 1))(data));
//instance2 => [2,3,4]
```
Read only values
```javascript
const instance1 = instancify([1,2,3]);
instance1[0] = 2;
//throws an error
```
Can only set an instance once
```javascript
const instance1 = instancify([1,2,3]);
const instance2a = instance1.writeNewInstanceWithTransformation(data => data.map(val => val + 1));
const instance2b = instance1.writeNewInstanceWithTransformation(data => data.map(val => val + 2));
//returns instance1 and also calls user defined callback function or logs a warning    
```
Can add methods to instancify
```javascript
const instance1 = instancify([1,2,3], {
    customSetters: {
        someTransformation: .....
    }
});
const instance2 = instance1.someTransformation();
```
Lazy
```javascript
const instance1 = instancify([1,2,3]);
const addToEachElement = instance1.writeNewInstanceWithTransformation(data => num => data.map(val => val + num);
const instance2 = addToEachElement(5);
```

Can be used as an interface for third party persistent data libraries
```javascript
const Immutable = require('immutable');
const map = Immutable.Map({num:10});
const instance1 = instancify(map, {
    shouldClone: false,
    shouldFreeze: false,
    customSetters: {
        changeNum: (data, val) => data.set('num', val)
    },
    customGetters: {
        getNum: (data) => data.get('num')
    }
});
const num1 = instance1.getNum();//10
const instance2 = instance1.changeNum(20);
const num2 = instance2.getNum();//20
```

### API

`instancify(data, options)`

##### Methods

- writeNewInstance
```javascript
"Sets new instance"
const instance1 = instancify([1,2,3]).writeNewInstance([4,5,6]);
//[4,5,6]
```
- writeNewInstanceWithPath
```javascript
"Sets a property of the new instance"
const instance1 = instancify([{a:1},{b:2}]).writeNewInstanceWithPath([0, "a"], 2);
//[{a:2},{b:2}]
const instance2 = instance1.writeNewInstanceWithPath("[0].a"], 3);
//[{a:3},{b:2}]
```
- writeNewInstanceWithTransformation
```javascript
"Sets the new instance with a transformation"
const instance1 = instancify([{a:1},{b:2}]).writeNewInstanceWithTransformation(function(data) {
    data[0].a = 3;
    data[1].b = 4;
    return data;
});
//[{a:3},{b:4}]
```

##### Options

- customClone
```javascript
"Replace the clone implementation instancify is using with another"
const instance1 = instancify(data, {
    customClone: //whatever clone implementation you'd like instancify to use
});
```
- shouldClone
```javascript
"Turn cloning on or off"
const instance1 = instancify(data, {
    shouldClone: true//defaults to true
});
```
- shouldFreeze
```javascript
"Turn freezing on or off"
const instance1 = instancify(data, {
    shouldFreeze: true//defaults to true
});
```
- customSetters
```javascript
"Add you own setter methods onto instancify"
const instance1 = instancify(data, {
    customSetters: {
        myOwnMethod: function(data, prop, val) {
            data[prop] = val;
            return data;
        }
    }
});
```
- customGetters
```javascript
"Add you own getter methods onto instancify"
const instance1 = instancify(data, {
    customGetters: {
        getSomething: function(data, prop) {
            return data[prop];
        }
    }
});
```
- errorFunction
```javascript
"Add you own error function for when setter get called on an instance more than once"
const instance1 = instancify(data, {
    errorFunction: function(instance) {
        alert("tried to set this instance twice", instance)
    }
});
```
- lift
```javascript
"Add you own setter methods onto instancify after initializing instancify"
const instance1 = instancify(data);
const instance2 = instance1.lift({
    customSetters: {
        myOwnMethod: function(data, prop, val) {
            data[prop] = val;
            return data;
        }
    },
    customGetters: {
        getSomething: function(data, prop) {
            return data[prop];
        }
    }
});
```

### Tests
To run test in root directory use command
`npm run test`


### LICENSE
[LICENSE][18d35b37]

  [18d35b37]: https://github.com/tremaynerod/instancify/blob/master/LICENSE "LICENSE"
