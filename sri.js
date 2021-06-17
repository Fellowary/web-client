const fs = require('fs');
const HTMLParser = require('node-html-parser');
const {createHash} = require('crypto');
let parse = HTMLParser.parse;

let inputhtml = fs.readFileSync('deploy/index.html')
let root = parse(inputhtml);

let scripts = root.querySelectorAll('script');



function hashFile(fileName){
	let inputFile = fs.readFileSync(`deploy/${fileName}`);
	let hash512 = createHash('sha512');
	hash512.update(inputFile);
	let outputHash = hash512.digest('base64');
	return outputHash;
}



for(let script of scripts){
	let src = script.getAttribute('src');
	if(!src){
		console.log("Skipping a hashing, the src doesn't exist");
		continue;
	}

	console.log(`Hashing ${src}`);
	let hash = hashFile(src);

	script.setAttribute('integrity', `sha512-${hash}`);
}


let deployableHtml = root.toString();

fs.writeFileSync('deploy/index.html', deployableHtml);
console.log("Finished producing subresource integrity hashes and incorporating them into index.html");