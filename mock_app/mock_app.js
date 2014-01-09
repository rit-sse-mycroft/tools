var app = require('./app.js'),
  client = app.connectToMycroft();

app.sendManifest(client, './app.json');

client.on('data', function (data) {
  app.manifestCheck(data);
});


client.on('end', function() {
  console.log('client disconnected');
});