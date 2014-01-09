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
    var index = msg.indexOf(' {');
    var type = '';
    var data = {};
    if (index >= 0) { // if a body was supplied
      type = msg.substr(0, index);
      try {
        data = JSON.parse(msg.substr(index + 1));
      }
      catch(err) {
        return cli.write("MSG_MALFORMED \n" + err);
      }
    }
    else { // no body was supplied
      type = msg;
    }
    if (type === '') {
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
  if(type === 'APP_UP'){
    goUp(cli, data);
  }
  if(type === 'APP_DOWN'){
    goDown(cli, data);
  }
}

// Lazy app state tracker :D
// { 'instance_name' : {...}, ... }
var apps = {};

function register(cli, manifest){
  var id;
  var validation = validateManifest(manifest);
  var isValidMan = validation.length === 0;
  if(!isValidMan){
    console.log('Invalid manifest from app id ' + id);
    return cli.write("APP_MANIFEST_FAIL " + JSON.stringify(validation)); //TODO: STANDARDIZE
  }

  // Have we seen this app before?
  if(!(manifest.instanceId in apps)){
    apps[manifest.instanceId] = {};
  }

  // Accept provided id or create new one
  id = manifest.instanceId || uuid.v4();

  if(id in apps){
    return cli.write("E_INST " + JSON.stringify({msg: "Instance name: " + id +" taken!"}))
  }

  cli.instanceId = manifest.instanceId;
  cli.manifest = manifest;

  apps[id] = {
    'socket' : cli,
    'manifest' : manifest,
    'status' : 'down'
  };
  addDependents(manifest);
  cli.on('end', function(){
    dependencyRemovedAlerter(cli);
    delete apps[id];
  });

  var depStatus = {}; // {'name':[], ...}
  var myDeps = manifest['dependencies'];
  for (var depName in myDeps) { // iterate over what dependencies I need
    depStatus[depName] = [];
    for(var appID in apps) { // iterate over all apps
      var isNotMe = !(appID === id);
      var isUp    = apps[appID]['status'] === 'up';
      var matchesVersion = semver.satisfies(appID['version'], myDeps[depName]);
      if (isNotMe && isUp && matchesVersion) { // if this should be told
        depStatus[depName].append(appID);
      }
    }
  }
  cli.write("APP_MANIFEST_OK " + JSON.stringify({
    instanceId: id,
    dependencies: depStatus
  }));
  console.log('App id ' + id + ' connected');
}

function goUp(cli, data) {
  var id = cli.instanceId;
  apps[id]['status'] = 'up';
  dependencyAlerter(cli.manifest, cli);
  console.log('app id ' + id + ' just went up');
}

function goDown(cli, data) {
  var id = cli.instanceId;
  apps[id]['status'] = 'down';
  dependencyRemovedAlerter(cli.manifest, cli);
  console.log('app id ' + id + ' just went down');
}

// {
//   'capability' : {
//     'appName' : 'version',
//     ...
//   }
//   ...
// }
// The appName depends on this capability at this version
var dependencyTracker = {};
//add in new dependents from this manifest file
function addDependents(manifest){
  for(var capabilityNeeded in manifest.dependencies){
    if(!(capabilityNeeded in dependencyTracker)){
      dependencyTracker[capabilityNeeded] = {}
    }
    dependencyTracker[capabilityNeeded][manifest.name] = manifest.dependencies[capabilityNeeded];
  }
}
// send the message msg to everyone who depends on the given client (a socket)
function sendMessageToDependants(cli, msg) {
  var capabilities = cli['manifest'].capabilities;
  for(var capability in capabilities) {
    var version = capabilities[capability];
    for(var appID in apps) {
      for(var capabilityNeeded in apps[appID]['dependencies']) {
        var fulfils = capability === capabilityNeeded;
        var versionGood = semver.satisfies(version,
                                           apps[appID]['dependencies'][capability]
                                          );
        if(fulfils && versionGood) {
          // whoa we need to notify this app!
          cli.write(msg);
        }
      }
    }
  }
}
//notify a new 'dependent' is avaliable
function dependencyAlerter(cli){
  var msg = 'APP_UP ' + JSON.stringify({
    instanceId: cli.instanceId,
    capabilities: cli['manifest']['capabilities']
  });
  sendMessageToDependants(cli, msg);
}
//alert apps if a dependency goes down
function dependencyRemovedAlerter(cli){
  var msg = 'APP_DOWN ' + JSON.stringify({
    instanceId: cli.instanceId,
    capabilities: cli['manifest']['capabilities']
  });
  sendMessageToDependants(cli, msg);
}
