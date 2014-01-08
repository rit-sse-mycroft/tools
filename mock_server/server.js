var net = require('net');

var serv = net.createServer(function(cli) {
  console.log('server connected');
  cli.on('end', function(){
    console.log('server disconnected');
  });
});

serv.listen(1847, function() {
  console.log("Mycroft mock server onlined");
});
