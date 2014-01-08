var net = require('net');
var manifest = require('./app.json');
var message = require('./message.json');
var client = net.connect({port: 1847}, function() {
  console.log('client connected');
  client.write(manifest);
});

client.on('data', function(data) {
  client.write(message);
});

client.on('end', function() {
  console.log('client disconnected');
});