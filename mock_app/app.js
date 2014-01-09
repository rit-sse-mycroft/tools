var net = require('net');
var MYCROFT_PORT = 1847;

//path is the path to the json manifest
function connectToMycroft() {
  client = net.connect({port: MYCROFT_PORT}, function(err){
    if (err) {
      console.error("There was an error");
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
    console.error("Invalid file path");
  }
  connection.write('APP_MANIFEST ' + JSON.stringify(manifest));
}

//Sends a message to the Mycroft global message board.
function sendMessage(connection, instanceId, content) {
  message = {
    timestamp: new Date().toISOString(),
    instanceId: instanceId,
    content: content
  };
  connection.write('MSG_BROADCAST ' + JSON.stringify(message));
}

function manifestCheck(data, content) {
  var dataMatch = /APP_MANIFEST_(OK||FAIL) (.*)/.exec(data),
      message = '',
      data;

  if (dataMatch.length != 3) {
    throw "Received invalid JSON response";
  } else {
    data = JSON.parse(dataMatch[2]);
    console.log('Response type: APP_MANIFEST_' + dataMatch[1]);
    console.log('Response recieved:');
    console.log(data);

    if (dataMatch[1] === 'OK') {
      var messageBoard = net.connect({ port: data.dataPort }, function (err) {
        console.log('Connecting to Message Board...');
        if (err) {
          throw "error connecting to message board";
        }
      });
    } else if (dataMatch[1] === 'FAIL') {
      throw "Invalid application manifest";
    } else {
      throw "Unexpected error, manifest validation failed";
    }
  }
  return messageBoard;
}

exports.connectToMycroft = connectToMycroft;
exports.sendManifest = sendManifest;
exports.sendMessage = sendMessage;
exports.manifestCheck = manifestCheck;