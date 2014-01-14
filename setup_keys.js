var path = require('path');
var exec = require('child_process').exec;
var fs  = require('fs');

function displayCertificate(cert, callback) {
    exec("openssl x509 -in " + cert + " -noout -fingerprint -sha1", function(error, stdout, stderr) {
        console.log(stdout);

        console.log("To set up the C# Mycroft server, install the CA/ca.crt");
        console.log("certificate into your machine certificate store, then paste the");
        console.log("above hash into the settings.xml in the build output folder.");
        console.log();
        callback();
    });

}

// run the main function if this is run as a script
if (require.main === module) {

  var caGen = path.join("key_management", "gen_ca.js");
  var clientGen = path.join("key_management", "gen_client.js");

  exec("node " + caGen + " 2048", function(err) {

      console.log("Generated server certificate");

      displayCertificate(path.join("CA", "ca.crt"), function(){
          // Copy the server cert
          fs.createReadStream(path.join("CA", "ca.crt"))
            .pipe(fs.createWriteStream(path.join("mock_server", "mycroft.crt")));

          console.log("Copied server certificate");

          // Copy the server key
          fs.createReadStream(path.join("CA", "ca.key"))
            .pipe(fs.createWriteStream(path.join("mock_server", "mycroft.key")));

          console.log("Copied server key");

          // Generate the client keys
          exec("node " + clientGen + " 2048 mock_app", function(err) {
            console.log("Generated client certificate");
            
            // Move the client certificate
            fs.createReadStream(path.join("mock_app.key"))
              .pipe(fs.createWriteStream(path.join("mock_app", "mock_app.key")));

            fs.createReadStream(path.join("mock_app.crt"))
              .pipe(fs.createWriteStream(path.join("mock_app", "mock_app.crt")));

            fs.unlinkSync("mock_app.crt");
            fs.unlinkSync("mock_app.key");

            // Copy the server cert
            fs.createReadStream(path.join("CA", "ca.crt"))
              .pipe(fs.createWriteStream(path.join("mock_app", "ca.crt")));

            console.log("Moved client keys");
          });
          
      });


  });
}
