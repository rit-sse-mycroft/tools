process.stdin.resume();
process.stdin.setEncoding('utf8');

var jsondata = "";
process.stdin.on('data', function(chunk) {
  jsondata += chunk;
});

function isSemanic(str) {
  if (!(str instanceof String)) {
    process.stdout.write("ERROR: '"+str+"' is not a string instance and cannot be parsed into a semantic version.");
    return false;
  }
  
  var triple = str.split('.');
  if (triple.length > 3) {
    process.stdout.write("ERROR: '"+str+"' has more than three .'s and can't be a semantic version.");
    return false;
  }
  
  if ((triple[1] && isNan(Number(triple[1]))) || (triple[2] && isNaN(Number(triple[2])))) {
    process.stdout.write("ERROR: components of version string '"+str+"' were not numeric.");
    return false;
  } 
  
  var prefixes = ["~", "<", "<=", "="];
  for (v in prefixes) {
    if (triple[0].indexOf(v) === 0) {
      //this prefix is present
      triple[0] = triple[0].trim(v);
      break;
    }
  }
  
  if (triple[0] && isNan(Number(triple[0]))) {
    process.stdout.write("ERROR: first component of version string '"+str+"' was not numeric.");
    return false;
  }
  
  return true;
}

var template = {
  "version" : function(val) { //rule
    return isSemantic(str);
  },
  "name": true, //required
  "displayname":false, //optional
  "type": true,
  "API": function(val) {
    return (val===floor(val)); //is an integer
  },
  "description": function(val) {
    //warn
    process.stdout.write("WARNING: No description field given.");
    return true;
  },
  "dependencies": function(val) {
    for (k in val) {
      if (!isSemantic(val[k])) {
        return false;
      }
    }
  }
}

process.stdin.on('end', function() {
  verifyManifestJSON(JSON.parse(jsondata, template));
});

function isFunction(functionToCheck) {
  var getType = {};
  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

var errors = {};

function verifyManifestJSON(obj, rules) {
  for (k in rules) {
    if (k in obj) {
      if isFunction(rules[k]) {
        if (!rules[k](obj[k])) {
          //failed rules check  
          errors.push("Failed rule '"+k+"'.")
        }
      } else {
        if (rules[k] instanceof Object) {
          //recur
          verifyManifestJSON(obj[k], rules[k]);
        }
      }
    } else {
      if (rules[k]!==false) {
        //required key missing
        error.push("Required key '"+k+"' missing.")
      }
    }
  }
}