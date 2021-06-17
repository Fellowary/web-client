#!/usr/bin/env bash
openssl req -new -sha256 -nodes -out fellowary.local.csr -newkey rsa:2048 -keyout fellowary.local.key -config <( cat fellowary.local.cnf )

openssl x509 -req -in fellowary.local.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out fellowary.local.crt -days 500 -sha256 -extfile v3.ext

openssl x509 -in fellowary.local.crt -out fellowary.local.cert.pem -outform PEM

# change the keys into the name and formats that the test server requires
openssl rsa -in fellowary.local.key -text > key.pem
mv fellowary.local.cert.pem cert.pem
