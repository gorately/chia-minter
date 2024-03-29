import { start } from 'repl';
import createCompleterProxy from './completer.js';
import * as settings from './settings.js';
import chalk from 'chalk';
import ChiaRepl from './chia_repl.js';
import _ from 'lodash';
import log from './logger.js';

// this module is responsible for creating and configuring the repl and ChiaRepl
// instances and then smashing them together
export default function createRepl(cursor) {
    const chiaRepl = new ChiaRepl(start({ prompt: cursor, useColors: true }));

    chiaRepl.repl.completer = createCompleterProxy(chiaRepl.repl.completer);

    chiaRepl.repl.on('reset', () => {
        chiaRepl.disconnect(chiaRepl.repl);
        chiaRepl.loadConnection();
    });

    chiaRepl.repl.on('exit', () => chiaRepl.exit());

    chiaRepl.repl.defineCommand('connect', {
        help: 'Opens the websocket connection to the chia daemon using the currently loaded connection',
        async action() {
            if (chiaRepl.repl.context.chiaDaemon !== undefined) {
                log('Already connected. Use .disconnect first', 'warning');
                chiaRepl.repl.displayPrompt();
            } else {
                await chiaRepl.connect();
            }
        }
    });

    chiaRepl.repl.defineCommand('disconnect', {
        help: 'Closes the websocket connection to the chia daemon',
        action() {
            if (chiaRepl.repl.context.chiaDaemon === undefined) {
                log('Not connected', 'warning');
                chiaRepl.repl.displayPrompt();
            } else {
                chiaRepl.disconnect();
            }
        }
    });

    chiaRepl.repl.defineCommand('load-connection', {
        help: 'Loads a saved connection with an optional name',
        action(name) {
            if (chiaRepl.repl.context.chiaDaemon !== undefined) {
                log('Currently connected. Use .disconnect first', 'warning');
            } else if (name !== undefined && !settings.settingExists(`${name}.connection`)) {
                log(`No connection named ${name} found`, 'error');
            } else {
                settings.saveSetting('.lastConnectionName', name);
                chiaRepl.loadConnection();
            }

            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('list-connections', {
        help: 'Displays a list of saved connection names',
        action() {
            settings.listSettings().forEach(file => {
                if (file.endsWith('.connection')) {
                    console.log(file.replace('.connection', ''));
                    console.log(settings.getSettingObject(file));
                }
            });
            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('save-options', {
        help: 'Saves the options',
        action() {
            settings.saveSetting('.options', chiaRepl.repl.context.options);
            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('save-connection', {
        help: 'Saves the current connection with an optional name',
        action(name) {
            settings.saveSetting(`${name}.connection`, chiaRepl.repl.context.connection);
            settings.saveSetting('.lastConnectionName', name);
            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('version', {
        help: 'Shows the version of this application',
        action() {
            console.log(settings.version);
            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('credits', {
        help: 'Shows credits for the various tool authors',
        action() {
            console.log('clvm_tools-js - https://github.com/Chia-Mine/clvm_tools-js');
            console.log('clvm-js - https://github.com/Chia-Mine/clvm-js');
            console.log('chia-utils - https://github.com/CMEONE/chia-utils');
            console.log('@rigidity/bls-signatures - https://github.com/Rigidity/bls-signatures');
            console.log('chia rpc api - https://dkackman.github.io/chia-api/');

            console.log('\nchia and its logo are the registered trademark or trademark of Chia Network, Inc. in the United States and worldwide.');
            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('listen', {
        help: 'Listens for messages addressed to the given service name, defaulting to "wallet_ui"',
        async action(service_name) {
            if (_.isEmpty(service_name)) service_name = 'wallet_ui';

            // we can't reuse the daemon because it uses its own service_name
            if (chiaRepl.repl.context.chiaDaemon !== undefined) {
                console.log('Currently connected. Use .disconnect first');
            } else if (await chiaRepl.connect(service_name)) {
                await chiaRepl.repl.context.chiaDaemon.listen();
                chiaRepl.disconnect();
            }

            chiaRepl.repl.displayPrompt();
        }
    });

    chiaRepl.repl.defineCommand('more-help', {
        help: 'Shows more help about using the environment',
        action() {
            console.log('These global objects are available within the REPL environment');
            console.log(`${chalk.green('bls')}\t\tBLS signature functions`);
            console.log(`${chalk.green('chia')}\t\tChia node rpc services. This object is only availble after a successful .connect`);
            console.log('\t\tAll functions on these chia services are async & awaitable: crawler, daemon, farmer, full_node, harvester, wallet, simulator');
            console.log(`${chalk.green('clvm_tools')}\tclvm_tools-js functions (run, brun, opc, opd, read_ir)`);
            console.log(`${chalk.green('clvm')}\t\tclvm-js (Program, SExp etc.)`);
            console.log(`${chalk.green('utils')}\t\tChia-utils (bech32m and other helpers)`);
            console.log(`${chalk.green('connection')}\tProperties of the current connection`);
            console.log(`${chalk.green('options')}\t\tConfigurable REPL options`);
            console.log(`${chalk.green('contentHasher')}\tA helper to generate NFT compatible hashes for files or remote resources`);
            console.log(`${chalk.green('metadataFactory')}\tA helper to generate NFT and Collection metadata`);
            console.log(`${chalk.green('minter')}\t\tThe minter for uploading and minting. Only available when connected to the daemon`);
            console.log(`${chalk.green('repl.builtinModules')}\n\t\tShow other available builtin node modules`);

            console.log('\nThese global functions are invocable within the REPL environment');
            console.log(`${chalk.green('compile')}${chalk.gray('(chiaLisp, prefix, ...compileArgs)')}`);
            console.log('\t\tCompiles a chialisp program into its address, clvm, puzzle, and puzzle_hash');
            console.log(`${chalk.green('test')}${chalk.gray('(chiaLisp, compileArgs = [], programArgs = []))')}`);
            console.log('\t\tRuns a chialisp program and displays its output');

            console.log(chalk.green('\nSee the chia-repl wiki for more help and examples'));
            console.log(chalk.green('https://github.com/dkackman/chia-repl/wiki'));
            chiaRepl.repl.displayPrompt();
        }
    });

    return chiaRepl;
}
