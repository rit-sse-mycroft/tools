// gen_ca.js
//
// USAGE: node gen_ca.js [KEYLENGTH]
//
// KEYLENGTH - the number of bits to use in the RSA key (default 2048)
//
// Generates Certificate Authority files.
//
// This script will create the directory ./CA as an openssl certificate
// authority. The CA's key file is stored in CA/ca.key, and the CA's
// self-signed certificate is stored in CA/ca.crt

var sys = require('sys');
var exec = require('child_process').exec;
var fs  = require('fs');
var path = require('path');

var _help = "";
_help += "USAGE: node gen_ca.js [KEYLENGTH]\n";
_help += "\n";
_help += "KEYLENGTH - the number of bits to use in the RSA key\n";

var keylen = 2048;

// set the keylen if given and valid
if (process.argv.length > 2) {
  // validate the keylen
  if (isNaN(process.argv[2])) {
    console.error("ERROR: KEYLENGTH must be a number");
    console.error(_help);
    process.exit(1);
  }
  else {
    // supplied keylen is valid! use it!
    keylen = process.argv[2];
  }
}
else {
  console.warn("WARNING: using default key length of 2048");
}

// refuse to mess with an existing CA directory
if (fs.existsSync("CA")) {
  console.error("ERROR: Directory exists: CA");
  console.error("Will not continue");
  process.exit(1);
}

// make a fresh CA directory with all the necessary files
fs.mkdirSync("CA");
// put the config file into the CA directory
var toWrite = "";
toWrite += "[ ca ]\n";
toWrite += "default_ca = ca_default\n";
toWrite += "\n";
toWrite += "[ ca_default ]\n";
toWrite += "dir = CA\n";
toWrite += "certs = $dir\n";
toWrite += "new_certs_dir = $dir/ca.db.certs\n";
toWrite += "database = $dir/ca.db.index\n";
toWrite += "serial = $dir/ca.db.serial\n";
toWrite += "RANDFILE = $dir/ca.db.rand\n";
toWrite += "certificate = $dir/ca.crt\n";
toWrite += "private_key = $dir/ca.key\n";
toWrite += "default_days = 3650\n";
toWrite += "default_crl_days = 30\n";
toWrite += "default_md = sha\n";
toWrite += "preserve = no\n";
toWrite += "policy = generic_policy\n";
toWrite += "[ generic_policy ]\n";
toWrite += "countryName = optional\n";
toWrite += "stateOrProvinceName = optional\n";
toWrite += "localityName = optional\n";
toWrite += "organizationName = optional\n";
toWrite += "organizationalUnitName = optional\n";
toWrite += "commonName = supplied\n";
toWrite += "emailAddress = optional\n";
// write it!
fs.writeFileSync(path.join("CA", "ca.conf"), toWrite);
// 'touch' the index file
fs.writeFileSync(path.join("CA", "ca.db.index"), "");
// set the first serial number to 01
fs.writeFileSync(path.join("CA", "ca.db.serial"), "01");

// call openssl!
var cmd = "openssl ";
cmd += "req -new -newkey ";
cmd += "rsa:"+keylen + " ";
cmd += "-days 3650 -nodes -x509 "
cmd += "-subj \"/C=US/ST=NY/L=Rochester/O=SSE-CA/CN=*\" ";
cmd += "-keyout " + path.join("CA", "ca.key") + " ";
cmd += "-out " + path.join("CA", "ca.crt");
function puts(error, stdout, stderr) {
  sys.puts(stdout)
}
exec(cmd, puts);
