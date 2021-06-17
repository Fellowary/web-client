#!/usr/bin/env bash

if [ "$(uname)" == "Darwin" ]; then
    security remove-trusted-cert -d rootCA.pem
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    echo "this isn't meant to work on linux, read the README.md"
fi
