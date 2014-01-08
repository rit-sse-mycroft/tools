var validate_manifest = require('./valid_manifest');

process.stdin.resume();
process.stdin.setEncoding('utf8');

var jsondata = "";
process.stdin.on('data', function(chunk) {
  jsondata += chunk;
});

process.stdin.on('end', function() {
  var errors = validate_manifest(JSON.parse(jsondata));
  var bad = 1;
  for (k in errors) {
    bad = 0;
    process.stdout.write(errors[k]+"\n");
  }
  process.exit(bad);
});