const files = document.querySelector('input');
const listing = document.querySelector('ul');
const dropzone = document.querySelector('#dropzone');
const myWorker = new Worker("worker.js");

const FILES_TO_IGNORE = [
    '.DS_Store', // OSX indexing file
    'Thumbs.db' // Windows indexing file
];

files.addEventListener('change', (event) => {
    
    getDroppedOrSelectedFiles(event)
        .then((files) => {
            console.info("[Change Event]");
            files.forEach((file) => {
                if (file.fullPath.split('/').length === 2 && file.fullPath.split('/')[1].match(/\.(png|svg|jpg|jpeg|gif)$/)) {
                    file.isFolder = false;
                } else {
                    file.isFolder = true;
                }
            })
            myWorker.postMessage({
                files,
                events: "Drag"
            });
            let tree = treeify(files);
            function showTree(tree) {
                tree.map((list) => {
                    let item = document.createElement('li');
                    item.textContent = list.fileName;
                    if(list.isDirectory) {
                        if (list.children) {
                            list.children.forEach((child) => {
                                if (child.isDirectory) {
                                    showTree(child.children)
                                }
                                let itemChild = document.createElement('ul');
                                let level = document.createElement('li');
                                level.textContent = child.fileName;
                                itemChild.appendChild(level);
                                item.appendChild(itemChild);
                            })
                        }
                    } else {
                        listing.appendChild(item);
                    }  
                })
            }

            showTree(tree);
        })
    
    // Converting FileList object into a directory structure
    
    event.preventDefault();
})

    
myWorker.addEventListener('message', (e) => {
    console.log(e);
})

files.addEventListener('ondrop', (event, DataTransfer) => {
    dropHandler(event);
    event.preventDefault(); 
})

const ignoreFiles = (file) => {
    return FILES_TO_IGNORE.indexOf(file.name) >= 0;
}

const dropHandler = (event) => {
    getDroppedOrSelectedFiles(event)
        .then((files) => {
            files.forEach((file) => {
                if (file.fullPath.split('/').length === 2 && file.fullPath.split('/')[1].match(/\.(png|svg|jpg|jpeg|gif)$/)) {
                    file.isFolder = false;
                } else {
                    file.isFolder = true;
                }
            })
            myWorker.postMessage({files, events: "Drag"});
            let tree = treeify(files);
            function showTree(tree) {
                tree.map((list) => {
                    let item = document.createElement('li');
                    item.textContent = list.fileName;
                    listing.appendChild(item);
                    if(list.isDirectory) {
                        if (list.children) {
                            list.children.forEach((child) => {
                                if (child.isDirectory) {
                                    showTree(child.children)
                                }
                                let itemChild = document.createElement('ul');
                                let level = document.createElement('li');
                                level.textContent = child.fileName;
                                itemChild.appendChild(level);
                                item.appendChild(itemChild);

                            })
                        }
                    } 
                })
            }
            showTree(tree);
        })
}

const dragOverHandler = (event) => {
    getDroppedOrSelectedFiles(event)
        /* .then((files) => {
            console.log("Files in dropzone", files);
        }) */
}

const traverseDirectory = (entry) => {
    const reader = entry.createReader();
    return new Promise((resolveDirectory) => {
        const iterationAttempts = [];
        const errorHandler = () => {};

        function readEntries() {
            reader.readEntries((batchEntries) => {
                if (!batchEntries.length) {
                    resolveDirectory(Promise.all(iterationAttempts))
                } else {
                    iterationAttempts.push(Promise.all(batchEntries.map((batchEntry) => {
                        if (batchEntry.isDirectory) {
                            return traverseDirectory(batchEntry);
                        }
                        return Promise.resolve(batchEntry);
                    })));

                    readEntries();
                }
            }, errorHandler);
        }

        readEntries();
    });
}

const packageFile = (file, entry) => {
    let object =  {
        fileObject: file,
        fullPath: !!entry ? entry.fullPath : '',
        lastModified: file.lastModified,
        lastModifiedDate: file.lastModifiedDate,
        name: file.name,
        size: file.size,
        type: file.type,
        webkitRelativePath: file.webkitRelativePath
    }
    return object;
}

const getFile = (entry) => {
    return new Promise((resolve) => {
        entry.file((file) => {
            resolve(packageFile(file, entry));
        })
    })
}

const handleFilePromises = (promises, fileList) => {
    return Promise.all(promises).then((files) => {
        files.forEach((file) => {
            if (!ignoreFiles(file)) {
                fileList.push(file);
            }
        });
        return fileList;
    })
}

const getDataTransferFiles = (dataTransfer) => {
    const dataTransferFiles = [];
    const folderPromises = [];
    const filePromises = [];

    [].slice.call(dataTransfer.items).forEach((listItem) => {
        if (typeof listItem.webkitGetAsEntry === 'function') {
            const entry = listItem.webkitGetAsEntry();

            if (entry) {
                if (entry.isDirectory) {
                    folderPromises.push(traverseDirectory(entry));
                } else {
                    filePromises.push(getFile(entry));
                }
            } else {
                dataTransferFiles.push(listItem);
            }
        }
    });
    if (folderPromises.length) {
        const flatten = (array) => array.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
        return Promise.all(folderPromises).then((fileEntries) => {
            const flattenedEntries = flatten(fileEntries);
            flattenedEntries.forEach((fileEntry) => {
                filePromises.push(getFile(fileEntry));
            });
            return handleFilePromises(filePromises, dataTransferFiles);
        });
    } else if (filePromises.length) {
        return handleFilePromises(filePromises, dataTransferFiles);
    }

    return Promise.resolve(dataTransferFiles);
} 


const getDroppedOrSelectedFiles = (event) => {
    const dataTransfer = event.dataTransfer;
    if (dataTransfer && dataTransfer.items) {
        return getDataTransferFiles(dataTransfer)
            .then((fileList) => {
                return Promise.resolve(fileList);
            })
    }

    const files = [];
    const dragDropFileList = dataTransfer && dataTransfer.files;
    const inputFieldFileList = event.target && event.target.files;
    const fileList = dragDropFileList || inputFieldFileList || [];

    for (let i = 0; i < fileList.length; i++) {
        if (!ignoreFiles(fileList[i])) {
            files.push(packageFile(fileList[i]));
        }
    }

    return Promise.resolve(files);


}

function treeify(arr) {
    var tree = {}

    function addnode(obj) {
        var splitpath = obj.fullPath ? obj.fullPath.replace(/^\/|\/$/g, "").split('/') : obj.webkitRelativePath.replace(/^\/|\/$/g, "").split('/');
        var ptr = tree;
        for (let i = 0; i < splitpath.length; i++) {
            let node = {
                fileName: splitpath[i],
                isDirectory: true
            };
            if (i == splitpath.length - 1) {
                node.isDirectory = false
            }
            ptr[splitpath[i]] = ptr[splitpath[i]] || node;
            ptr[splitpath[i]].children = ptr[splitpath[i]].children || {};
            ptr = ptr[splitpath[i]].children;
        }
    }

    function objectToArr(node) {
        Object.keys(node || {}).map((k) => {
            if (node[k].children) {
                objectToArr(node[k])
            }
        })
        if (node.children) {
            node.children = Object.values(node.children)
            node.children.forEach(objectToArr)
        }
    }
    arr.map(addnode);
    objectToArr(tree)
    return Object.values(tree)
}

const isAdvancedUpload = () => {
    let div = document.createElement('div');
    return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
}