var net = require('net');
var manifest = require('./app.json');

var client = net.connect({port: 1847}, function() {
  console.log('client connected');
  client.write('MANIFEST ' + JSON.stringify(manifest));
  console.log('Sent: MANIFEST ' + JSON.stringify(manifest));
});

client.on('data', function (data) {
  dataMatch = /MANIFEST_(OK||FAIL) (.*)/.exec(data);
  if (dataMatch.length != 3) {
    message = 'invalid json response';
  } else {
    data = JSON.parse(dataMatch[2]);
    console.log('Response type: MANIFEST_' + dataMatch[1]);
    console.log('Response recieved:');
    console.log(data);
    if (data.status == 'STATUS_GOOD') {
      message = {
        timestamp: new Date().toISOString(),
        token: data.instanceId,
        content: 'pickle unicorns'
      }
      var messageBoard = net.connect({ port: data.port }, function () {
        console.log('connected to message board');
        console.log(message);
        messageBoard.write('MESSAGE ' + JSON.stringify(message));
      });
    } else if (data.status == 'MISSING_DEPENDENCIES') {
      message = 'missing dependencies';
    } else if (data.status == 'INVALID_CONFIG') {
      message = 'invalid config';
    } else {
      message = 'something went wrong';
    }
  }
  console.log(message);
});

client.on('end', function() {
  console.log('client disconnected');
});