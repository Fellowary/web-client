
var pubkeydiv = document.getElementById("public_key_div");
var privkeydiv = document.getElementById("private_key_div");
var message_request_div = document.getElementById("request_div");
var content_script_response_div = document.getElementById("response_div");
var backend_script_response_div = document.getElementById("response_div");
var message_response_div = document.getElementById("response_div");
var server_request_div = document.getElementById("server_request_div");
var server_response_div = document.getElementById("server_response_div");
var sent_request_div = document.getElementsByClassName("inner_sent")[0];
var received_request_div = document.getElementsByClassName("inner_received")[0];

function messageBackend(msg, payload){
    var sending = browser.runtime.sendMessage({
        reason: msg,
        payload: payload
    });
    sending.then(handleMessage, backendError);
}

function backendResponse(message){
    //console.log(`Message from the background script: ${message.payload}`);
    switch(message["reason"]){
        case "backend_response":
            sreqdiv.innerHTML = `<p>${message["payload"]}</p>`;
            break;
    }
}

function backendError(error){
    console.log(`Error: ${error}`);
}

function clearNode(inode){
    while(inode.firstChild){
        inode.removeChild(inode.firstChild);
    }
}

function vouch(){
    console.log(this.getAttribute("data-key"));
    messageBackend("vouch", {fingerprint: this.getAttribute("data-key")});
}

function grantAccess(){
    console.log(this.getAttribute("data-key"));
    messageBackend("grant_access", {fingerprint: this.getAttribute("data-key")});
}

function checkResponse(){
    console.log(this.getAttribute("data-key"));
    messageBackend("check_response", {fingerprint: this.getAttribute("data-key")});
}

function checkForAccess(){
    console.log(this.getAttribute("data-key"));
    messageBackend("check_for_access_response", {fingerprint: this.getAttribute("data-key")});
}

function requestAccess(){
    console.log(this.getAttribute("data-key"));
    messageBackend("request_access", {fingerprint: this.getAttribute("data-key")});
}

function showAccessRequests(sent, received){
    clearNode(sent_request_div);
    clearNode(received_request_div);
    for (const key of Object.keys(sent)) {
        console.log(key, sent[key]);
        let sent_block =   `<div class="sent_block">
                            <div class="request_date">Date: ${sent[key].request_time}</div>
                            <div class="request_date">Request Type: ${sent[key].request_type}</div>
                            <div class="user_info">
                                <div class="circle">Circle: ${sent[key].circle_name ? `${sent[key].circle_name}` : "Unknown"}</div>
                                <div class="fingerprint">Fingerprint: ${sent[key].circle_fingerprint ? `${sent[key].circle_fingerprint}` : "Unknown"}</div>
                                <div class="public_key">Public Key: ${sent[key].circle_key ? `${sent[key].circle_key}` : "Unknown"}</div>
                                <div class="voucher">Voucher: ${sent[key].voucher_name ? `${sent[key].voucher_name}` : "Unknown"}</div>
                                <div class="fingerprint">Fingerprint: ${sent[key].voucher_fingerprint ? `${sent[key].voucher_fingerprint}` : "Unknown"}</div>
                                <div class="public_key">Public Key: ${sent[key].voucher_key ? `${sent[key].voucher_key}` : "Unknown"}</div>
                                <div class="user">User: ${sent[key].user_object.username}</div>
                                <div class="fingerprint">Fingerprint: ${sent[key].user_object.fingerprint}</div>
                                ${sent[key].signature ? `<div class="signature">Signature: ${sent[key].signature}</div>` : ''}
                                <div class="public_key">Public Key: ${sent[key].user_object.publicKey}</div>
                                <div class="private_key">Private Key: 
                                    <span class="default_hidden">${sent[key].user_object.privateKey}</span>
                                </div>
                            </div>
                            <button data-key="${key}" class="retry_request">Retry Request</button>
                            ${sent[key].user_object.signature ? `<button data-key="${key}" class="check_access_button">Check For Access</button>` : `<button data-key="${key}" class="check_response_button">Check For Response</button>`}
                            ${sent[key].user_object.signature ? `<button data-key="${key}" class="access_request_button">Request Access</button>` : ''}                            
                            </div>`;
        sent_request_div.insertAdjacentHTML('beforeend', sent_block);
    }
    let check_response_buttons = document.getElementsByClassName("check_response_button");
    for (let i=0;i<check_response_buttons.length;i++){
        check_response_buttons[i].addEventListener("click", checkResponse);
    }
    let check_access_buttons = document.getElementsByClassName("check_access_button");
    for (let i=0;i<check_access_buttons.length;i++){
        check_access_buttons[i].addEventListener("click", checkForAccess);
    }
    let request_access_buttons = document.getElementsByClassName("access_request_button");
    for (let i=0;i<request_access_buttons.length;i++){
        request_access_buttons[i].addEventListener("click", requestAccess);
    }

    let circle_requested = 0;
    let vouch_requested = 0;
    for(const key of Object.keys(received)) {
        if (received[key].request_type == "access_request"){
            circle_requested++;
        }
        if (received[key].request_type == "vouching"){
            vouch_requested++;
        }
        console.log(key, received[key]);
        let received_block =   `<div class="received_block">
                                <div class="request_date">Date: ${received[key].request_time}</div>
                                <div class="user_info">
                                    <div class="circle_name">Circle Name: ${received[key].circle.identifier.username}</div>
                                    <div class="fingerprint">Fingerprint: ${received[key].circle.identifier.fingerprint}</div>
                                    <div class="public_key">Public Key: ${received[key].circle.identifier.publicKey}</div>
                                    <div class="private_key">Private Key: ${received[key].circle.identifier.privateKey}</div>
                                    <div class="voucher">Circle User: ${received[key].circle.user.username}</div>
                                    <div class="fingerprint">Fingerprint: ${received[key].circle.user.fingerprint}</div>
                                    <div class="public_key">Public Key: ${received[key].circle.user.publicKey}</div>
                                    <div class="private_key">Private Key: ${received[key].circle.user.privateKey}</div>
                                    <div class="user">Requester: ${received[key].user_object.fingerprint}</div>
                                    <div class="fingerprint">Fingerprint: ${received[key].user_object.fingerprint}</div>
                                    <div class="public_key">Public Key: ${received[key].user_object.public_key}</div>
                                </div>
                                ${received[key].request_type == "access_request" ? `<button data-key="${key}" class="grant_access">Grant Access</button>` :
                                                                `<button data-key="${key}" class="vouch">Vouch</button>`}
                                </div>`;
        received_request_div.insertAdjacentHTML('beforeend', received_block);
    }
    let grant_buttons = document.getElementsByClassName("grant_access");
    for (let i=0;i<grant_buttons.length;i++){
        grant_buttons[i].addEventListener("click", grantAccess);
    }
    let vouch_buttons = document.getElementsByClassName("vouch");
    for (let i=0;i<vouch_buttons.length;i++){
        vouch_buttons[i].addEventListener("click", vouch);
    }
    if (circle_requested>1){
        received_request_div.insertAdjacentHTML('beforeend', `<button id="grant_all_access">Grant Access For All</button>`);
    }
    if (vouch_requested>1){
        received_request_div.insertAdjacentHTML('beforeend', `<button id="vouch_for_all">Vouch For All</button>`);
    }
}

function handleMessage(message, sender, sendResponse){
    //console.log(message);
    //console.log(sender);
    if (typeof message === 'undefined'){
        console.log("no message returned"); 
        return;
    }
    switch(message["reason"]){
        case "message_request":
            message_request_div.innerHTML = `<p>${message["payload"]}</p>`;
            break;
        case "content_script_message":
            //content_script_request_div.innerHTML = `<p>${JSON.stringify(message["payload"])}</p>`;
            console.log("the payload: ", message['payload']);
            break;
        case "backend_script_message":
            backend_script_response_div.innerHTML = `<p>${JSON.stringify(message["payload"])}</p>`;
            break;
        case "local_access_requests":
            showAccessRequests(message.sent, message.received);
            break;
        case "server_request":
            server_request_div.innerHTML = `<p>${message["payload"]}</p>`;
            break;
        case "server_response":
            server_response_div.innerHTML = `<p>${message["payload"]}</p>`;
            break;
        default:
            console.log(`handling message reason: ${message["reason"]}`);
    }
}


browser.runtime.onMessage.addListener(handleMessage);

document.getElementById("sign_up").addEventListener("click", () => {
    let name = document.getElementById("user_name").value;
    console.log(name);
    let password = document.getElementById("password").value;
    console.log(password);
    messageBackend("sign_up", {username: name, password: password});
});

document.getElementById("sign_in").addEventListener("click", () => {
    let name = document.getElementById("user_name").value;
    console.log(name);
    let password = document.getElementById("password").value;
    console.log(password);
    messageBackend("sign_in", {username: name, password: password});
});

document.getElementById("sign_up_outsider").addEventListener("click", () => {messageBackend("sign_up_outsider")});
//document.getElementById("get_user_key").addEventListener("click", () => {messageBackend("get_user_key")});
document.getElementById("get_friend_keys").addEventListener("click", () => {messageBackend("get_friend_keys")});
document.getElementById("get_outsider_keys").addEventListener("click", () => {messageBackend("get_outsider_keys")});
/*document.getElementById("get_fingerprint").addEventListener("click", () => {
    let pubkey = document.getElementById("test_text").value.replace(/\\r/g, "\r").replace(/\\n/g, "\n");
    console.log(pubkey);
    messageBackend("get_fingerprint", {public_key: pubkey});
});
*/
document.getElementById("create_circle").addEventListener("click", () => {
    let user_name = document.getElementById("circle_user_name").value;
    let circle_name = document.getElementById("circle_name").value;
    let circle_description = document.getElementById("circle_description").value;
    messageBackend("create_circle", {circle_name: circle_name, circle_user_name: user_name, circle_description: circle_description});
});

document.getElementById("get_circles").addEventListener("click", () => {
    messageBackend("get_circles");
});

document.getElementById("request_vouch").addEventListener("click", () => {
    let insider = document.getElementById("circle_fingerprint").value;
    messageBackend("request_vouch", {insider_id: insider});
});
document.getElementById("check_for_vouch_request").addEventListener("click", () => {
    let outsider = document.getElementById("circle_requester_fingerprint").value;
    console.log(outsider);
    messageBackend("check_for_vouch_request", {requester_fingerprint: outsider});
});
document.getElementById("check_for_access_requests").addEventListener("click", () => {
    messageBackend("check_for_access_requests");
});

document.getElementById("remove_from_circle").addEventListener("click", () => {messageBackend("remove_from_circle")});

document.getElementById("get_signatures").addEventListener("click", () => {messageBackend("get_signatures")});

function sendMessageToTabs(tabs) {
    console.log(tabs);
    for (let tab of tabs) {
        let frames = browser.webNavigation.getAllFrames({tabId: tab.id});
        //console.log(frames);
        browser.tabs.sendMessage(
          tab.id,
          {
            reason: "inject_upload",
            }
        );
        break;
    }
}

document.getElementById("upload_files").addEventListener("click", () => {
    /**/
    //messageBackend("upload_file")


    console.log("got click");
    browser.management.getSelf()
    browser.tabs.query({
        currentWindow: true,
        active: true
    }).then(sendMessageToTabs);

    //browser.tabs.sendMessage({reason: 'inject_upload'});
});
document.getElementById("upload_text").addEventListener("click", () => {
    browser.tabs.query({
        currentWindow: true,
        active: true
    }).then((tabs) => {
        for (let tab of tabs){
            browser.webNavigation.getAllFrames({
                tabId: tabs[0].id
            }).then((framesInfo) =>{
                for (frameInfo of framesInfo){
                    console.log(frameInfo);
                }
            });
        }
    });
    messageBackend("upload_text");
});
document.getElementById("get_link").addEventListener("click", () => {messageBackend("get_link")});
document.getElementById("search").addEventListener("click", () => {messageBackend("search")});
document.getElementById("remove_config").addEventListener("click", () =>{messageBackend("remove_config")});
messageBackend("last_message");
//messageBackend("get_local_access_requests");
//messageBackend("get_local_messages");

//browser.downloads.showDefaultFolder();
