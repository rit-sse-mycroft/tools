#! /bin/bash
# 
# Generates client keyfiles/certs for mycroft
#
# USAGE: bash gen_client.sh [KEYLENGTH] CLIENT_NAME
# 
# KEYLENGTH  - number of bits in the RSA key, default 2048
# 
# NOTE: this script expects a CA to already exist from running gen_ca.sh
#
# This script generates exactly one key/certificate for a mycroft client.
# The following files are output:
#   CLIENT_NAME.key - a keyfile
#   CLIENT_NAME.crt - a certificate signed by the CA
# also, the certificate will be logged within the CA directory.

# make sure >= 1 args are supplied

if [ $# -lt 1 ]
then
  echo "ERROR: incorrect args";
  echo "USAGE: gen_client.sh [KEYLENGTH] CLIENT_NAME";
  exit 1;
fi

# these both assume no keylength is supplied
keylen=2048;
name=$1;

if [ $# -ne 2 ] # if we are using default keylength
then
  echo "WARNING: using default key length of 2048";
else
  # fix the assumed variables
  keylen=$1;
  name=$2;
fi

keyfile="$name.key";
csr="$name.csr";
crt="$name.crt";
openssl genrsa -out $keyfile $keylen;
openssl req -new -key $keyfile -out $csr \
            -subj "/C=US/ST=NY/L=Rochester/O=SSE/CN=*";
openssl ca -config CA/ca.conf \
           -batch \
           -in $csr \
           -cert CA/ca.crt \
           -keyfile CA/ca.key \
           -out $crt;
rm $csr;

echo "Done";
