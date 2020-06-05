const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

const statusElem = document.getElementById('status');
ipcRenderer.on('initial-data', function (event,store) {
    console.log(event, store);
    statusElem.textContent = store.ok ? 'ok' : 'uh oh';
});