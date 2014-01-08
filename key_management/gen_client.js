// Generates client keyfiles/certs for mycroft
//
// USAGE: node gen_client.js [KEYLENGTH] CLIENT_NAME
// 
// KEYLENGTH  - number of bits in the RSA key, default 2048
// CLIENT_NAME - a name to use for output file naming
// 
// NOTE: this script expects a CA to already exist from running gen_ca.js
//
// This script generates exactly one key/certificate for a mycroft client.
// The following files are output:
//   CLIENT_NAME.key - a keyfile
//   CLIENT_NAME.crt - a certificate signed by the CA
// also, the certificate will be logged within the CA directory.

var sys = require('sys');
var exec = require('child_process').exec;
var fs  = require('fs');
var path = require('path');

var _help = '';
_help += 'USAGE: node gen_client.js [KEYLENGTH] CLIENT_NAME\n';
_help += '\n';
_help += 'KEYLENGTH - the number of bits to use in the RSA key\n';
_help += 'CLIENT_NAME - a name to use for output file naming \n';

// make sure at least 1 arg was supplied
if (process.argv.length < 3) {
  console.error('ERROR: incorrect arguments');
  console.error(_help);
  process.exit(1);
}

// these variables assume no key length was supplied
var keylen = 2048;
var client = process.argv[2];

// handle the args
if (process.argv.length === 4) {
  keylen = process.argv[2];
  client = process.argv[3];
  if (isNaN(keylen)) {
    console.error('ERROR: invalid key length');
    console.error(_help);
    process.exit(1);
  }
}
else {
  console.warn('WARNING: using default RSA key length of 2048');
}

var keyfile = client + '.key';
var csr = client + '.csr';
var crt = client + '.crt';

var genrsaCmd = 'openssl genrsa -out ' + keyfile + ' ' + keylen;

var csrReqCmd = 'openssl req -new -key ' + keyfile + ' ';
csrReqCmd += '-out ' + csr + ' ';
csrReqCmd += '-subj \"/C=US/ST=NY/L=Rochester/O=SSE/CN=*\"';

var caCmd = 'openssl ca -config ' + path.join('CA', 'ca.conf') + ' ';
caCmd += '-batch ';
caCmd += '-in ' + csr + ' ';
caCmd += '-cert ' + path.join('CA', 'ca.crt') + ' ';
caCmd += '-keyfile ' + path.join('CA', 'ca.key') + ' ';
caCmd += '-out ' + crt;

function genCredentials() {
  exec(genrsaCmd, function genRSACB() {
    genReqCmd();
  });
}

function genReqCmd() {
  exec(csrReqCmd, function genReqCB() {
    signCrtCmd();
  });
}

function signCrtCmd() {
  exec(caCmd, function done() {
    cleanup();
  });
}

function cleanup() {
  fs.unlinkSync(csr);
    console.log('done!');
}

genCredentials();
