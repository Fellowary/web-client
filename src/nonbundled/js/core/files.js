if(window.document.getElementsByTagName('frontend').length > 0 && !window.browser ||
  window.document.getElementsByTagName('backend').length > 0){

var SM = window.storageManager;
var IM = window.importManager;
var EM = window.exportManager;
var TM = window.transferManager;

var fm = {};

fm.saveConfig = async function(path, password, changeData){

};

//fm.importFile = IM.importFile; // function

//fm.exportFile = EM.exportFile; // generator function

//fm.open = SM.openFile;

//fm.mkdir = SM.mkdir;

//fm.copyFile = SM.copy;

//fm.delete = SM.deleteFile;

//fm.retrieve = TM.retrieveFile;

window.fileManager = fm;
}