const path = require('path');
const express = require('express');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    console.log(req, res);
    return res.sendFile("index.html");
})

app.listen(3030, () => {
    console.log("Uploading at the port 3030"); 
})

