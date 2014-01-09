function isSemantic(str) {
  //Example valid formats:
  //  12
  //  >12
  //  12.0.1
  //  <=12.4
  var versionReg = /^([><]=?)?\d+(\.\d+){0,2}$/;
  if (!versionReg.test(str)) {
    process.stdout.write("#ERROR Version string is not formatted correctly: '" + str + "'\n");
    return false;
  }

  return true;
}

var template = {
  "version" : function(val) { //rule
    return isSemantic(val);
  },
  "name": true, //required
  "displayname":false, //optional
  "capabilities": function(val) {
    for (k in val) {
      if (!isSemantic(val[k])) {
        return false;
      }
    }
    return true;
  }
  "API": function(val) {
    return (!isNaN(Math.floor(val)) && val==Math.floor(val)); //is an integer, yes I want == type coercion here.
  },
  "description": false,
  "dependencies": function(val) {
    for (k in val) {
      if (!isSemantic(val[k])) {
        return false;
      }
    }
    return true;
  }
}

function isFunction(functionToCheck) {
  var getType = {};
  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function verifyManifestJSON(inp) {

  var errors = [];

  function verifyJSON(obj, rules) {
    for (k in rules) {
      if (isFunction(rules[k])) {
        if (!rules[k](obj[k])) {
          //failed rules check
          errors.push("not ok "+errors.length+" Failed rule '"+k+"'.")
        }
        //otherwise pass, do nothing
      } else {
        if (k in obj) {
          if (rules[k] instanceof Object) { //see if we need to recur
            //recur
            verifyJSON(obj[k], rules[k]);
          }
        } else { //missing a key we expected
          if (rules[k] !== false) { //was it optional?
            //required key missing
            errors.push("not ok " + errors.length + " Required key '" + k + "' missing.")
          } else { //it was optional - TODO: write a WARNING comment instead of ok?
            errors.push("ok " + errors.length + " Recommended key '" + k + "' missing.")
          }
        }
      }
    }
  }

  verifyJSON(inp, template);
  return errors;
}

module.exports = verifyManifestJSON;
