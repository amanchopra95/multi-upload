onmessage = (event) => {
    console.log("[Message Received]", event);
    let data = event.data;
    console.log(data);
    let formData = new FormData();
    data.map((file) => {
        console.log
        formData.append("files[]", file.fileObject, file.name);
    })
    fetch("/", {
        method: 'POST',
        cors: "no-cors",
        cache: 'no-cache',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        body: formData
    })
    .then((res) => console.log(res));
}