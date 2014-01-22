var tls = require('tls');
var net = require('net');
var uuid = require('uuid');
var fs = require('fs');
var MYCROFT_PORT = 1847;

function parseMessage(msg) {
  msg = msg.toString();

  console.log("Received message: " + msg);

  var firstSpace = msg.indexOf(" ");

  // No body in message
  if (firstSpace < 0) {
    var msgSplit = re.exec(msg)
    if (!msgSplit) { //RE still doesn't match... something is wrong.
      throw "Error: Malformed Message"
    }
    var type = msg;
    var data = {};

  } else {

    var type = msg.substr(0, firstSpace);
    var data = JSON.parse(msg.substr(firstSpace + 1));

  }
  return {type: type, data: data};

}

// If using TLS, appName is assumed to be the name of the keys.
function connectToMycroft(appName) {
  var client = null;
  if (process.argv.length === 3 && process.argv[2] === '--no-tls') {
    console.log("Not using TLS");
    client = net.connect({port: 1847}, function(err) {
      if (err) {
        console.error('There was an error establishing connection');
      }
    });
  } else {
    console.log("Using TLS");
    var connectOptions = {
      key: fs.readFileSync(appName + '.key'),
      cert: fs.readFileSync(appName + '.crt'),
      ca: [ fs.readFileSync('ca.crt') ],
      rejectUnauthorized: false,
      port: MYCROFT_PORT
    };
    client = tls.connect(connectOptions, function(err) {
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
  sendMessage(connection, 'APP_MANIFEST', manifest)
}

function up(connection) {
  console.log('Sending App Up');
  sendMessage(connection, 'APP_UP');
}

function down(connection) {
  console.log('Sending App Down');
  sendMessage(connection, 'APP_DOWN');
}

function query(connection, capability, action, data, instanceId, priority) {
  queryMessage = {
    id: uuid.v4(),
    capability: capability,
    action: action,
    data: data,
    priority: priority,

  };
  if (typeof(instanceId) != 'undefined') queryMessage.instanceId = instanceId;

  sendMessage(connection, 'MSG_QUERY', queryMessage);
}

//Sends a message to the Mycroft global message board.
function broadcast(connection, content) {
  message = {
    content: content
  };
  sendMessage(connection, 'MSG_BROADCAST', message);
}

// Checks if the manifest was validated and returns dependencies
function manifestCheck(parsed) {
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

//Sends a message of specified type. Adds byte length before message.
//Does not need to specify a message object. (e.g. APP_UP and APP_DOWN)
function sendMessage(connection, type, message) {
  if (typeof(message) === 'undefined') {
    message = '';
  } else {
    message = JSON.stringify(message);
  }
  var body = (type + ' ' + message).trim();
  var length = Buffer.byteLength(body, 'utf8');
  console.log('Sending Message');
  console.log(length);
  console.log(body);
  connection.write(length + '\n' + body);

}

exports.parseMessage = parseMessage
exports.connectToMycroft = connectToMycroft;
exports.sendManifest = sendManifest;
exports.up = up;
exports.down = down;
exports.query = query;
exports.broadcast = broadcast;
exports.manifestCheck = manifestCheck;
