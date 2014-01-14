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

// this should be called only if this module was run,
// not if it was imported from another module
function main() {
  var _help = '';
  _help += 'USAGE: node gen_ca.js [KEYLENGTH]\n';
  _help += '\n';
  _help += 'KEYLENGTH - the number of bits to use in the RSA key\n';

  var keylen = 2048;

  // set the keylen if given and valid
  if (process.argv.length > 2) {
    // validate the keylen
    if (isNaN(process.argv[2])) {
      console.error('ERROR: KEYLENGTH must be a number');
      console.error(_help);
      process.exit(1);
    }
    else {
      // supplied keylen is valid! use it!
      keylen = process.argv[2];
    }
  }
  else {
    console.warn('WARNING: using default key length of 2048');
  }

  // refuse to mess with an existing CA directory
  if (fs.existsSync('CA')) {
    console.error('ERROR: Directory exists: CA');
    console.error('Will not continue');
    process.exit(1);
  }

  ensureCAExists(keylen, '.');
}

// make a fresh CA directory with all the necessary files
// dir - path to directory in which CA directory will be placed
function makeCADir(dir) {
  fs.mkdirSync(path.join(dir, 'CA'));
  // assemble the config file to write
  var toWrite = '';
  toWrite += '[ ca ]\n';
  toWrite += 'default_ca = ca_default\n';
  toWrite += '\n';
  toWrite += '[ ca_default ]\n';
  toWrite += 'dir = CA\n';
  toWrite += 'certs = $dir\n';
  toWrite += 'new_certs_dir = $dir/ca.db.certs\n';
  toWrite += 'database = $dir/ca.db.index\n';
  toWrite += 'serial = $dir/ca.db.serial\n';
  toWrite += 'RANDFILE = $dir/ca.db.rand\n';
  toWrite += 'certificate = $dir/ca.crt\n';
  toWrite += 'private_key = $dir/ca.key\n';
  toWrite += 'default_days = 3650\n';
  toWrite += 'default_crl_days = 30\n';
  toWrite += 'default_md = sha\n';
  toWrite += 'preserve = no\n';
  toWrite += 'policy = generic_policy\n';
  toWrite += '[ generic_policy ]\n';
  toWrite += 'countryName = optional\n';
  toWrite += 'stateOrProvinceName = optional\n';
  toWrite += 'localityName = optional\n';
  toWrite += 'organizationName = optional\n';
  toWrite += 'organizationalUnitName = optional\n';
  toWrite += 'commonName = supplied\n';
  toWrite += 'emailAddress = optional\n';
  // write it!
  fs.writeFileSync(path.join(dir, 'CA', 'ca.conf'), toWrite);
  // 'touch' the index file
  fs.openSync(path.join(dir, 'CA', 'ca.db.index'), 'w');
  // create the certs directory
  fs.mkdirSync(path.join(dir, 'CA', 'ca.db.certs'));
  // set the first serial number to 01
  fs.writeFileSync(path.join(dir, 'CA', 'ca.db.serial'), '01');
}

// call openssl to create the actual CA's credentials
// keylen - RSA key length
// dir    - path to directory in which credentials will be placed
function runOpenSSL(keylen, dir) {
  var cmd = 'openssl ';
  cmd += 'req -new -newkey ';
  cmd += 'rsa:'+keylen + ' ';
  cmd += '-days 30 -nodes -x509 '
  cmd += '-subj \"/O=DO_NOT_TRUST/CN=DO_NOT_TRUST_Mycroft_Test\" ';
  cmd += '-keyout ' + path.join(dir, 'ca.key') + ' ';
  cmd += '-out ' + path.join(dir, 'ca.crt');
  exec(cmd, function finish() {
    console.log('Created CA credentials');
  });
}

// Ensure that a CA directory exists. If one does not,
// a new directory (with credentials) is created.
// keylen - length of RSA key to use
// dir    - path to the directory in which CA directory will be put
// returns: true if the new directory creation process started
// NOTE: this runs asynchronously
function ensureCAExists(keylen, dir) {
  var caPath = path.join(dir, 'CA');
  if (fs.exists(caPath)) {
    return false;
  }
  makeCADir(dir);
  runOpenSSL(keylen, caPath);
  return true;
}
module.exports.ensureCAExists = ensureCAExists;

// run the main function if this is run as a script
if (require.main === module) {
  main();
}
