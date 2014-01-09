var net = require('net');
var uuid = require('uuid');
var MYCROFT_PORT = 1847;

function parse_message(msg){
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
      return connection.write('MSG_MALFORMED \n' + err);
    }
  }
  else { // no body was supplied
    type = msg;
  }
  if (type === '') {
    return connection.write('MSG_MALFORMED \n' + err);
  }
  return {type: type, data: data};
}

//path is the path to the json manifest
function connectToMycroft() {
  client = net.connect({port: MYCROFT_PORT}, function(err){
    if (err) {
      console.error('There was an error');
    }
  });
  console.log('Connected to Mycroft');
  return client;
}

//Given the path to a JSON manifest, converts that manifest to a string,
//and precedes it with the type MANIFEST
function sendManifest(connection, path) {
  try {
    var manifest = require(path);
  }
  catch(err) {
    console.error('Invalid file path');
  }
  console.log('Sending Manifest');
  connection.write('APP_MANIFEST ' + JSON.stringify(manifest));
}

function up(connection) {
  console.log('Sending App Up');
  connection.write('APP_UP');
}

function down(connection) {
  console.log('Sending app down');
  connection.write('APP_DOWN');
}

function query(connection, service, remoteProcedure, args, instanceIdTo, instanceIdFrom) {
  queryMessage = {
    id: uuid.v4(),
    service: service,
    remoteProcedure: remoteProcedure,
    args: args,
    instanceIdTo: instanceIdTo,
    instanceIdFrom: instanceIdFrom
  };

  connection.write('MSG_QUERY ' + JSON.stringify(query));
}

//Sends a message to the Mycroft global message board.
function broadcast(connection, instanceId, content) {
  message = {
    instanceId: instanceId,
    content: content
  };
  connection.write('MSG_BROADCAST ' + JSON.stringify(message));
}

// Checks if the manifest was validated and returns dependencies
function manifestCheck(data) {
  var parsed = parse_message(data);
  if (parsed.type === 'APP_MANIFEST_OK' || parsed.type === 'APP_MANIFEST_FAIL') {
    console.log('Response type: ' +  parsed.type);
    console.log('Response recieved: ' + JSON.stringify(parsed.data));

    if (parsed.type === 'APP_MANIFEST_OK') {
      console.log('Manifest Validated');
      return parsed.data.dependencies;
    } else {
      throw 'Invalid application manifest';
    }
  }
}

exports.connectToMycroft = connectToMycroft;
exports.sendManifest = sendManifest;
exports.up = up;
exports.down = down;
exports.query = query;
exports.broadcast = broadcast;
exports.manifestCheck = manifestCheck;