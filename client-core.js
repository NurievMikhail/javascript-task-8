'use strict';

const request = require('request');
const querystring = require('querystring');
const chalk = require('chalk');

module.exports.execute = execute;
module.exports.isStar = true;

const URL = 'http://localhost:8080/messages';

async function execute() {
    const parsedArgs = parseArgs(process.argv);
    const query = createFromToQuery(parsedArgs.from, parsedArgs.to);
    let resultString = '';
    switch (parsedArgs.command) {
        case 'send':
            resultString = dyeResponse(await sendHelper(parsedArgs, query), parsedArgs.detailed);

            return Promise.resolve(resultString);
        case 'list':
            resultString = (await listHelper(query))
                .map((message) => (dyeResponse(message, parsedArgs.detailed)))
                .join('\n\n');

            return Promise.resolve(resultString);
        case 'delete':
            resultString = await deleteHelper(parsedArgs);

            return Promise.resolve(resultString);
        case 'edit':
            resultString = dyeResponse(await editHelper(parsedArgs), parsedArgs.detailed);

            return Promise.resolve(resultString);
        default:
            return;
    }
}

function dyeResponse(response, detailed) {
    let resultResponse = '';
    if (detailed) {
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
        request(options, function (err) {
            if (err) {
                return resolve(err);
            }

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

function createFromToQuery(from, to) {
    let fromToQuery = {};
    if (from) {
        fromToQuery.from = from;
    }
    if (to) {
        fromToQuery.to = to;
    }

    return querystring.stringify(fromToQuery);
}

function parseArgs(args) {
    let resultParams = {
        command: args[2].toLowerCase()
    };
    let params = args.slice(3);
    for (let i = 0; i < params.length; i++) {
        let paramName = '';
        let paramValue = '';
        if (params[i] === '-v') {
            resultParams.detailed = true;
            continue;
        } else if (/--.+=.+/.test(params[i])) {
            paramName = params[i].split('=')[0].slice(2);
            paramValue = params[i].split('=')[1];
        } else {
            paramName = params[i].slice(2);
            paramValue = params[i + 1];
            i++;
        }
        resultParams[paramName.toLowerCase()] = paramValue;
    }

    return resultParams;
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
