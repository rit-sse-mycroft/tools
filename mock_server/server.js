var net = require('net');
var validateManifest = require('../manifest_verifier/valid_manifest');
var uuid = require('uuid');

var serv = net.createServer(function(cli) {
  console.log('server connected');

  cli.on('end', function(){
    console.log('server disconnected');
  });

  cli.on('data', function(msg){
    var type = msg.substr(0, msg.indexOf(' {'));
    var data;
    try {
      data = JSON.parse(msg.substr(msg.indexOf(' {') + 1));
    }
    catch(err){
      //Handle this...
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
  var id;
  var instances;
  var validation = validateManifest(manifest);
  var isValidMan = validation.length === 0;
  if(!isValidMan){
    return cli.write("MANIFEST_FAIL " + JSON.stringify(validation)); //TODO: STANDARDIZE
  }

    // Have we seen this app before?
  if(!(manifest.name in apps)){
    apps[manifest.name] = {};
  }

  instances = apps[manifest.name];
  // Accept provided id or create new one
  id = manifest.instanceId || uuid.v4();

  if(id in instances){
    return cli.write("E_INST " + JSON.stringify({msg: "Instance name: " + id +" taken!"}))
  }

  instances[id] = 'up';
  cli.on('end', function(){
    //notify id disconnected...
    delete instances[id];
  });

  cli.write("MANIFEST_OK " + JSON.stringify({
    instanceId: id,
    dataPort: 4000
  }));

  //send dependency notifications
}