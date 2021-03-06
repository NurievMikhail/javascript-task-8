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
        let messageText = '';
        let id = '';
        switch (req.method) {
            case 'GET':
                res.end(getHelper(parsedUrl.query.from, parsedUrl.query.to));
                break;
            case 'POST':
                req.on('readable', function () {
                    let partOfMessage = req.read();
                    if (partOfMessage !== null) {
                        messageText += partOfMessage;
                    }
                });
                req.on('end', function () {
                    messageText = JSON.parse(messageText);
                    checkValue(messageText.text, res);
                    res.end(postHelper(
                        parsedUrl.query.from, parsedUrl.query.to, messageText.text));
                });
                break;
            case 'DELETE':
                id = parsedUrl.pathname.split('/')[2];
                checkValue(id, res);
                res.end(deleteHelper(id));
                break;
            case 'PATCH':
                id = parsedUrl.pathname.split('/')[2];
                checkValue(id, res);
                req.on('readable', function () {
                    let partOfMessage = req.read();
                    if (partOfMessage !== null) {
                        messageText += partOfMessage;
                    }
                });
                req.on('end', function () {
                    messageText = JSON.parse(messageText);
                    checkValue(messageText.text, res);
                    res.end(patchHelper(id, messageText.text));
                });
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

function getHelper(from, to) {
    if (from === undefined && to === undefined) {
        return JSON.stringify(chat);
    }
    if (to === undefined) {
        return JSON.stringify(chat.filter((chatMessage) => (chatMessage.from === from)));
    }
    if (from === undefined) {
        return JSON.stringify(chat.filter((chatMessage) => (chatMessage.to === to)));
    }

    return JSON.stringify(chat.filter((chatMessage) =>
        (chatMessage.to === to && chatMessage.from === from)));
}

function postHelper(from, to, text) {
    let newMessage = {
        id: shortid.generate(),
        text,
        from,
        to
    };
    chat.push(newMessage);

    return JSON.stringify(newMessage);
}

function deleteHelper(id) {
    const indexOfMessage = chat.indexOf(chat.find((message) => (message.id === id)));
    chat.splice(indexOfMessage, 1);

    return JSON.stringify({ 'status': 'ok' });
}

function patchHelper(id, text) {
    let patchedMessage = chat.find((message) => (message.id === id));
    if (!patchedMessage) {
        return JSON.stringify({});
    }
    patchedMessage.text = text;
    patchedMessage.edited = true;

    return JSON.stringify(patchedMessage);
}

function checkValue(value, res) {
    if (!value) {
        sendNotFound(res);
    }
}

function sendNotFound(res) {
    res.statusCode = 404;
    res.end('Not Found');
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
