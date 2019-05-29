const path = require('path');
const express = require('express');
const formidable = require('formidable');
const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();

const s3Client = new AWS.S3({
    accessKeyId: process.env.AWS_Access_Key,
    secretAccessKey: process.env.AWS_Secret_Access_Key
});

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    return res.sendFile("index.html");
})

app.post('/upload', (req, res) => {
    const form = new formidable.IncomingForm();
    form.multiples = true;
    const params = {Bucket: 'aman.dev'};
    form.on('field', (name, value) => {
        console.log(name,value);
        let metaData = JSON.parse(value);
        if (metaData.isFolder) {
            let path = metaData.fullPath ? metaData.fullPath : metaData.webkitRelativePath;
            params.Key = path;
        } else {
            params.Key = metaData.name;
        }
        
    })
    form.on('file', (name, file) => {
        fs.readFile(file.path, (err, data) => {
            if (err) throw err;
            params.Body = data;
            s3Client.upload(params, (s3err, s3data) => {
                if (s3err) throw s3err;
                fs.unlink(file.path, (fileErr) => {
                    if (fileErr) throw fileErr;
                    console.log("Temp file deleted");
                })
                
            });

        })
    })

    form.on('end', () => {
        return res.json({status: 200, data: null});
    })

    form.parse(req);
})

app.listen(3030, () => {
    console.log("Uploading at the port 3030"); 
})

