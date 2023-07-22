
cd "$(dirname "$BASH_SOURCE[0]")"

DOMAIN_NAME="decentfactory.xyz"
COMMON_NAME="*.decentfactory.xyz"

echo "Generating self-signed certificate for: $COMMON_NAME"

cat << EOF > req.conf
[ req ]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no
[ req_distinguished_name ]
C = CA
ST = ON
L = Toronto
O = Factor
OU = Engineering
CN = decentfactory.xyz
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = decentfactory.xyz
DNS.2 = test.decentfactory.xyz
DNS.2 = inkognitos.decentfactory.xyz
EOF

openssl req \
  -x509 \
  -nodes \
  -days 3650 \
  -newkey rsa:4096 \
  -keyout "${DOMAIN_NAME}.key" \
  -out "${DOMAIN_NAME}.crt" \
  -config req.conf \
  -extensions 'v3_req'

openssl x509 \
  -in "${DOMAIN_NAME}.crt" -noout -text

openssl dhparam \
  -out "${DOMAIN_NAME}.dhparam.pem" \
  2048

echo "Done!"

rm -f  req.conf