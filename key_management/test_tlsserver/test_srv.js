var tls = require('tls');
var fs  = require('fs');

var options = {
  key: fs.readFileSync('ca/ca.key'),
  cert: fs.readFileSync('ca/ca.crt'),
  ca: [ fs.readFileSync('ca/ca.crt') ],
  requestCert: true,
  rejectUnauthorized: true
}

var server = tls.createServer(options, function(cleartextStream) {
  console.log('server connected');
  if (cleartextStream.authorized) {
    console.log("Authorized");
  }
  else {
    console.log("Unauthorized");
    console.log(cleartextStream.authorizationError);
  }
  cleartextStream.write("welcome!\n");
  cleartextStream.setEncoding('utf8');
  cleartextStream.pipe(cleartextStream);
});
server.listen(8000, function() {
  console.log('server bound');
});
