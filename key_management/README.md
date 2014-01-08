# Key Management

This directory contains bash scripts for managing TLS keyfiles.

## Certificate Authority

Mycroft is a Certificate Authority (CA), which can issue and sign certificates
for clients to use. Use the `gen_ca.sh` script to create a new CA. The CA's
files are stored in a new directory, `CA`.

## Signing new certificates

Once a CA is created keyfiles / certificates can be generated and signed.
Use `gen_client.sh` to create a new set of credentials.

## Requirements

This script requires `openssl`.
