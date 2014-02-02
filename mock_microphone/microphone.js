var APP_NAME = 'mock-microphone';

var prompt = require('prompt');
var app = require('./app.js');
var client = app.connectToMycroft(APP_NAME);

app.sendManifest(client, './app.json');

var verified = false; //Set to true when APP_MANIFEST_OKAY received
var takingInput = false;

client.on('data', function(msg) {
  parsed = app.parseMessage(msg);
  for (var i = 0; i < parsed.length; i++) {
    handleMessage(parsed[i]);
  }
});

client.on('end', function() {
  console.log('Client disconnected.');
});

// Handle a single command.
// parsed is a parsed command (as JSON) with type:String and data:Object.
function handleMessage(parsed) {
  // Check the type of this message.
  if (parsed.type === 'APP_MANIFEST_OK'/* || parsed.type === 'APP_MANIFEST_FAIL'*/) {
    var dependencies = app.manifestCheck(parsed.data);
    verified = true;
  } else if (parsed.type === 'APP_DEPENDENCY') {
    if(!takingInput) {
      promptMessage();
      takingInput = true;
    }
    app.up(client);
  } else {
    console.log('Message Receieved');
    console.log(' - Type: ' + parsed.type);
    console.log(' - Message:' + JSON.stringify(parsed.data));
  }
}

function promptMessage() {
  prompt.start();
  prompt.get(['text'], function(err, result) {
    if (!err) {
      var message = {
        spoken_text: result.text
      };
      // Broadcast the input.
      app.broadcast(client, message);
      promptMessage();
    }
  });
}