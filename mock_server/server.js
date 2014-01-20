var tls = require('tls');
var net = require('net');
var validateManifest = require('../manifest_verifier/valid_manifest');
var uuid = require('uuid');
var semver = require('semver');
var fs = require('fs');

function handleClient(cli) {
  console.log('server connected');
  if (cli.authorized) {
    console.log("Authorized");
  }
  else {
    console.log("Unauthorized");
    console.log(cli.authorizationError);
  }

  cli.on('close', function() {
    console.log('Connection closing');
    if (cli['manifest']) {
      dependencyRemovedAlerter(cli);
      delete apps[cli['manifest']['instanceId']]
    }
  });

  cli.on('error', function(err) {
    console.log('caught error ' + err);
  });

  cli._unconsumed = '';
  cli.on('data', function(msg){
  	cli._unconsumed += msg.toString().trim();
    while (cli._unconsumed != '') {
      // get the message-length to read
      var verbStart = cli._unconsumed.indexOf('\n');
      var msgLen = parseInt(cli._unconsumed.substr(0, verbStart));
      // cut off the message length header from unconsumed
      cli._unconsumed = cli._unconsumed.substr(verbStart+1);
      // figure out how many bytes we have left to consume
      var bytesLeft = Buffer.byteLength(cli._unconsumed, 'utf8');
      // don't process anything if we don't have enough bytes
      if (bytesLeft < msgLen) {
        break;
      }
      // isolate the message we are actually handling
      var unconsumedBuffer = new Buffer(cli._unconsumed);
      msg = unconsumedBuffer.slice(0, msgLen).toString();
      // store remainin stuff in unconsumed
      cli._unconsumed = unconsumedBuffer.slice(msgLen).toString();
      // go process this single message
      console.log('got message');
      console.log(msg);
      var type = '';
      var data = {};
      var index = msg.indexOf(' {');
      if (index >= 0) { // if a body was supplied
        type = msg.substr(0, index);
        try {
          var toParse = msg.substr(index+1);
          data = JSON.parse(toParse);
        }
        catch(err) {
          console.log('malformed message 01');
          sendMessage(cli, "MSG_MALFORMED \n" + err);
          return;
        }
      }
      else { // no body was supplied
        type = msg;
      }
      if (type === '') {
        console.log('malformed message 02');
        sendMessage(cli, "MSG_MALFORMED \n" + err);
        return;
      }
      handleMsg(type, data, cli);
    }
  });

}

var serv = null;
if (process.argv.length === 3 && process.argv[2] === '--no-tls') {
  console.log("Not using TLS");
  serv = net.createServer(handleClient);
}
else {
  console.log("Using TLS");
  var servOptions = {
    key: fs.readFileSync('mycroft.key'),
    cert: fs.readFileSync('mycroft.crt'),
    requestCert: true,
    ca: [ fs.readFileSync('mycroft.crt') ],
    rejectUnauthorized: true
  };
  serv = tls.createServer(servOptions, handleClient);
}

serv.listen(1847, function() {
  console.log("Mycroft mock server listening on port 1847");
});

function handleMsg(type, data, cli){
  if(type === 'APP_MANIFEST'){
    register(cli, data);
  }
  else if(type === 'APP_UP'){
    goUp(cli, data);
  }
  else if(type === 'APP_DOWN'){
    goDown(cli, data);
  }
  else if(type === 'APP_IN_USE') {
    goInUse(cli, data.priority);
  }
  else if(type === 'MSG_QUERY') {
    handleQuery(cli, data);
  }
  else if(type === 'MSG_QUERY_SUCCESS') {
    handleQueryResponse('SUCCESS', cli, data);
  }
  else if(type === 'MSG_QUERY_FAIL') {
    handleQueryResponse('FAIL', cli, data);
  }
  else if(type === 'MSG_BROADCAST') {
    broadcast(cli, data);
  }
  else {
    console.log("Got unknown message type " + type + " with data:");
    console.log(JSON.stringify(data));
  }
}

function sendMessage(cli, msg) {
  var bytes = Buffer.byteLength(msg, 'utf8');
  var msg = bytes + '\n' + msg;
  cli.write(msg);
  console.log("sent message to " + cli['manifest'].instanceId);
  console.log(msg);
}

// Lazy app state tracker :D
// { 'instance_name' : {...}, ... }
var apps = {};
// Lazy message query/response tracker
// { uuid : {from: cli}, ... }
var messages = {};

function register(cli, manifest) {
  var id;
  var validation = validateManifest(manifest);
  var isValidMan = validation.length === 0;
  if(!isValidMan){
    console.log('Invalid manifest from app id ' + id);
    return sendMessage(cli, "APP_MANIFEST_FAIL " + JSON.stringify(validation)); //TODO: STANDARDIZE
  }

  // Accept provided id or create new one
  id = manifest.instanceId || uuid.v4();

  if(id in apps){
    console.log('instance id already taken: ' + id);
    return sendMessage(cli, "E_INST " + JSON.stringify({msg: "Instance name: " + id +" taken!"}))
  }

  cli.instanceId = manifest.instanceId;
  cli['manifest'] = manifest;

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

  sendMessage(cli, "APP_MANIFEST_OK " + JSON.stringify({
    instanceId: id,
  }));
  sendDependencies(cli)
  console.log('App id ' + id + ' connected');
}

function goUp(cli, data) {
  var id = cli.manifest.instanceId;
  apps[id]['status'] = 'up';
  dependencyAlerter(cli);
  console.log('app id ' + id + ' just went up');
}

function goDown(cli, data) {
  var id = cli.instanceId;
  apps[id]['status'] = 'down';
  dependencyRemovedAlerter(cli);
  console.log('app id ' + id + ' just went down');
}

function goInUse(cli, priority) {
  var id = cli.instanceId;
  apps[id]['status'] = 'in_use ' + priority;
  dependencyRemovedAlerter(cli, priority);
  console.log('app id ' + id + ' is in use by a process with priority ' + priority);
}

function handleQuery(cli, data) {
  var fromInstanceId = cli['instanceId'];
  data['fromInstanceId'] = fromInstanceId
  var toInstanceIds = data['instanceId'];
  // if not an array, then we can't handle this!
  if (toInstanceIds != undefined &&  !(toInstanceIds instanceof Array)) {
    console.log('WARNING: instanceId was not an array. Skipping');
    return;
  }
  var targetCapability = data['capability'];
  messages[data['id']] = {from: cli};
  // if no target was specified, this is untargeted
  if (!toInstanceIds || toInstanceIds.length === 0) {
    for (var appID in apps) {
      var satisfies = targetCapability in apps[appID]['manifest']['capabilities'];
      if (satisfies) {
        sendMessage(apps[appID]['socket'], 'MSG_QUERY ' + JSON.stringify(data));
      }
    }
  }
  // else this is targeted, so way easier!
  else {
    for (var i=0; i<toInstanceIds.length; i++) {
      if (!(toInstanceIds[i] in apps)) {
        console.log(
          "WARNING: will not send message to invalid instance id " + 
          toInstanceIds[i]
        );
      }
      else {
        sendMessage(apps[toInstanceIds[i]]['socket'], 'MSG_QUERY ' + JSON.stringify(data));
      }
    }
  }
}

// status is either 'SUCCESS' or 'FAIL'
function handleQueryResponse(status, cli, data) {
  data.instanceId = cli['manifest']['instanceId'];
  var id = data['id'];
  sendMessage(messages[id]['from'], 'MSG_QUERY_' + status + ' ' + JSON.stringify(data));
}

function broadcast(cli, data) {
  //Send to ALL THE CLIENTS
  msg = "MSG_BROADCAST " + JSON.stringify(data);
  for (key in apps) {
    sendMessage(apps[key].socket, msg);
  }
}

function sendDependencies(cli) {
  //Send an app the status of its dependencies
  var dependencies = checkDependencies(cli)
  sendMessage(cli, "APP_DEPENDENCY " + JSON.stringify(checkDependencies(cli)));
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
  console.log("Gets here!");
  var capabilities = cli['manifest'].capabilities;
  for(var capability in capabilities) {
    console.log("Checking Capability: " + capability);
    var version = capabilities[capability];
    console.log("version " + version);
    for(var appID in apps) {
      console.log("- Checking application: " + appID);
      for(var capabilityNeeded in apps[appID]['manifest']['dependencies']) {
        console.log("- - Has dependency: " + capabilityNeeded);
        console.log("- - Version " + apps[appID]['manifest']['dependencies'][capabilityNeeded]);
        var fulfils = capability === capabilityNeeded;
        try {
          var versionGood = semver.satisfies(version,
                                           apps[appID]['manifest']['dependencies'][capabilityNeeded]
                                          );
        } catch (err) {
          var versionGood = false;
        }
        if(fulfils && versionGood) {
          // whoa we need to notify this app!
          console.log("Found a match!");
          sendMessage(apps[appID].socket, msg);
        }
      }
    }
  }
}

//Return a dependencies object that contains the state of
//all apps that satisfy the dependencies of the app given by
//cli
function checkDependencies(cli){
  var dependencies = {};
  for (var dependency in cli['manifest']['dependencies']) {
    dependencies[dependency] = {};
  }
  for (var appId in apps) {
    for (var capability in apps[appId]['manifest']['capabilities']) {
      if (dependencies.hasOwnProperty(capability)) {
        var requestedVersion = cli['manifest']['dependencies'][capability];
        var givenVersion = apps[appId]['manifest']['capabilities'][capability];
        try {
          var matches = semver.satisfies(givenVersion, requestedVersion);
        } catch (err) {
          var matches = false
        }
        if (matches) {
          dependencies[capability][appId] = apps[appId]['status'];
        }
      }
    }
  }
  return dependencies;
}


//notify a new 'dependent' is avaliable
function dependencyAlerter(cli){
  var dependency = {};
  for (capability in cli.manifest['capabilities']) {
    dependency[capability] = {};
    dependency[capability][cli.instanceId] = 'up';
  }
  var msg = 'APP_DEPENDENCY ' + JSON.stringify(dependency);
  sendMessageToDependants(cli, msg);
}
//alert apps if a dependency goes down
function dependencyRemovedAlerter(cli){
  var dependency = {};
  for (capability in cli.manifest['capabilities']) {
    dependency[capability] = {};
    dependency[capability][cli.instanceId] = 'down';
  }
  var msg = 'APP_DEPENDENCY ' + JSON.stringify(dependency);
  sendMessageToDependants(cli, msg);
}
//alert apps if a dependency goes in in_use
function dependencyInUseAlerter(cli, priority){
  var dependency = {};
  for (capability in cli.manifest['capabilities']) {
    dependency[capability] = {};
    dependency[capability][cli.instanceId] = 'in_use ' + priority;
  }
  dependency[cli.instanceId] = 'in_use ' + priority;
  var msg = 'APP_DEPENDENCY ' + JSON.stringify(dependency);
  sendMessageToDependants(cli, msg);
}