(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){

let utils = window.utils;
let path = window.path;
let User = window.User;
let Config = window.Config;
let Identity = window.Identity;
let Circle = window.Circle;
let CircleData = window.CircleData;
// let db = window.db;
var cm = {};
const log = console.log;

async function getUsernameInternal(username){
  return (await utils.textToSHA512Str(username)).substring(0, 20);
}

cm.createUser = async function(username, password){
  log("createUser", username, password);
	const iUsername = await getUsernameInternal(username);
  log("creating the user");
  let userID = false;

  try{
    userID = await db.logins.get({filepath: iUsername});
  }
  catch(e){
    log("user doesn't exist, creating it.");
  }

  if (userID){
    // log("The User already exists");
    throw new Error("The user already exists");
  }
  else{
    // log("the user doesn't exist, creating it.");
  }

  let salt = await salty.randomString(5);
  let passObj = {
    salt: salt,
    hash: await utils.textToSHA512Str(salt+password),
    internalPassword: await salty.randomString(16),
    testValue: '加油'
  };

  passBuffer = utils.textToBytes(JSON.stringify(passObj));
  userID = await db.logins.add({filepath: iUsername, data: passBuffer});  // can throw error, we want it to.
  if (userID) {
	  // log("created userInfo");
		return true;
  }
  else{
    // log("user wasn't created");
  }

  // log("user creation error", e);
	return false;
};

cm.getUser = async function(username, password){
  const iUsername = await getUsernameInternal(username);

  let loginData = await db.logins.get({filepath: iUsername});
  if (loginData === undefined){
    throw new Error("the user doesn't exist");
  }
  let passBuffer = loginData.data;
	if(passBuffer) {
	  log("password file exists");
	}
  else{
    log("password file doesn't exist");
    throw new Error("user doesn't exist");
  }
  log("checking hash");

  let passObj = utils.bytesToObject(passBuffer);

  if (passObj.hash == await utils.textToSHA512Str(passObj.salt+password)){
    window.messageStreams = {};
    window.conversations = {};
    window.activeConversations = {};
    window.keyPersona = {};
    window.invites = {};
    log("the password is correct");
    await cm.loadUser(username, iUsername, passObj);
    log("before loadconfig");
    let loadingConfig = cm.loadConfig();
    log("before loadingIdentities");
    let loadingIdentities = cm.loadIdentities();
    let loadingCircles = cm.loadCircles();
    let loadingPersonae = cm.loadPersonae();
    let loadingPersonaeStructs = cm.loadPersonaeStructs();
    let loadingPageHistory = cm.loadPageHistory();

    log("getUser - before loadingConfig await");
    await loadingConfig;
    log("getUser - before loadingIdentities await");
    await loadingIdentities;
    log("getUser - before loadingCircles await");
    await loadingCircles;

    log("getUser - before loadingPersonae await");
    await loadingPersonae;

    log("getUser - before loadingPersonaeStructs await");
    await loadingPersonaeStructs;
    Conversation.openAll();// no need to wait for this one

    await loadingPageHistory;

    cm.loadCircleDatae();

    
    log("getUser - before return true");
    return true;
  }

	throw new Error("permission denied");
};


cm.loadCircleDatae = function(){
  // log("in loadcircledatae");
  window.circleDatae = {};
  for (let filePath in window.identities){
    window.circleDatae[filePath] = {};
  }
};

cm.loadConfig = async function(){
  // log("loading config", window.user.config);
  let config = await Config.load(window.user.config);
  //window.config = config;
};


cm.loadCircles = async function(){
  // log("loadCircles");
  let circles = Circle.bulkLoad(window.user.circles);
  // log("loadCircles after bulkLoad");
  window.circles = await circles;
  // log("loadCircles - window.circles", window.circles);
  let circleTable = {};
  for(let filePath in window.circles){
    circleTable[window.circles[filePath].fingerprint] = filePath;
  }
  window.circleTable = circleTable;
};

cm.loadIdentities = async function(){
  // log("inloadidentities");
  let identities = Identity.bulkLoad(window.user.identities);
  window.identities = await identities;
  // log("loadidentities, window.identities", window.identities);
  let identityTable = {};
  for(let filePath in window.identities){
    identityTable[window.identities[filePath].fingerprint] = window.identities[filePath].filePath;
  }
  window.identityTable = identityTable;
  // log("loadIdentities: window.identityTable", window.identityTable);
};

cm.loadPersonae = async function(){
  // log("inloadpersonae");
  let personae = Persona.bulkLoad(window.user.personae);
  window.personae = await personae;
  // log("personae, window.personae", window.personae);
  let personaTable = {};
  for(let filePath in window.personae){
    personaTable[window.personae[filePath].fingerprint] = window.personae[filePath].filePath;
  }
  window.personaTable = personaTable;
  // log("loadpersonae: window.personaTable", window.personaTable);
};

cm.loadPersonaeStructs = async function(){
  // log("inloadpersonaestructs");
  let personaeStructs = PersonaeStruct.bulkLoad(window.user.personaeStructs);
  window.personaeStructs = await personaeStructs;
}

cm.loadPageHistory = async function(){
  let currentPage = PageHistory.load(window.user.currentPage);
  window.currentPage = await currentPage;
}

cm.bootStrapConfig = function(iPassword){
  window.config = {};
  window.config.localPassword = iPassword;
};

cm.bootStrapUser = function(iPassword){
  window.user = {};
  window.user.localPassword = iPassword;
};

cm.loadUser = async function(username, iUsername, passObj){
  // log('loading user with internal password:', passObj.internalPassword);
  cm.bootStrapUser(passObj.internalPassword);
  let user = await User.load(iUsername);
  // log("the user", user);
  if (user === false){
    // log("user config doesn't exist, setting it up");
    user = await cm.setUpNewUser(username, iUsername, passObj);
    // window.user is set inside;
  }
  else{
    // log("setting window.user to ", user);
    window.user = user;
  }
};

cm.setUpNewUser = async function(username, internalUsername, passObj, useName=''){
  // log(`setting up new user`, username);
  //cm.bootStrapUser(passObj.internalPassword);
  let userKeys = await salty.createKeyPair(internalUsername);
  let userFingerprint = await salty.getFingerprint(userKeys.publicKey);
  let userAvatar = await utils.getIdenticon(userFingerprint);
  let userConfig = new Config();
  await userConfig.save();
  window.config = userConfig;
  window.personae = {};
  window.personaTable = {};
  window.personaeStructs = {};

  // log("setUpNewUser, - before identity");
  let identityName = useName ? username : await utils.getRandomName();
  let personae = new PersonaeStruct();
  // log("setUpNewUser, after new PersonaeStruct");
  await personae.save();
  window.personaeStructs[personae.filePath] = personae;

  // log('setupnewuser - creating persona with useName, identityName', useName, identityName);
  let persona = await Persona.create(identityName, 'core', personae.filePath);

  // log("setUpNewUser, personae", personae);
  personae.core = persona.filePath;
  await personae.save();
  let identity = new Identity(filePath=undefined,
                              corePersona=persona,
                              in_personae=personae.filePath);

  // log("setUpNewUser - before circle");
  let circleName = await utils.getRandomOrganization();
  let circlePersonae = new PersonaeStruct(); //await PersonaeStruct.create(circleName);
  await circlePersonae.save();

  window.personaeStructs[circlePersonae.filePath] = circlePersonae;
  let circlePersona = await Persona.create(circleName, 'core', circlePersonae.filePath);
  circlePersonae.core = circlePersona.filePath;

  await circlePersonae.save();
  let circle = new Circle(filePath=undefined,
                          corePersona=circlePersona,
                          in_personae=circlePersonae.filePath,
                          admins=[identity.fingerprint]
                          );
  await circle.save();
  identity.primaryCircle = circle.filePath;

  await identity.save();

  persona.setOwner(identity);
  persona.save();
  circlePersona.setOwner(circle);
  circlePersona.save();

  let circleFillPromise = cm.fillPersonae(circle);

  let identityData = new CircleData(filePath=undefined,
                                  circleFilePath=null,
                                  identityFilePath=identity.filePath);
  await identityData.save();

  let circleData = new CircleData(filePath=undefined,
                                  circleFilePath=circle.filePath,
                                  identityFilePath=identity.filePath);
  await circleData.save();

  // this is for the identity itself.  it doesn't change.
  identity.circleData[null] = identityData.filePath;

  // default circle.  it can change
  identity.circleData[circle.filePath] = circleData.filePath;

  // log("setUpNewUser - before last identitySave");
  await identity.save();
  window.circleDatae = {};
  window.circleDatae[identity.filePath] = {};
  window.circleDatae[identity.filePath][circle.filePath] = circleData;


  await cm.fillPersonae(identity);
  await circleFillPromise;

  log("before createAllSigils");
  // this creates all of the sigiles required for each specific persona purpose
  // this is async but no need to await, they're used upon user actions, not before
  circle.createAllSigils(identity, isAdmin=true);

  log("before newDirectory")
  let homeDirectory = new Directory(parentDirectory=null, name='home');
  await homeDirectory.save();


  // log("*******window.config", window.config);
  let user = new User(filePath=internalUsername,
                      usersConfig=window.config.filePath,
                      username=username,
                      internalUsername=internalUsername,
                      primaryIdentity=identity.filePath,
                      identities=[identity.filePath],
                      circles=[circle.filePath],
                      personae=[], // Persona filepaths, this records the window.personae on every user.save
                      inPersonaeStructs=[], // PersonaeStruct filepaths
                      homeDirectory=homeDirectory.filePath,
                      publicKey=userKeys.publicKey,
                      privateKey=userKeys.privateKey,
                      fingerprint=userFingerprint,
                      avatar=userAvatar.src,
                      localPassword=passObj.internalPassword);
  // log("*******window.config", window.config, user, window.user, window.personae);
  log("before userSave");
  user = await user.save();
  window.user = user;
  log("after user save");
  let firstConversation = await circle.createConversation("general", "publicCircleMessaging", identity);
  log("after first conversation");
  await window.user.setCurrentPage(`#/social/identity/${firstConversation.identityFingerprint}/circle/${firstConversation.coreCircleFingerprint}/convo/${firstConversation.otherPartyFingerprint}`);
  window.user.save();
};

cm.setPrimaryIdentity = async function(fingerprint){
  if(window.identityTable[fingerprint] === undefined){
    throw Error("The identity doesn't exist");
  }
  window.user.primaryIdentity = window.identityTable[fingerprint];
  const identity = window.identities[window.user.primaryIdentity];
  window.user.primaryCircle = identity.getPrimaryCircle();
  window.user = await window.user.save();
  return window.user;
};

cm.createPersona = async function(name, type='core', personaeStructFilePath=''){
  let identityName = name.length > 0? name: await utils.getRandomName();

  return Persona.create(identityName, type, personaeStructFilePath);
};

cm.fillPersonae = async function(dataObject, config = null){
  log("fillPersonae", dataObject);

  let personaeFilePath = dataObject.personae;
  let updated = false;
  let personaeStruct = await PersonaeStruct.load(personaeFilePath);
  let corePersona = window.personae[personaeStruct.core];

  // set up the personaObjects
  let personaObjects = [];
  for(let personaType in personaeStruct){
    if(personaType === 'external'
      || !PERSONA_TYPES.includes(personaType)
      || personaeStruct[personaType] !== null
    ){continue;}

    // there's work to be saved in the user after all of this
    updated = true;
    const personaObject = {
      name: corePersona.name,
      type: personaType,
      personaeStructFilePath: personaeFilePath,
      internal: true,
      ownerType: dataObject.typeName,
      ownerFilePath: dataObject.filePath
    };

    personaObjects.push(personaObject);
  }

  // bulk create the personae
  let personae = await Persona.bulkCreate(personaObjects);
  for(let persona of personae){
    personaeStruct[persona.type] = persona.filePath;

  }

  personaeStruct.save();
  window.personaeStructs[personaeStruct.filePath] = personaeStruct;
  if(updated){
    if(window.user && window.user.save){
      // saving the user saves ALL of the personae;
      await window.user.save();
    }
  }
}

// cm.fillPersonae = async function (dataObject, config = null){
//   // dataObject is either an Identity or Circle

//   // personae must have at least core persona for this function to work
//   // log("filling personae, dataObject:", dataObject);
//   let personaeFilePath = dataObject.personae;
//   let updated = false;
//   let personae = await PersonaeStruct.load(personaeFilePath);

//   let corePersona = window.personae[personae.core];
//   let personaPromises = {};

//   // log("fillpersonae before first personae loop: personae", personae);
//   // start creating a persona for each one that doesn't exist already
//   for(let personaType in personae){
//     if (personaType === 'external'){continue;}

//     if (!PERSONA_TYPES.includes(personaType)){
//       continue;
//     }
//     if (personae[personaType] === null ){
//       // kick off async tasks
//       if (config){
//         // the last argument, 'config' doesn't actually do anything right now.  I might remove it.
//         personaPromises[personaType] = cm.createPersona(corePersona.name, personaType, personae.filePath, config[personaType]);
//       }
//       else{
//         personaPromises[personaType] = cm.createPersona(corePersona.name, personaType, personae.filePath);
//       }
//     }
//   }

//   // log("fillpersonae before second personae loop");
//   // get each persona, shove it in the personae and personaTable if it's new.
//   for(let personaType in personae){
//     if (personaType === 'external'){continue;}

//     if (!PERSONA_TYPES.includes(personaType)){
//       continue;
//     }

//     let persona = {};
//     if (personae[personaType] === null ){
//       updated = true;
//       // The persona doesn't exist. so we should have a promise for it now
//       // Add it to window.personae and identity.personae
//       persona = await personaPromises[personaType]; //collect the persona from the promise

//       persona.setOwner(dataObject);
//       persona.save();
//       personae[personaType] = persona.filePath;
//     }
//   }

//   // log("fillpersonae before personae save", personae);
//   // just the in scope local PersoneStruct save
//   await personae.save();
//   window.personaeStructs[personae.filePath] = personae;
//   if (updated){
//     // log("saving persona and personae", personae);
//     // This saves the window.personae to the user
//     if (window.user.save){
//       await window.user.save();
//     }
//   }
// };

cm.getPersonaePublicKeys = async function(identity){
  let ppkeys = {};
  await cm.fillPersonae(identity);

  let personae = identity.getPersonae();

  for(let personaType in personae){
    if (!PERSONA_TYPES.includes(personaType)) {
      continue;
    }
    let persona = window.personae[personae[personaType]];

    ppkeys[personaType] = {
      publicKey: persona.publicKey,
      voucherSignature: '',
      circleSignature: ''
    };
  }
  return ppkeys;
};

cm.createIdentity = async function(name=''){
  // creates an identity and creates a primary circle to go with it.
  let inName = name.length > 0? name: await utils.getRandomName();
  let personae = new PersonaeStruct();
  await personae.save();
  let persona = await Persona.create(inName, 'core', personae.filePath);
  personae.core = persona.filePath;
  // log("createIdentity persona");
  let identity = new Identity(filePath=undefined,
                              corePersona=persona,
                              in_personae=personae.filePath);

  let circleName = await utils.getRandomName();
  await identity.save();

  let circle = await cm.createCircle(circleName, identity);
  //await Circle.createLocalCircle([identity.fingerprint]); // this static method simply takes an array of admins to add to a brand new circle
  identity.primaryCircle = circle.filePath;


  persona.setOwner(identity);

  await persona.save();
  await personae.save();

  window.personaeStructs[personae.filePath] = personae;

  // log("createIdentity, personae, persona, window.personaTable, window.personae, window.personaeStructs", personae, persona, window.personaTable, window.personae, window.personaeStructs);

  // for the identity itself
  // why does this exist?....TODO, remember.
  let identityData = new CircleData(filePath=undefined,
                                    circleFilePath=null,
                                    identityFilePath=identity.filePath);
  await identityData.save();

  // for the primary circle
  let circleData = new CircleData(filePath=undefined,
                                  circleFilePath=identity.primaryCircle,
                                  identityFilePath=identity.filePath);
  await circleData.save();

  identity.circleData[null] = identityData.filePath;
  identity.circleData[identity.primaryCircle] = circleData.filePath;

  await identity.save();
  window.circleDatae[identity.filePath] = {};
  window.circleDatae[identity.filePath][circleData.circleFilePath] = circleData;

  await cm.fillPersonae(identity);
  await cm.fillPersonae(circle);

  log("createIdentity - after personaeFill");
  window.identities[identity.filePath] = identity;
  // log("createIdentity - identityFingerprint", identity.fingerprint);
  window.identityTable[identity.fingerprint] = identity.filePath;
  window.user.identities.push(identity.filePath);

  circle.createAllSigils(identity, isAdmin=true);

  await window.user.save();
  log("createIdentity - after user save");
  let firstConversation = await circle.createConversation("general", "publicCircleMessaging", identity);
  log("createIdentity after conversation");
  return {
    identityName: identity.name,
    identityFingerprint: identity.fingerprint,
    circleFingerprint: circle.fingerprint,
    otherPartyFingerprint: firstConversation.otherPartyFingerprint,
  };
  // log("after struct", structure);
  // return structure;
};

cm.createCircleData = async function(
                              filePath=undefined,
                              identityFilePath=undefined,
                              circleFilePath=undefined){
  // log("createCircleData - starting")
  if (identityFilePath === undefined)
    throw Error("creating circleData requires an identity filepath");
  if (circleFilePath === undefined)
    throw Error("creatig circleData requires a circle filepath");

  let circleData = new CircleData(filePath=filePath,
                                  identityFilePath=identityFilePath,
                                  circleFilePath=circleFilePath);
  await circleData.save();
  return circleData;
};

cm.createCircle = async function(name='', identity, config){
  let circle;
  if (config){ // this isn't implemented yet.  make sure config provides Persona.create with the proper keypair
    // log("createCircle - creating 3rd party circle");
    // This is a 3rd party circle.  Import the circle data from the provided config
    let circlePersonae = new PersonaeStruct();
    await circlePersonae.save();
    let circlePersona = await Persona.create(config.name, 'core', circlePersonae.filePath, config.core);
    circlePersonae.core = circlePersona.filePath;
    circlePersonae.save();
    circle = new Circle(filePath=undefined,
                        corePersona=circlePersona,
                        in_personae=circlePersonae.filePath,
                        admins=config.admins);

    await circle.save();
    circlePersona.setOwner(circle);
    cm.fillPersonae(circle, config);
    circlePersona.save();
    window.personaeStructs[circlePersonae.filePath] = circlePersonae;
  }
  else{
    // This is a 1st party circle.  Construct it for ourselves.
    // log("createCircle - creating 1st party circle");
    let circleName = name.length > 0 ? name: await utils.getRandomOrganization();
    let circlePersonae = new PersonaeStruct();
    await circlePersonae.save()
    let circlePersona = await Persona.create(circleName, 'core', circlePersonae.filePath);
    circlePersonae.core = circlePersona.filePath;
    circlePersonae.save();
    circle = new Circle(filePath=undefined,
                        corePersona=circlePersona,
                        in_personae=circlePersonae.filePath,
                        admins=[identity.fingerprint]);
    await circle.save();
    circlePersona.setOwner(circle);
    cm.fillPersonae(circle);
    circlePersona.save();
    window.personaeStructs[circlePersonae.filePath] = circlePersonae;
  }


  window.circles[circle.filePath] = circle;
  window.circleTable[circle.fingerprint] = circle.filePath;
  window.user.circles.push(circle.filePath);
  await window.user.save();

  return circle;
};

cm.circleMembers = async function(fingerprint){
  // log('circleMembers function');
  let circle = cm.fingerprint2Instance('circle', fingerprint);
  //let members = 
};

cm.fingerprint2Instance = function(type, fingerprint){
  if (fingerprint === undefined){
    throw Error("Fingerprint is invalid");
  }
  let filePath = undefined;
  switch(type){
    case 'circle':
      filePath = window.circleTable[fingerprint];
      return window.circles[filePath];
      break;
    case 'identity':
      filePath = window.identityTable[fingerprint];
      return window.identities[filePath];
    case 'persona':
      filePath = window.personaTable[fingerprint];
      return window.personae[filePath];
    default:
      throw Error("Requires proper type.");
  }
  if (filePath === undefined){
    throw Error("Identity does not exist");
  }
};

cm.immutablyRemoveKey = function(ob, key){
  let result = {};
  for (let k in ob){
    // log('k in ob', k);
    if (key != k){
      // log('key doesn\'t match k', k);
      result[k] = ob[k];
    }
    else{
      // log('key matches k', k);
    }
  }
  return result;
};



window.circleManager = cm;
}
},{}]},{},[1]);
