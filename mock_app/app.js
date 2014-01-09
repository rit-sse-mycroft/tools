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
  connection.write("MANIFEST " + JSON.stringify(manifest));
}

//Sends a message to the Mycroft global message board.
function sendMessage(connection, instanceId, content) {
  message = {
    timestamp: new Date().toISOString(),
    instanceId: instanceId,
    content: content
  };
  connection.write('MESSAGE ' + JSON.stringify(message));
}

exports.connectToMycroft = connectToMycroft;
exports.sendManifest = sendManifest;
exports.sendMessage = sendMessage;