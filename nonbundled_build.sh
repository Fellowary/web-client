#!/bin/bash
set -e
system_name=$(uname -s)
path=$1;
path2=$2;
arr=()

for filename in $(find ${path} -name '*.js');
do 
	yarn browserify ${filename} -o ${path2}$(basename ${filename}) && 
	yarn terser ${path2}$(basename ${filename}) --compress pure_funcs=['log','warn'] \
	--mangle reserved=["msData"] -o ${path2}$(basename ${filename}) & 
done;

wait
if [[ ${system_name} == "Darwin" ]]; then
	sed -i '' -E 's/window\.testing=!0;/window.testing=0;/g' ${path2}/definitions.js;
else
	sed -i 's/window\.testing=[\!\d+]+;/window.testing=0;/g' ${path2}/definitions.js;
fi
echo "Finished the nonbundled production build.  This doesn't check for errors.  inspect the above output just in case."