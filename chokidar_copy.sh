#!/bin/bash

event=$1;
path=$2;
public=$3;
shortpath=$(echo $path | cut -c16-);
medpath=$(echo $path | cut -c8-);
cssname=$(basename $path .scss);
jsname=$(basename $path .js);


if [[ ((${event} = 'change') || (${event} = 'add')) && (${shortpath} == js/*) ]]; then
	echo "js event";
#    if yarn browserify "${path}" -t [ babelify --presets [ @babel/preset-env ] --plugins [ @babel/plugin-proposal-optional-chaining ] ] -o ./public/${shortpath}; then 
    if yarn browserify "${path}" -o ./public/js/${jsname}.js; then 
    	cp ./public/js/${jsname}.js ./build/js/${jsname}.js;
   	fi;
elif [[ ((${event} = 'change') || (${event} = 'add')) && (${shortpath} == css/*) ]]; then
	echo "css event";
	if yarn postcss -c postcss.config.json -o ./public/css/${cssname}.css "${path}"; then
    	cp ./public/css/${cssname}.css ./build/css/${cssname}.css;
	fi;
elif [[ (${event} = 'add') || (${event} = 'change') ]]; then
	echo "other event";
	if cp ${path} ./public/${shortpath}; then
		cp ${path} ./build/${shortpath};
	fi;
else
	echo ${event};
fi;