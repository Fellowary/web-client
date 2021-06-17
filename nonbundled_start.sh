#!/bin/bash

set -e

path=$1;
path2=$2;

# for filename in $(find ${path} -name '*.js'); do echo ${path2}$(basename ${filename}); done;
for filename in $(find ${path} -name '*.js');
do
	yarn browserify ${filename} -o ${path2}$(basename ${filename}) & 
done;

wait
echo "Finished nonbundled Start"