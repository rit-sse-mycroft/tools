var APP_NAME = 'mock-broadcast-js';

var PROMPT_SCHEMA = {
  properties: {
    message: {
      pattern: /^[a-zA-z\s\-]+$/,
      message: 'The message may only consist of letters, spaces, and dashes.',
    }
  }
};

var prompt = require('prompt');
var app = require('./app.js');
var client = app.connectToMycroft(APP_NAME);

app.sendManifest(client, './app.json');

var verified = false; //Set to true when APP_MANIFEST_OKAY received

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
    promptMessage();
  } else if (parsed.type === 'MSG_BROADCAST') {
    if (lastMessage && parsed.data.content &&
        parsed.data.content.text && lastMessage === parsed.data.content.text) {
      promptMessage();
    }
  } else {
    console.log('Message Receieved');
    console.log(' - Type: ' + parsed.type);
    console.log(' - Message:' + JSON.stringify(parsed.data));
  }
  
  if (dependencies) {
    if (dependencies.logger === 'up') {
      app.up(client);
    }
  }
}

function promptMessage() {
  prompt.start();
  prompt.get(PROMPT_SCHEMA, function(err, result) {
    if (!err) {
      var message = {
        text: result.message
      };
      // Broadcast the input.
      app.broadcast(client, message);
      // This is now the last message sent.
      lastMessage = result.message;
    }
  });
}