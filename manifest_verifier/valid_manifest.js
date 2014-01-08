function isSemantic(str) {
  if (typeof(str) === "number" && !isNaN(Number(str))) {
    if (Number(str) >= 0) {
      return true; //Must be something like 4.333333, which is valid, if bad.
    }
    return false; //-4.3333, on the other hand, is wrong.
  }
  
  if (typeof(str) !== "string") {
    process.stdout.write("#ERROR '" + str + "' is not a string instance and cannot be parsed into a semantic version.\n");
    return false;
  }
  
  var triple = str.split('.');
  if (triple.length > 3) {
    process.stdout.write("#ERROR '" + str + "' has more than two .'s and can't be a semantic version.\n");
    return false;
  }

  
  if ((triple[1] && isNaN(Number(triple[1]))) || (triple[2] && isNaN(Number(triple[2])))) {
    process.stdout.write("#ERROR components of version string '" + str + "' were not numeric.\n");
    return false;
  } 
  
  if ( (triple[1] && triple[1].trim() === "") || (triple[2] && triple[2].trim() === "")) {
    process.stdout.write("#ERROR components of version string '" + str + "' did not exist.\n");
    return false;
  }
  
  triple[0] = triple[0].trim();
  var prefixes = ["~", "<=", "<", "="];
  for (k in prefixes) {
    if (triple[0].indexOf(prefixes[k]) === 0) {
      //this prefix is present
      triple[0] = triple[0].substring(prefixes[k].length);
      break;
    }
  }
  
  if (triple[0].trim() === "") {
    process.stdout.write("#ERROR first component of version string '" + str + "' did not exist.\n");
    return false;
  }
  
  if (triple[0] && isNaN(Number(triple[0]))) {
    process.stdout.write("#ERROR first component of version string '" + str + "' was not numeric.\n");
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
  "type": true,
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
