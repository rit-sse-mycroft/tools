#! /bin/bash
#
# gen_ca.sh
# 
# USAGE: bash gen_ca.sh [KEYLENGTH]
#
# KEYLENGTH - number of bits in the RSA key to generate
#
# This script will create the directory ./CA as an openssl certificate
# authority. The CA's key file is stored in CA/ca.key, and the CA's
# self-signed certificate is stored in CA/ca.crt

CAROOT=./CA

keylen=$1;

# use default key length if none supplied
if [ -z "$1" ]
then
  echo "WARNING: Using default key length 2048";
  keylen=2048;
fi

mkdir -p ${CAROOT}/ca.db.certs   # Signed certificates storage
touch ${CAROOT}/ca.db.index      # Index of signed certificates
echo 01 > ${CAROOT}/ca.db.serial # Next (sequential) serial number

# Configuration
cat>${CAROOT}/ca.conf<<'EOF'
[ ca ]
default_ca = ca_default

[ ca_default ]
dir = CA
certs = $dir
new_certs_dir = $dir/ca.db.certs
database = $dir/ca.db.index
serial = $dir/ca.db.serial
RANDFILE = $dir/ca.db.rand
certificate = $dir/ca.crt
private_key = $dir/ca.key
default_days = 3650
default_crl_days = 30
default_md = sha
preserve = no
policy = generic_policy
[ generic_policy ]
countryName = optional
stateOrProvinceName = optional
localityName = optional
organizationName = optional
organizationalUnitName = optional
commonName = supplied
emailAddress = optional
EOF

# generate new self-signed key/cert (valid for 10 years)
openssl req -new -newkey rsa:$keylen -days 3650 -nodes -x509 \
        -subj "/C=US/ST=New York/L=Rochester/O=SSE/CN=mycroft" \
        -keyout ${CAROOT}/ca.key  -out ${CAROOT}/ca.crt > /dev/null 2> /dev/null;
