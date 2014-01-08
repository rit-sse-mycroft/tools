var net = require('net');
var validateManifest = require('../manifest_verifier/valid_manifest');
var uuid = require('uuid');

var serv = net.createServer(function(cli) {
  console.log('server connected');

  cli.on('end', function(){
    console.log('server disconnected');
  });

  cli.on('data', function(msg){
  	msg = msg.toString();
    var type = msg.substr(0, msg.indexOf(' {'));
    var data;
    try {
      data = JSON.parse(msg.substr(msg.indexOf(' {') + 1));
    }
    catch(err){
      return cli.write("MSG_MALFORMED \n" + err);
    }
    handleMsg(type, data, cli);
  });

});

serv.listen(1847, function() {
  console.log("Mycroft mock server listening on port 1847");
});


function handleMsg(type, data, cli){
  if(type === 'MANIFEST'){
    register(cli, data);
  }
}

// Lazy app state tracker :D
var apps = {}

function register(cli, manifest){
  var validation = validateManifest(manifest);
  var isValidMan = validation.length === 0;
  if(!isValidMan){
    return cli.write("MANIFEST_FAIL " + JSON.stringify(validation)); //TODO: STANDARDIZE
  }

  return cli.write("MANIFEST_OK " + JSON.stringify({you: "did it!"}));
}