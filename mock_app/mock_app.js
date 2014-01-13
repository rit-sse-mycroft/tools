var app = require('./app.js'),
  client = app.connectToMycroft();

app.sendManifest(client, './app.json');
app.query(client, 'text2speech', 'say', ['Hello, My name is Mycroft']);
client.on('data', function (data) {
  var dependencies = app.manifestCheck(data);
  if(dependencies){
  	if(dependencies.logger == 'up'){
  		app.up(client);
  	}
  }
});


client.on('end', function() {
  console.log('client disconnected');
});