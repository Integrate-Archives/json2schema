# json-schema-generator
Generate JSON Schema from JSON Objects.

## Installation

```bash
$ npm install -g json2schema
```

## Usage

*CLI Tool*

```bash
$ json2schema -h

  Usage: json2schema [options] <URL|filename>

  Convert JSON Objects to JSON Schema.

  Options:

    -h, --help       output usage information
    -V, --version    output the version number
    -o, --out <out>  Specify the path and filename you want to output your schema document to. Defaults to "./schema.json"
```

*In your JavaScript*

```js
var Coverter = require('json2schema');

var generatedSchema = Converter.convert({
	data: <JSONObject>
});

```

### Example

```bash
$ json2schema ./jsondocs/myObject.json --out ../../schema.json
```

## Contributing

Contributions are welcomed and encouraged. See CONTRIBUTING.md for instructions.