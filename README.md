Tools
=====

This repository contains tools for the Mycroft system.

- Manifest validator
- Mock server
- Mock app
- Certificate management

Feel free to add more useful tools.

Key generation
--------------
To set up the mock app and server, run `node setup_keys.js`. This script will
create a Certificate Authority and keys for setting up secure socket
connections. Certificate requires that [OpenSSL](http://www.openssl.org/) is
available on the system path.
