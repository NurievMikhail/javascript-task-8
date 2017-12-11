'use strict';

const request = require('request');
const querystring = require('querystring');
const chalk = require('chalk');
const parseArgs = require('minimist');

module.exports.execute = execute;
module.exports.isStar = true;

const URL = 'http://localhost:8080/messages';

async function execute() {
    const parsedArgs = parseArgs(process.argv.slice(2));
    parsedArgs.command = parsedArgs._[0];
    const query = createFromToQuery(parsedArgs);
    let resultString = '';
    switch (parsedArgs.command) {
        case 'send':
            resultString = dyeResponse(await sendHelper(parsedArgs, query), parsedArgs.v);

            return Promise.resolve(resultString);
        case 'list':
            resultString = (await listHelper(query))
                .map((message) => (dyeResponse(message, parsedArgs.v)))
                .join('\n\n');

            return Promise.resolve(resultString);
        case 'delete':
            resultString = await deleteHelper(parsedArgs);

            return Promise.resolve(resultString);
        case 'edit':
            resultString = dyeResponse(await editHelper(parsedArgs), parsedArgs.v);

            return Promise.resolve(resultString);
        default:
            return;
    }
}

function dyeResponse(response, v) {
    let resultResponse = '';
    if (v) {
        let id = chalk.hex('#FF0')('ID');
        resultResponse += `${id}: ${response.id}\n`;
    }
    if (response.from) {
        let from = chalk.hex('#F00')('FROM');
        resultResponse += `${from}: ${response.from}\n`;
    }
    if (response.to) {
        let to = chalk.hex('#F00')('TO');
        resultResponse += `${to}: ${response.to}\n`;
    }
    let text = chalk.hex('#0F0')('TEXT');
    resultResponse += `${text}: ${response.text}`;
    if (response.edited) {
        resultResponse += `${chalk.hex('#777')('(edited)')}`;
    }

    return resultResponse;
}

function sendHelper(args, query) {
    if (!args.text) {
        return;
    }
    let resultUrl = URL;
    if (query) {
        resultUrl += `?${query}`;
    }
    const options = {
        method: 'POST',
        url: resultUrl,
        body: { text: args.text },
        json: true
    };

    return createRequestPromise(options);
}

function listHelper(query) {
    let resultUrl = URL;
    if (query) {
        resultUrl += `?${query}`;
    }
    const options = {
        method: 'GET',
        url: resultUrl,
        json: true
    };

    return createRequestPromise(options);
}

function deleteHelper(args) {
    if (!args.id) {
        return;
    }
    let resultUrl = `${URL}/${args.id}`;
    const options = {
        method: 'DELETE',
        url: resultUrl,
        json: true
    };

    return new Promise((resolve) => {
        request(options, function () {
            return resolve('DELETED');
        });
    });
}

function editHelper(args) {
    if (!args.text || !args.id) {
        return Promise.resolve(JSON.stringify({}));
    }
    let resultUrl = `${URL}/${args.id}`;
    const options = {
        method: 'PATCH',
        url: resultUrl,
        body: { text: args.text },
        json: true
    };

    return createRequestPromise(options);
}

function createFromToQuery(obj) {
    let fromToQuery = {};
    if (obj.from) {
        fromToQuery.from = obj.from;
    }
    if (obj.to) {
        fromToQuery.to = obj.to;
    }

    return querystring.stringify(fromToQuery);
}


function createRequestPromise(options) {
    return new Promise((resolve) => {
        request(options, function (err, res, body) {
            if (err) {
                return resolve(err);
            }

            return resolve(body);
        });
    });
}
