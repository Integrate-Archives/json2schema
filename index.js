'use strict';

var fs = require('fs');
var path = require('path');

var Converter = module.exports = {};

var JSONObject = {};
var requestOptions = {};
var schemaOutput = {};

Converter.convert = function(options, callback) {
  requestOptions = options;

  if (requestOptions.url) {
    var filepath = path.resolve(requestOptions.url);  
    //Get access to JSON object from file user passed in.
    fs.readFile(filepath, 'utf8', function(err, data) {
      if (err) {
        throw err;
      }
      JSONObject = JSON.parse(data);
      schemaOutput = entry(JSONObject);
      fs.writeFile(requestOptions.outPut, JSON.stringify(schemaOutput), 'utf8', function() {
        //successfull file write. Implement callback here.
      });
      
    });
  } else if (requestOptions.data) {
    return entry(requestOptions.data);
  } else {
    throw Error('Must include file or data to convert.');
  }
}

/**
 * Entry point for visitor pattern.
 * 
 * @param {object} JSON object you are generating schema for.
 * @return {object} Schema object that was generated.
 */
function entry(obj) {

  var scope = {};

  visitorObject(scope, obj);

  scope['$schema'] = 'http://json-schema.org/draft-04/schema#';

  return scope;
}

/**
 * Router function to determine which 'type' schema is needed for.
 * 
 * @param {object} scope Localized object that schema is being inserted into.
 * @param {any} item Item that schema is being generated for.
 */
function visit(scope, item) {
  switch(typeof item) {
    case 'string':
      visitorString(scope, item);
      break;
    case 'number':
      visitorNumber(scope, item);
      break;
    case 'boolean':
      visitorBoolean(scope, item);
      break;
    case 'object':
      if (item === null) {
        visitorNull(scope);          
      } else if (item.constructor === Object) {
        visitorObject(scope, item);
      } else if (item.constructor === Array) {
        visitorArray(scope, item);
      }
      break;
  }
}

/**
 * Schema generator for Objects
 * 
 * @param {object} scope Localized object that schema is being inserted into.
 * @param {object} obj Object the schema is being generated for.
 */
function visitorObject(scope, obj) {

  scope.type = 'object';
  scope.properties = {};
  scope.required = Object.keys(obj);

  for (var prop in obj) {
    scope.properties[prop] = {};
    visit(scope.properties[prop], obj[prop]);
  }

}

/**
 * Schema generator for Arrays
 * 
 * @param {object} scope Localized object that schema is being inserted into.
 * @param {array} arr Array the schema is being generated for.
 */
function visitorArray(scope, arr) {
   
    var psuedoScope = [];
    for (var i = 0; i < arr.length; i++) {
      psuedoScope[i] = {};
      visit(psuedoScope[i], arr[i]);
    }
    var mergedScope = {};
    mergedScope = mergeObjects(psuedoScope);

    scope.type = 'array';
    scope.items = mergedScope;
}

/**
 * Schema generator for Strings
 * 
 * @param {object} scope Localized object that schema is being inserted into.
 * @param {string} value String the schema is being generated for.
 */
function visitorString(scope, value) {
  scope.type = 'string',
  scope.example = value;
}

/**
 * Schema generator for Booleans
 * 
 * @param {object} scope Localized object that schema is being inserted into.
 * @param {boolean} value Boolean the schema is being generated for.
 */
function visitorBoolean(scope, value) {
  scope.type = 'boolean';
}

/**
 * Schema generator for Null
 * 
 * @param {object} scope Localized object that schema is being inserted into.
 */
function visitorNull(scope) {
  scope.type = 'null';
}

/**
 * Schema generator for Numbers
 * 
 * @param {object} scope Localized object that schema is being inserted into.
 * @param {number} value Number the schema is being generated for.
 */
function visitorNumber(scope, value) {
  scope.type = 'number',
  scope.example = value;
}

/**
 * When multiple objects can be the value of a property, we need a schema that encompasses them all.
 * 
 * @param {array} items Array of objects that a single schema is being generated for.
 * @return {object} The schema representing all objects that were passed in.
 */
function mergeObjects(items) {
  debugger;
  var singlePropertyObject = {};
  var itemTypes = [];
  var itemItems = {};
  var itemProperties = {};
  var itemRequired = [];
  
  for (var item in items) {
      
    //Aggregate item types
    if (typeof items[item].type === 'string') {
      items[item].type = [items[item].type];
    }
    itemTypes = arrayUnique(itemTypes.concat(items[item].type));
      
    //Aggregate item required
    if (items[item].required && items[item].required.length) {
      for (var i = 0; i < items[item].required.length; i++) {
        if (itemRequired.indexOf(items[item].required[i]) === -1) {
          itemRequired.push(items[item].required[i]);
        }
      }
    }

    //Aggregate item properties (RECURSION)
    for (var property in items[item].properties) {

      //Merging properties.
      if (itemProperties[property] === undefined) {
        itemProperties[property] = items[item].properties[property]
      } else {
        itemProperties[property] = mergeObjects([itemProperties[property], items[item].properties[property]]);
      }
    }

    //Aggregate item items (recursion)
    if (items[item].items && Object.keys(items[item].items).length > 0) {
      itemItems = mergeObjects([itemItems, items[item].items]);
    }
  }

  //Setting all keys in single property object.
  if (itemTypes.length > 0) {
    singlePropertyObject.type = itemTypes;
  }
  if (itemRequired.length > 0) {
    singlePropertyObject.required = itemRequired;
  }
  if (Object.keys(itemProperties).length > 0) {
    singlePropertyObject.properties = itemProperties;
  }

  if (Object.keys(itemItems).length > 0) {
    singlePropertyObject.items = itemItems;
  }

  return singlePropertyObject
}

/**
 * Helper function to de-dupe arrays of strings.
 * 
 * @param {array} array Array that is being de-duped.
 * @return {array} De-duped array.
 */
function arrayUnique(array) {
    var a = array.concat();
    for (var i=0; i <a.length; ++i) {
        for (var j=i+1; j <a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
}