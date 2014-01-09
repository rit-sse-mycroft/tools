var net = require('net'),
  app = require('./app.js'),
  client = app.connectToMycroft();

app.sendManifest(client, './app.json');

client.on('data', function (data) {
  var dataMatch = /MANIFEST_(OK||FAIL) (.*)/.exec(data),
    message = '',
    data;

  if (dataMatch.length != 3) {
    message = 'invalid json response';
  } else {
    data = JSON.parse(dataMatch[2]);  
    console.log('Response type: MANIFEST_' + dataMatch[1]);
    console.log('Response recieved:');
    console.log(data);

    if (dataMatch[1] === 'OK') {
      var messageBoard = net.connect({ port: data.dataPort }, function (err) {
        console.log('Connecting to Message Board...');
        if (err) {
          console.error('Error connecting to Message Board');
        }
      });
      app.sendMessage(messageBoard, data.instanceId, 'pickle unicorns');
    } else if (dataMatch[1] === 'FAIL') {
      message = 'Manifest validation failed';
    } else {
      message = 'something went wrong';
    }
  }
  console.log(message);
});


client.on('end', function() {
  console.log('client disconnected');
});