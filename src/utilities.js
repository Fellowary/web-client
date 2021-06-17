export function isObjectEmpty(obj) {
	for(var k in obj) return false; //eslint-disable-line
	return true;
}


export function messageIndexSearch(messageArray, messageDate) {
	let left = 0;
	let right = messageArray.length-1;
	while(left < right){
		const mid = left + right >> 1; //eslint-disable-line
    let date;
    let date2;

    if(!messageArray[mid]){date = Number.MIN_SAFE_INTEGER}
    else{
    	date = messageArray[mid].networkReceivedDate || messageArray[mid].receivedDate || messageArray[mid].signedDate;
    }
    
    //  else if(messageArray[mid].networkReceivedDate){date = messageArray[mid].networkReceivedDate;}
		//  else if(messageArray[mid].receivedDate){date = messageArray[mid].receivedDate;}
    //  else{date = messageArray[mid].signedDate;}

    if(!messageArray[mid+1]){date2 = Number.MAX_SAFE_INTEGER}
    else{
    	date2 = messageArray[mid+1].networkReceivedDate || messageArray[mid+1].receivedDate || messageArray[mid+1].signedDate;
    }

    // else if(messageArray[mid+1].networkReceivedDate){date2 = messageArray[mid+1].networkReceivedDate;}
    // else if(messageArray[mid+1].receivedDate){date2 = messageArray[mid+1].receivedDate;}
    // else{date2 = messageArray[mid+1].signedDate;}

		const bigger = messageDate >= date;
		const smaller = messageDate <= date2;

		if (bigger && !smaller){
			left = mid + 1;
		}
		else if (smaller && !bigger){
			right  = mid - 1;
		}
		else{
			return mid;
		}
	}

	return -1;
}


