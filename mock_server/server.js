var net = require('net');
var validateManifest = require('../manifest_verifier/valid_manifest');
var uuid = require('uuid');
var semver = require('semver');

var serv = net.createServer(function(cli) {
  console.log('Server connected');

  cli.on('end', function(){
    console.log('Server disconnected');
  });

  cli.on('data', function(msg){
  	msg = msg.toString();
    var type = msg.substr(0, msg.indexOf(' {'));
    var data;
    try {
      data = JSON.parse(msg.substr(msg.indexOf(' {') + 1));
    }
    catch(err){
      return cli.write("MSG_MALFORMED \n" + err);
    }
    handleMsg(type, data, cli);
  });

});

serv.listen(1847, function() {
  console.log("Mycroft mock server listening on port 1847");
});


function handleMsg(type, data, cli){
  if(type === 'APP_MANIFEST'){
    register(cli, data);
  }
}

// Lazy app state tracker :D
{ 'weather' :
  {
    'temp1' : {
      'socket' : cli,
      'manifest' : m
    }
  }
}
var apps = {};

function register(cli, manifest){
  var id;
  var instances;
  var validation = validateManifest(manifest);
  var isValidMan = validation.length === 0;
  if(!isValidMan){
    return cli.write("MANIFEST_FAIL " + JSON.stringify(validation)); //TODO: STANDARDIZE
  }

    // Have we seen this app before?
  if(!(manifest.name in apps)){
    apps[manifest.name] = {};
  }

  instances = apps[manifest.name];
  // Accept provided id or create new one
  id = manifest.instanceId || uuid.v4();

  if(id in instances){
    return cli.write("E_INST " + JSON.stringify({msg: "Instance name: " + id +" taken!"}))
  }

  instances[id] = {
    'socket' : cli,
    'manifest' : manifest,
    'status' : up
  };
  addDependents(manifest);
  dependencyAlerter(manifest);
  cli.on('end', function(){
    dependencyRemovedAlerter(manifest);
    delete instances[id];
  });

  cli.write("MANIFEST_OK " + JSON.stringify({
    instanceId: id,
    dataPort: 4000
  }));
}

var dependencyTracker = {};
//add in new dependents
function addDependents(manifest){
  for(var dependency in manifest.dependencies){
    if(!(dependency in dependencyTracker)){
      dependencyTracker[dependency] = {}
    }
    dependencyTracker[dependency] = [manifest.name, manifest.dependencies[dependency]];
  }
}
//notify a new 'dependent' is avaliable
function dependencyAlerter(manifest){
  var name = manifest.name;
  var dependents = dependencyTracker[name];
  for(var dependent in dependents){
    if(semver.satisfies(manifest.version, dependencyTracker[name][1])){
      console.log("Version is compatible"); //TODO alert that new dependencies is avaliable
    }
  }
}
function dependencyRemovedAlerter(manifest){
  var name = manifest.name;
  var dependents = dependencyTracker[name];
  for(var dependent in dependents){
    if(semver.satisfies(manifest.version, dependencyTracker[name][1])){
      console.log(name + " is down"); //TODO alert that dependencies is now unavaliable
    }
  }
}


