## How to Read Signatures

Rather than providing concrete classes like other frameworks, Mithril provides methods that operate on plain old Javascript objects (POJOs) that match given signatures.

A signature is a description of its static type. For functions, it shows the parameters of the function, its return value and their expected types. For objects and arrays, it shows the expected data structure and the expected types of their members.

Method signatures in this documentation follow a syntax similar to Java syntax, with some extra additions:

```clike
ReturnType methodName(ParameterType1 param1, ParameterType2 param2)
```

### Optional Parameters

Square brackets denote optional parameters. In the example below, `param2` and `param3` can both be omitted, but passing a value to `param2` is required if also passing a value to `param3`:

```clike
String test(String arg1 [, String arg2 [, String arg3]])
```

```javascript
//examples of valid function calls
test("first");
test("first", "second");
test("first", "second", "third");
```

### Type Placeholders

The word `void` is used as a type when a function does not return a value (i.e. undefined):

```clike
void test()
```

```javascript
console.log(test()); // undefined
```

The word `any` is used as a type if there are no type restrictions on a parameter:

```clike
void test(any value)
```

```javascript
//examples of valid function calls
test("hello");
test(1);
test(["hello", "world"]);
```

### Arrays

Arrays use Generics syntax to denote the expected type of array members:

```clike
void test(Array<String> values)
```

```javascript
//example of a valid function call
test(["first", "second"]);
```

### Objects as Key-Value Maps

Objects also use Generics syntax when they are meant to be used as a key-value map. Keys are always strings and, in key-value maps, can have any name.

```clike
void test(Object<Number> values)
```

```javascript
//example of a valid function call
test({first: 1, second: 2});
```

### Objects as Class Interfaces

Objects that require specific keys are denoted using curly brace syntax:

```clike
void test(Object {String first, Number second} value)
```

```javascript
//example of a valid function call
test({first: "first", second: 2});
```

### Type Aliasing

Some types are aliases of more complex types. For example, in the example below, we created an alias called `ComplexType` for the type from the previous example

```clike
void test(ComplexType value)

where:
	ComplexType :: Object {String first, Number second}
	
//example of a valid function call
test({first: "first", second: 2})
```

### Mixin Types

Curly brace syntax can also appear on other base types to denote that the value contains static members. For example, in the example below, a value of type `ComplexType` is a string, but it also has a boolean property called `flag`:

```clike
ComplexType :: String { Boolean flag }
```

```javascript
//an example
var a = aComplexTypeValue
typeof a == "string" // true
"flag" in a // true
a.flag = true
```

In the following example, a value of type `ComplexType` is a function, with a property called `label`

```clike
ComplexType :: void test() { String label }
```

```javascript
//an example
var a = aComplexTypeValue
typeof a == "function" // true
"label" in a // true
a.label = "first"
```

### Polymorphic Types

When multiple (but not all) types are accepted, the pipe `|` is used to delimit the list of valid types

```clike
void test(Children children, Value value)

where:
	Children :: Array<String text | Number number>
	Value :: String | Number
```

```javascript
//examples of valid function calls
test(["test", 2], "second")
test([1, 2, 3], "second")
test([1, "test", 3], 2)
```

Pipe syntax within Object curly brace syntax means that, for a specific key, name has specific type requirements.

In the example below, the `value` parameter should be a key-value map. This map may contain a key called `config`, whose value should be a function.

```clike
void test(Object { any | void config(DOMElement) } value)
```

```javascript
//example of a valid function call
test({ first: "first", config: function(element) { /*do stuff*/ } })
```
