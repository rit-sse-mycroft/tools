var tls = require('tls');
var fs = require('fs');

var options = {
  // These are necessary only if using the client certificate authentication
  key: fs.readFileSync('client/client.key'),
  cert: fs.readFileSync('client/client.crt'),

  // This is necessary only if the server uses the self-signed certificate
  ca: [ fs.readFileSync('ca/ca.crt') ],
  rejectUnauthorized: false
};

var cleartextStream = tls.connect(8000, options, function() {
  console.log('client connected');
  if (cleartextStream.authorized) {
    console.log('Authorized');
  }
  else {
    console.log('Unauthorized');
    console.log(cleartextStream.authorizationError);
  }
  process.stdin.pipe(cleartextStream);
});
cleartextStream.setEncoding('utf8');
cleartextStream.on('data', function(data) {
  console.log(data);
});
cleartextStream.on('end', function() {
  server.close();
});
