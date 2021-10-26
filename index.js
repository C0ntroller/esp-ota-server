"use strict";
const express = require("express");
const formidableMiddleware = require('express-formidable');
const fs = require("fs");
const md5File = require('md5-file')

const app = express();
app.use(formidableMiddleware());

setupFolders();

function setupFolders() {
    try {
        fs.accessSync("data");
        fs.accessSync("data/bin");
    } catch {
        fs.mkdirSync("data");
        fs.mkdirSync("data/bin");
    }
}

function newVersionAvailable(name, md5) {
    try {
        const rawjson = fs.readFileSync("data/versionlist.json");
        const versionList = JSON.parse(rawjson);
        return versionList[name] != md5;
    } catch {
        return false;
    }
}

function moveFileToBin(path, name) {
    try {
        fs.accessSync("data/bin");
    } catch {
        return false;
    }

    fs.copyFileSync(path, `data/bin/${name}`);
    fs.rmSync(path);
    return true;
}

function setNameAndMd5(name, md5) {
    try {
        fs.accessSync("data");
    } catch {
        return false;
    }

    try {
        const rawjson = fs.readFileSync("data/versionlist.json");
        const versionList = JSON.parse(rawjson);
        versionList[name] = md5;
        fs.writeFileSync("data/versionlist.json", JSON.stringify(versionList));
        return true;
    } catch {
        try {
            fs.accessSync("data/versionlist.json");
            return false;
        } catch {
            fs.writeFileSync("data/versionlist.json", JSON.stringify({[name]: md5}));
            return true;
        }
    }
}

app.get("/ota", (req, res) => {
    if(!req.query.name
        || !req.header("x-ESP8266-STA-MAC")
        || !req.header("x-ESP8266-AP-MAC")
        || !req.header("x-ESP8266-free-space")
        || !req.header("x-ESP8266-sketch-size")
        || !req.header("x-ESP8266-sketch-md5")
        || !req.header("x-ESP8266-chip-size")
        || !req.header("x-ESP8266-sdk-version")
        ) return res.status(400).end();

    const name = req.query.name;

    if(newVersionAvailable(name, req.header("x-ESP8266-sketch-md5"))) {
        console.log(`God request from ${req.query.name} - Update!`);
        return res.sendFile(`${__dirname}/data/bin/${name}`);
    } else {
        console.log(`God request from ${req.query.name} - Nothing changed`);
        return res.status(304).end();
    }
});

app.get("/", (_req, res) => {
    res.sendFile(`${__dirname}/upload.html`);
});

app.post("/upload", (req, res) => {
    if(!req.fields?.name
        || !req.fields?.md5
        || !req.files?.binary) return res.status(400).end();

    const hash = md5File.sync(req.files.binary.path);
    if(req.fields.md5 !== hash) return res.status(409).send("Upload conflict - md5 does not match.").end();

    if(moveFileToBin(req.files.binary.path, req.fields.name)
        && setNameAndMd5(req.fields.name, hash)) return res.status(200).end();
    else return res.status(500).end();
});

app.listen(42420, () => console.log("Server startled!"));
