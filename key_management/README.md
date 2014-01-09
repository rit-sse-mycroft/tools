# Key Management

This directory contains bash scripts for managing TLS keyfiles.

## Certificate Authority

Mycroft is a Certificate Authority (CA), which can issue and sign certificates
for clients to use. Use the `gen_ca.js` script to create a new CA. The CA's
files are stored in a new directory, `CA`.

## Signing new certificates

Once a CA is created keyfiles / certificates can be generated and signed.
Use `gen_client.js` to create a new set of credentials.

## Requirements

This script requires `openssl` on the path.

## Module Usage

Both the `gen_ca.js` and `gen_client.js` scripts can be loaded and used as
modules. `gen_ca.js` exposes the `ensureCAExists(keylen, dir)` function and the
`gen_client.js` exposes the `genClientCredentials(keylen, clientName, dir)`
function.
