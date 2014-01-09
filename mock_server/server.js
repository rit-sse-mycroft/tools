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

  apps[id] = {
    'socket' : cli,
    'manifest' : manifest,
    'status' : 'down'
  };
  addDependents(manifest);
  cli.on('end', function(){
    dependencyRemovedAlerter(manifest, cli);
    removeDependents(manifest);
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
//   'type' : {
//     'appName' : 'version',
//     ...
//   }
//   ...
// }
// The appName depends on this type at this version
var dependencyTracker = {};
//add in new dependents from this manifest file
function addDependents(manifest){
  for(var type in manifest.dependencies){
    if(!(type in dependencyTracker)){
      dependencyTracker[type] = {}
    }
    dependencyTracker[type][manifest.name] = manifest.dependencies[type];
  }
}
//notify a new 'dependent' is avaliable
function dependencyAlerter(manifest, cli){
  var type = manifest.type;
  var dependents = dependencyTracker[name];
  var dependable = {};
  for(var dependent in dependents){
    if(semver.satisfies(manifest.version, dependencyTracker[name][dependent])){
      dependable[dependent] = manifest.version;
    }
    cli.write("These apps: " + dependable + " can now work with " + manifest.name + " version " + manifest.version);
  }
}
//alert apps if a dependency goes down
function dependencyRemovedAlerter(manifest, cli){
  var name = manifest.name;
  var dependents = dependencyTracker[name];
  var dependable = {};
  for(var dependent in dependents){
    if(semver.satisfies(manifest.version, dependencyTracker[name][dependent])){
      dependable[dependent] = manifest.version;
    }
    cli.write("These apps: " + dependable + " can no longer work with " + manifest.name + " version " + manifest.version + " down.");

  }
}
//remove the dependents when offline
function removeDependents(manifest){
    for(var dependency in manifest.dependencies){
      if((dependency in dependencyTracker)){
        delete dependencyTracker[dependency][manifest.name];
      }
    }
}
