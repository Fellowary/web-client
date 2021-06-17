/////////////////////////////////////////////////////////////////////////////////////////
// "Filemanager client" module script

// This should be loaded last in the html

;(function($) {
  $(function() {
  	// Dev Note: jQuery is only used for the components that already use it via dependencies.
  	// I don't want to remember jQuery so everything else is vanilla.


    function fileManagerClientHandleMessage(message, sender, sendResponse){
  		console.log("got message in iframe");
  		console.log(message, sender, sendResponse);
  	}

  	browser.runtime.onMessage.addListener(fileManagerClientHandleMessage);

  	function messageBackend(msg, payload){
  		return browser.runtime.sendMessage({
  			reason: msg,
  			payload: payload
  		});
  	};

   	let directoryTreeModel = {
   		directory_history: [],  // stack of path strings.  push, pop.  last directory is current one.
   		directories: [], // this is a list of directory paths e.g.  'first/second/abc/etc'
   		torrents: {},
   		files: {},
   		chunks: {},
   		circles: {},
   		queries: {},
   		products: {},
   		orders: {},
   		tasks: {}
   	};

   	function setFileManagerViewId(id){
   		let fileManagerViews = [
  			'filemanager_list_view',
  			'filemanager_gallery_view'
  		];
   		window.fellowaryConfig.fileManagerViewId = fileManagerViews[id > 1 ? 1 : id];
   	}

  	//filemanager_list_view.DataTable({  // TODO: use for filemanager in dashboard
  	//  responsive: true,
  	//});

  	function refreshTable(){
  		$('#filemanager_list_view').DataTable().ajax.reload();
  	}

  	function loadGallery(data){
  		let gallery_item = `
	  		  <div class="fel__gallery__item">
	            <div class="fel__gallery__itemContent">
	              <div class="fel__gallery__itemControl">
	                <div class="btn-group fel__gallery__itemControlContainer">
	                  <button type="button" class="btn">
	                    <i class="fe fe-edit"></i>
	                  </button>
	                  <button type="button" class="btn">
	                    <i class="fe fe-trash"></i>
	                  </button>
	                </div>
	              </div>
	              <img src="../../components/core/img/content/photos/2.jpeg" />
	            </div>
	            <div class="text-gray-6">
	              <div>flower_on_head.jpeg</div>
	              <div>768kb</div>
	            </div>
	          </div>`;
  	}

  	function torrentTableItem(data){
    	let listItem = `
  			  <tr class="${data.status}">
                <td>${data.name}</td>
                <td>${data.size}</td>
                <td>${data.key}</td>
                ${data.progress < 100 ? `<td id="${data.fileId}">${data.progress}%</td>`:``}
                <td>${data.circle}</td>
                <td>${data.owner}</td>
                <td>${data.importedDate}</td>
                <td>${data.uploadedDate}</td>
                <td>${data.downloadedDate}</td>
                <td>${data.exportedDate}</td>
              </tr>`;
        return listItem;
  	}

  	function loadTorrentsUI(torrents){
    	let prevFileManagerView = fileManagerView;
    	let fileManagerView = document.querySelector('#'+window.fellowaryConfig.fileManagerViewId);
    	if (window.fellowaryConfig.fileManagerViewId == 'filemanager_list_view'){
    		let tBody = fileManagerView.tBodies[0];  // there should only be one
			let itemsHTML = ``;
			for (let t of torrents){
				itemsHTML += torrentTableItem(t);
			}
			clearNode(tbody); // definition in core.js
			tBody.insertAdjacentHTML('beforeend', itemsHTML);
    	}
    }

  	function fileTableItem(data){
    	let listItem = `
  			  <tr class="${data.status}">
                <td>${data.name}</td>
                <td>${data.size}</td>
                <td>${data.key}</td>
                ${data.progress < 100 ? `<td id="${data.fileId}">${data.progress}%</td>`:``}
                <td>${data.circle}</td>
                <td>${data.owner}</td>
                <td>${data.importedDate}</td>
                <td>${data.uploadedDate}</td>
                <td>${data.downloadedDate}</td>
                <td>${data.exportedDate}</td>
              </tr>`;
        return listItem;
  	}

  	function loadFilesUI(files){
    	let prevFileManagerView = fileManagerView;
    	let fileManagerView = document.querySelector('#'+window.fellowaryConfig.fileManagerViewId);
    	if (window.fellowaryConfig.fileManagerViewId == 'filemanager_list_view'){
    		let tBody = fileManagerView.tBodies[0];  // there should only be one
			let itemsHTML = ``;
			for (let f of files){
				itemsHTML += fileTableItem(f);
			}
			clearNode(tbody); // definition in core.js
			tBody.insertAdjacentHTML('beforeend', itemsHTML);
    	}
    }

  	function loadChunkTableItem(data){
    	let listItem = `
  			  <tr class="${data.status}">
                <td>${data.name}</td>
                <td>${data.size}</td>
                <td>${data.key}</td>
                ${data.progress < 100 ? `<td id="${data.fileId}">${data.progress}%</td>`:``}
                <td>${data.circle}</td>
                <td>${data.owner}</td>
                <td>${data.importedDate}</td>
                <td>${data.uploadedDate}</td>
                <td>${data.downloadedDate}</td>
                <td>${data.exportedDate}</td>
              </tr>`;
        return listItem;
  	}

    function loadChunksUI(chunks){
    	let prevFileManagerView = fileManagerView;
    	let fileManagerView = document.querySelector('#'+window.fellowaryConfig.fileManagerViewId);
    	if (window.fellowaryConfig.fileMAnagerViewId == 'filemanager_list_view'){
    		let tBody = fileManagerView.tBodies[0];  // there should only be one
			let itemsHTML = ``;
			for (let c of chunks){
				itemsHTML += fileTableItem(c);
			}
			clearNode(tbody); // definition in core.js
			tBody.insertAdjacentHTML('beforeend', itemsHTML);
    	}
    }

    async function getListView(getActive = false, displayType = 'list'){ // false getActive means get inactive and active
    	let itemsHTML = await messageBackend(
    							'filemanager_request',
    							{
    								cmd: 'listfilesui',
    								getActive: getActive,
    								displayType: displayType
    							});
		let prevFileManagerView = fileManagerView;
    	let fileManagerView = document.querySelector('#'+window.fellowaryConfig.fileManagerViewId);
    	let tBody = fileManagerView.tBodies[0];  // there should only be one
		clearNode(tbody); // definition in core.js
		tBody.insertAdjacentHTML('beforeend', itemsHTML);
		if (fileManagerView != prevFileManagerView){
			prevFileManagerView.classList.add("fellowary_display_none");
		}
		fileManagerView.classList.remove("fellowary_display_none");
    }

  });
})(jQuery)
