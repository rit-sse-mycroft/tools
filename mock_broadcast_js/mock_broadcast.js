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


client.on('data', function (data) {
  parsed = app.parseMessage(data);
  //Check the type of this message
  if (parsed.type === 'APP_MANIFEST_OK' || 'APP_MANIFEST_FAIL') {
    var dependencies = app.manifestCheck(data);
    verified = true;
    promptMessage();
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
});

client.on('end', function() {
  console.log('Client disconnected.');
});

function promptMessage() {
  prompt.start();
  prompt.get(PROMPT_SCHEMA, function(err, result) {
    if (!err) {
      // Log the input (for debugging)
      console.log('Input received: ' + result.message);
      var message = {
        text: result.message
      };
      // Broadcast the input.
      app.broadcast(client, message);
      // Prompt for the next message.
      promptMessage();
    }
  });
}