var APP_NAME = 'mock_app';

var app = require('./app.js');
var client = app.connectToMycroft(APP_NAME);

app.sendManifest(client, './app.json');

var verified = false; //Set to true when APP_MANIFEST_OKAY received

client._unconsumed = '';
client.on('data', function(msg){
  parsed = app.parseMessage(msg);
  for(var i = 0; i < parsed.length; i++) {
    handleMsg(parsed[i]);
  }
});


// Handle a single command.
// parsed is a parsed command (as JSON) with type:String and data:Object.
function handleMsg(parsed) {
  // Check the type of this message.
  if (parsed.type === 'APP_MANIFEST_OK' || 'APP_MANIFEST_FAIL') {
    var dependencies = app.manifestCheck(parsed);
    verified = true;

  } else if (parsed.type === 'MSG_QUERY') {
    console.log('Query received');

  } else if (parsed.type === 'MSG_QUERY_SUCCESS') {
    console.log('Query successful');

  } else if (parsed.type === 'MSG_QUERY_FAIL') {
    console.error('Query Failed.');
    throw parsed.data.message;

  } else {
    console.log('Message Receieved');
    console.log(' - Type: ' + parsed.type);
    console.log(' - Message:' + JSON.stringify(parsed.data));
  }
  
  if (verified) {
    data = {
      text: "Pickle Unicorns",
      targetSpeaker: "speakers"
    }
    //app.query(client, 'tts', 'stream', data, ['text2speech'], 30);
  }
  
  if(dependencies){
  	if(dependencies.logger == 'up'){
  		app.up(client);
  	}
  }
}

client.on('end', function() {
  console.log('client disconnected');
});
