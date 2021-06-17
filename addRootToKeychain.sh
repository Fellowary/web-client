#!/usr/bin/env bash

if [ "$(uname)" == "Darwin" ]; then
    security add-trusted-cert -k /Library/Keychains/System.keychain -d rootCA.pem
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    echo "this isn't meant to work on linux, read the README.md"
fi
