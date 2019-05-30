onmessage = (event) => {
    let data = event.data;
    const chunkSize = 200;
    let formData = new FormData();
    /* data.files.map((file) => { */
        /* let chunksQuantity = Math.ceil(file.size/chunkSize);
        let chunksQueue = new Array(chunksQuantity).fill().map((_, index) => index).reverse();

        function sendNext() {
            if (!chunksQueue.length) {
                return ;
            }

            const chunkId = chunksQueue.pop();
            const begin = chunkId * chunkSize;
            const chunk = file.slice(begin, begin + chunkSize);

            upload(chunk, chunkId)
                .then(() => sendNext())
                .catch(() => chunksQueue.push(chunkId));

        } */

        //let { fileObject, ...rest } = { ...file };
        /* formData.append("filesList[]", fileOfbject, file.name);
        if (data.event === "Drag") {
            rest.dragEvent = true;
        } else {
            rest.dragEvent = false;
        }
        formData.append("fileMetaData", JSON.stringify(rest)); */
    /* }) */
    formData.append("FileList[]", JSON.stringify(data.files));
    fetch("http://localhost:3030/upload", {
            method: 'POST',
            body: formData
        })
        .then((res) => {
            self.postMessage(res.status);
        });
}

upload = (chunk, chunkId) => {
    let formData = new FormData();
    let url = "http://localhost:3030/upload";
    let headers = new Headers();

    return fetch(url, {
        method: 'POST',
        body: formData
    })
}