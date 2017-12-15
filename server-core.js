'use strict';

const http = require('http');
const url = require('url');
const shortid = require('shortid');

const server = new http.Server();
let chat = [];

server.on('request', function (req, res) {
    let parsedUrl = url.parse(req.url, true);
    if (checkPath(req, parsedUrl)) {
        res.setHeader('Content-Type', 'application/json');
        switch (req.method) {
            case 'GET':
                getHelper(req, res);
                break;
            case 'POST':
                postHelper(req, res);
                break;
            case 'DELETE':
                deleteHelper(req, res);
                break;
            case 'PATCH':
                patchHelper(req, res);
                break;
            default:
                res.statusCode = 404;
                res.end();
                break;
        }
    } else {
        res.statusCode = 404;
        res.end();
    }
});

function getHelper(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const from = parsedUrl.query.from;
    const to = parsedUrl.query.to;
    if (from === undefined && to === undefined) {
        return res.end(JSON.stringify(chat));
    }
    if (to === undefined) {
        return res.end(JSON.stringify(chat.filter((chatMessage) => (chatMessage.from === from))));
    }
    if (from === undefined) {
        return res.end(JSON.stringify(chat.filter((chatMessage) => (chatMessage.to === to))));
    }

    return res.end(JSON.stringify(chat.filter((chatMessage) =>
        (chatMessage.to === to && chatMessage.from === from))));
}

function postHelper(req, res) {
    const parsedUrl = url.parse(req.url, true);
    let messageText = '';
    const from = parsedUrl.query.from;
    const to = parsedUrl.query.to;
    req.on('readable', function () {
        let partOfMessage = req.read();
        if (partOfMessage !== null) {
            messageText += partOfMessage;
        }
    });
    req.on('end', function () {
        messageText = JSON.parse(messageText);
        checkValue(messageText.text, res);
        let newMessage = {
            id: shortid.generate(),
            text: messageText.text
        };
        if (from) {
            newMessage.from = from;
        }
        if (to) {
            newMessage.to = to;
        }
        chat.push(newMessage);

        return res.end(JSON.stringify(newMessage));
    });
}

function deleteHelper(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const id = parsedUrl.href.split('/')[2];
    checkValue(id, res);
    let indexOfMessage = chat.indexOf(chat.find((message) => (message.id === id)));
    if (indexOfMessage !== -1) {
        chat.splice(indexOfMessage, 1);

        return res.end(JSON.stringify({ 'status': 'ok' }));
    }
    res.statusCode = 404;

    return res.end();
}

function patchHelper(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const id = parsedUrl.href.split('/')[2];
    checkValue(id, res);
    let messageText = '';
    req.on('readable', function () {
        let partOfMessage = req.read();
        if (partOfMessage !== null) {
            messageText += partOfMessage;
        }
    });
    req.on('end', function () {
        messageText = JSON.parse(messageText);
        checkValue(messageText.text, res);
    });
    let patchedMessage = chat.find((message) => (message.id === id));
    if (patchedMessage) {
        patchedMessage.text = messageText.text;
        patchedMessage.edited = true;

        return res.end(JSON.stringify(patchedMessage));
    }

    res.statusCode = 404;
    res.end();
}

function checkValue(value, res) {
    if (!value) {
        res.statusCode = 404;
        res.end();
    }
}

function checkPath(req, parsedUrl) {
    switch (req.method) {
        case 'GET':
        case 'POST':
            if (/^\/messages$/.test(parsedUrl.pathname)) {
                return true;
            }

            return false;
        default:
            if (/^\/messages\/[\w-_]+$/.test(parsedUrl.pathname)) {
                return true;
            }

            return false;
    }
}

module.exports = server;
