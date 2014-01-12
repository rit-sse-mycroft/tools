var tls = require('tls');
var net = require('net');
var uuid = require('uuid');
var fs = require('fs');
var MYCROFT_PORT = 1847;

function parseMessage(msg){
  msg = msg.toString();

  var re = /(\d+)\n(.*) ({[^]*})/;
  var msgSplit = re.exec(msg);

  if (!msgSplit) { //There is no body to this message
    re = /(\d+)\n(.*)/
    msgSplit = re.exec(msg)
    if (!msgSplit) { //RE still doesn't match... something is wrong.
      throw "Error: Malformed Message"
    }
    var type = msgSplit[2];
    var data = {};

  } else {
    var type = msgSplit[2];
    var data = JSON.parse(msgSplit[3]);
  }
  return {type: type, data: data};
}

//path is the path to the json manifest
function connectToMycroft() {
  var client = null;
  if (process.argv.length === 3 && process.argv[2] === '--no-tls') {
    console.log("Not using TLS");
    client = net.connect({port: 1847}, function(err){
      if (err) {
        console.error('There was an error establishing connection');
      }
    });
  }
  else {
    console.log("Using TLS");
    var connectOptions = {
      key: fs.readFileSync('mock_app.key'),
      cert: fs.readFileSync('mock_app.crt'),
      ca: [ fs.readFileSync('ca.crt') ],
      rejectUnauthorized: false,
      port: MYCROFT_PORT
    };
    client = tls.connect(connectOptions, function(err){
      if (err) {
        console.error('There was an error in establishing TLS connection');
      }
    });
  }
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
  msg = 'APP_MANIFEST ' + JSON.stringify(manifest);
  length = Buffer.byteLength(msg, 'utf8');
  connection.write(length + '\n' + msg);
}

function up(connection) {
  console.log('Sending App Up');
  connection.write('APP_UP');
}

function down(connection) {
  console.log('Sending app down');
  connection.write('APP_DOWN');
}

function query(connection, service, remoteProcedure, args, instanceId) {
  queryMessage = {
    id: uuid.v4(),
    service: service,
    remoteProcedure: remoteProcedure,
    args: args,
    instanceId: instanceId
  };

  connection.write('MSG_QUERY ' + JSON.stringify(query));
}

//Sends a message to the Mycroft global message board.
function broadcast(connection, content) {
  message = {
    content: content
  };
  connection.write('MSG_BROADCAST ' + JSON.stringify(message));
}

// Checks if the manifest was validated and returns dependencies
function manifestCheck(data) {
  var parsed = parseMessage(data);
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

exports.parseMessage = parseMessage
exports.connectToMycroft = connectToMycroft;
exports.sendManifest = sendManifest;
exports.up = up;
exports.down = down;
exports.query = query;
exports.broadcast = broadcast;
exports.manifestCheck = manifestCheck;
