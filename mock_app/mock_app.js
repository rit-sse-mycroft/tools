var APP_NAME = 'mock_app';

var app = require('./app.js');
var client = app.connectToMycroft(APP_NAME);

app.sendManifest(client, './app.json');

var verified = false; //Set to true when APP_MANIFEST_OKAY received

client._unconsumed = '';
client.on('data', function(msg){
  	client._unconsumed += msg.toString().trim();
    while (client._unconsumed != '') {
      // get the message-length to read
      var verbStart = client._unconsumed.indexOf('\n');
      var msgLen = parseInt(client._unconsumed.substr(0, verbStart));
      // cut off the message length header from unconsumed
      client._unconsumed = client._unconsumed.substr(verbStart+1);
      // figure out how many bytes we have left to consume
      var bytesLeft = Buffer.byteLength(client._unconsumed, 'utf8');
      // don't process anything if we don't have enough bytes
      if (bytesLeft < msgLen) {
        break;
      }
      // isolate the message we are actually handling
      var unconsumedBuffer = new Buffer(client._unconsumed);
      msg = unconsumedBuffer.slice(0, msgLen).toString();
      // store remainin stuff in unconsumed
      client._unconsumed = unconsumedBuffer.slice(msgLen).toString();
      // go process this single message
      console.log('got message');
      console.log(msg);
      var type = '';
      var data = {};
      var index = msg.indexOf(' {');
      if (index >= 0) { // if a body was supplied
        type = msg.substr(0, index);
        try {
          var toParse = msg.substr(index+1);
          data = JSON.parse(toParse);
        }
        catch(err) {
          console.log('malformed message 01');
          sendMessage(cli, "MSG_MALFORMED \n" + err);
          return;
        }
      }
      else { // no body was supplied
        type = msg;
      }

      handleMsg({type: type, data: data}, client);
    }
  });




function handleMsg(parsed, client) {

  //parsed = app.parseMessage(data);
  //Check the type of ths message
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
