var tls = require('tls');

var serv = tls.createServer(function(cli) {
  //do... stuff? Yeah, stuff.
});

serv.listen(4000, function() {
  console.log("Mycroft mock server onlined");
});
