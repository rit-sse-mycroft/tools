var APP_NAME = 'mock-broadcast-js';

var PROMPT_SCHEMA = {
  properties: {
    message: {
      pattern: /^[a-zA-Z\s\-]+$/,
      message: 'The message may only consist of letters, spaces, and dashes.'
    },
    grammar: {
      pattern: /^[a-zA-Z0-9]+$/,
      message: 'The grammar name may only consist of letters and digits.'
    }
  }
};

var prompt = require('prompt');
var app = require('./app.js');
var client = app.connectToMycroft(APP_NAME);

app.sendManifest(client, './app.json');

var verified = false; //Set to true when APP_MANIFEST_OKAY received
var takingInput = false;
var lastMessage;

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
  } else {
    console.log('Message Receieved');
    console.log(' - Type: ' + parsed.type);
    console.log(' - Message:' + JSON.stringify(parsed.data));
  }
}

function promptMessage() {
  prompt.start();
  prompt.get(PROMPT_SCHEMA, function(err, result) {
    if (!err) {
      var message = {
        text: result.message,
        grammar: result.grammar
      };
      // Broadcast the input.
      app.broadcast(client, message);
      // This is now the last message sent.
      lastMessage = result.message;
      promptMessage();
    }
  });
}