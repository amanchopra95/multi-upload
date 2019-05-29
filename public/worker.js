onmessage = (event) => {
    let data = event.data;
    let formData = new FormData();
    data.files.map((file) => {
        let { fileObject, ...rest } = { ...file };
        formData.append("filesList[]", fileObject, file.name);
        if (data.event === "Drag") {
            rest.dragEvent = true;
        } else {
            rest.dragEvent = false;
        }
        formData.append("fileMetaData", JSON.stringify(rest));
        fetch("http://localhost:3030/upload", {
                method: 'POST',
                body: formData
            })
            .then((res) => {
                self.postMessage(res.status);
            });
    })
    /* fetch("http://localhost:3030/upload", {
            method: 'POST',
            body: formData
        })
        .then((res) => {
            self.postMessage(res.status);
        }); */
}