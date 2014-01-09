var net = require('net');
var uuid = require('uuid');
var MYCROFT_PORT = 1847;

//path is the path to the json manifest
function connectToMycroft() {
  client = net.connect({port: MYCROFT_PORT}, function(err){
    if (err) {
      console.error('There was an error');
    }
  });

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
  connection.write('APP_UP');
}

function down(connection) {
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
  }

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

function manifestCheck(data, content) {
  var dataMatch = /APP_MANIFEST_(OK||FAIL) (.*)/.exec(data),
      data;

  if (dataMatch.length != 3) {
    throw 'Received invalid JSON response';
  } else {
    data = JSON.parse(dataMatch[2]);
    console.log('Response type: APP_MANIFEST_' + dataMatch[1]);
    console.log('Response recieved:');
    console.log(data);

    if (dataMatch[1] === 'OK') {
      console.log('Manifest Validated');
    } else if (dataMatch[1] === 'FAIL') {
      throw 'Invalid application manifest';
    } else {
      throw 'Unexpected error, manifest validation failed';
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