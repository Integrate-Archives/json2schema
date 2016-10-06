'use strict';

var fs = require('fs');
var path = require('path');

var Converter = module.exports = {};

var JSONObject = {};
var requestOptions = {};
var schemaOutput = {};

Converter.convert = function(options, callback) {
  requestOptions = options;
  var filepath = path.resolve(requestOptions.url);  

  //Get access to JSON object from file user passed in.
  fs.readFile(filepath, 'utf8', function(err, data) {
    if (err) {
      throw err;
    }
    JSONObject = JSON.parse(data);
    schemaOutput = entry(JSONObject);
    fs.writeFile(requestOptions.outPut, JSON.stringify(schemaOutput), 'utf8', function() {
      //successfull file write.
    });
    
  });
}

/**
 * Covert JSON Object to JSON schema
 * 
 * @param {object} obj JSON object that you are generating schema from.
 * @param {boolean} initialLoop Specifiy whether you are at the top of the object or not.
 */
function buildSchemaObject(obj, initialLoop) {

  if (initialLoop) {

    //Setting root level schema data for request body.
    var topSchemaLevel = {
      '$schema': 'http://json-schema.org/draft-04/schema#'
    };
    if (obj.length) {
      topSchemaLevel.type = 'array',
      topSchemaLevel.items = tempObj
    } else {
      topSchemaLevel.type = 'object',
      topSchemaLevel.required = Object.keys(obj),
      topSchemaLevel.properties = tempObj
    }
  } else {
    topSchemaLevel = tempObj;
  }

  var tempObj = {};

  //Looping through keys of object to build properties object.
  for (var key in obj) {

    //Setting string type.
    if (typeof obj[key] === 'string') {
      tempObj[key] = {
        type: 'string',
        example: obj[key]
      }

    //Setting number type.
    } else if (typeof obj[key] === 'number') {
      tempObj[key] = {
        type: 'number'
      }

    //Setting null type.
    } else if (obj[key] === null) {
      tempObj[key] = {
        type: 'null'
      }

    //Setting array and object type.
    } else if (typeof obj[key] === 'object') {

      //Set schema for object.
      if (obj[key].length === undefined) {

        //If object call buildSchemaObject recursively.
        tempObj[key] = {
          type: 'object',
          properties: buildSchemaObject(obj[key]),
          required:  Object.keys(obj[key])
        }

      //Set schema for array.
      /**
       * Assumptions made:
       * If an array is an array of objects, each object in the array can have properties that are found in any of the objects.
       */
      } else {
        //If array contains objects build context object
        if (obj[key])
        tempObj[key] = {
          type: 'array',
          items: buildSchemaObject(obj[key])
        }
        if (tempObj[key].items) {
          tempObj[key].items = mergeItems(tempObj[key].items);
        }
      }
    }
  }
  return topSchemaLevel;
}

//Visitor pattern

function entry(obj) {

  var scope = {};

  visitorObject(scope, obj);

  scope['$schema'] = 'http://json-schema.org/draft-04/schema#';

  return scope;
}

function visit(scope, thing) {
  switch(typeof thing) {
    case 'string':
      visitorString(scope, thing);
      break;
    case 'number':
      visitorNumber(scope, thing);
      break;
    case 'boolean':
      visitorBoolean(scope, thing);
      break;
    case 'object':
      if (thing === null) {
        visitorNull(scope);          
      } else if (thing.constructor === Object) {
        visitorObject(scope, thing);
      } else if (thing.constructor === Array) {
        visitorArray(scope, thing);
      }
      break;
  }
}

function visitorObject(scope, obj) {

  scope.type = 'object';
  scope.properties = {};
  scope.required = Object.keys(obj);

  for (var prop in obj) {
    scope.properties[prop] = {};
    visit(scope.properties[prop], obj[prop]);
  }

}

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

function visitorString(scope, value) {
  scope.type = 'string',
  scope.example = value;
}

function visitorBoolean(scope, value) {
  scope.type = 'boolean';
}

function visitorNull(scope) {
  scope.type = 'null';
}

function visitorNumber(scope, value) {
  scope.type = 'number',
  scope.example = value;
}

function mergeObjects(items) {
  debugger;
  var singlePropertyObject = {};
  var itemTypes = [];
  var itemItems = {};
  var itemProperties = {};
  var itemRequired = [];
  
  for (var item in items) {
      
    //Aggregate item types
    if (itemTypes.indexOf(items[item].type) === -1) {
      itemTypes.push(items[item].type);
    }
      
    //Aggregate item required
    if (items[item].required && items[item].required.length) {
      for (var i = 0; i < items[item].required.length; i++) {
        if (itemRequired.indexOf(items[item].required[i]) === -1) {
          itemRequired.push(items[item].required[i]);
        }
      }
    }

    //Aggregate item properties (RECURSION)
    // for (var property in items[item].properties) {

    //   //Merging property types.
    //   if (itemProperties[property] && itemProperties[property].type.indexOf(items[item].properties[property].type) === -1) {
    //       itemProperties[property].type.push(items[item].properties[property].type)
    //   } else if (itemProperties[property] === undefined) {
    //       itemProperties[property] = {};
    //       itemProperties[property].type = [items[item].properties[property].type]
    //   }
    // }

    //Aggregate item items (recursion)
    if (item.items && item.items.length > 0) {

      for (var singleItem in item.items) {
        
      }
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
