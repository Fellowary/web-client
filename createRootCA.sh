#!/usr/bin/env bash
mkdir ~/ssl/
openssl genrsa -des3 -out rootCA.key 2048
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1024 -out rootCA.pem
openssl x509 -outform der -in rootCA.pem -out rootCA.crt
