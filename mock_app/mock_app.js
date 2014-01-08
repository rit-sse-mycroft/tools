var net = require('net');
var manifest = require('./app.json');

var client = net.connect({port: 1847}, function() {
  console.log('client connected');
  client.write('manifest ' + JSON.stringify(manifest));
});

client.on('data', function (data) {
  dataMatch = /response (.*)/.exec(data);
  if (dataMatch.length != 2) {
    message = 'invalid json response';
  } else {
    data = JSON.parse(dataMatch[1]);

    if (data.status == 'STATUS_GOOD') {
      message = {
        timestamp: new Date().toISOString(),
        token: data.token,
        content: 'pickle unicorns'
      }
      var messageBoard = net.connect({ port: data.port }, function () {
        console.log('connected to message board');
        console.log(message);
        messageBoard.write('message ' + JSON.stringify(data));
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