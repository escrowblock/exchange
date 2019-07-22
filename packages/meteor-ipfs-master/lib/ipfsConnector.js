import { loglevel } from 'meteor/practicalmeteor:loglevel';

import { LongRunningChildProcess } from 'meteor/sanjo:long-running-child-process';

const Fse = Npm.require('fs-extra');
const Request = Npm.require('request');
const Shelljs = Npm.require('shelljs');
const Symbol = Npm.require('es6-symbol');
const path = Npm.require('path');
const ipfsAPI = Npm.require('ipfs-http-client');
const Future = Npm.require('fibers/future');
const { exec } = Npm.require('child_process');

const binariesVersion = '0.4.19';

const writeJson = Meteor.wrapAsync(Fse.outputJson);

const device = `${process.platform}-${process.arch}`;
const projectDir = `${process.env.PWD}/`;
const homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

const assetsDir = '.private';
const configFile = 'ipfs.json';
const execPath = path.join(projectDir, assetsDir);

const ipfsFolder = 'go-ipfs';
const ipfsRoot = path.join(execPath, ipfsFolder);
// https://ipfs.io/ipns/dist.ipfs.io/go-ipfs/v0.4.19/go-ipfs_v0.4.19_linux-386.tar.gz
const assetsRoot = `https://ipfs.io/ipns/dist.ipfs.io/go-ipfs/v${binariesVersion}/`;

const log = loglevel.createPackageLogger('escb:meteor-ipfs', 'info');
const logLevels = ['trace', 'fine', 'debug', 'info', 'warn', 'error'];

const binaries = {
    'linux-arm': `go-ipfs_v${binariesVersion}_linux-arm.tar.gz`,
    'linux-arm64': `go-ipfs_v${binariesVersion}_linux-arm64.tar.gz`,
    'linux-ia32': `go-ipfs_v${binariesVersion}_linux-386.tar.gz`,
    'linux-x64': `go-ipfs_v${binariesVersion}_linux-amd64.tar.gz`,
    'darwin-ia32': `go-ipfs_v${binariesVersion}_darwin-386.tar.gz`,
    'darwin-x64': `go-ipfs_v${binariesVersion}_darwin-amd64.tar.gz`,
    'freebsd-arm': `go-ipfs_v${binariesVersion}_linux-arm.tar.gz`,
    'freebsd-ia32': `go-ipfs_v${binariesVersion}_linux-386.tar.gz`,
    'freebsd-x64': `go-ipfs_v${binariesVersion}_linux-amd64.tar.gz`,
    'win32-ia32': `go-ipfs_v${binariesVersion}_windows-386.zip`,
    'win32-x64': `go-ipfs_v${binariesVersion}_windows-amd64.zip`,
};

const symbolEnforcer = Symbol();
const symbol = Symbol();

IpfsConnector = class IpfsConnector {
    constructor (enforcer) {
        if (enforcer !== symbolEnforcer) {
            throw new Meteor.Error('singleton-enforce', 'Cannot construct singleton');
        }
        this.ipfsConnector = false;
        this.config = false;
        this.api = false;
        this.sock = '/ip4/127.0.0.1/tcp/5001';
        this.ipfsProcess = new LongRunningChildProcess('ipfsProcess');
        this.executable = path.join(ipfsRoot, ((process.platform == 'win32') ? 'ipfs.exe' : 'ipfs'));
    }

    static getInstance () {
        if (!this[symbol]) {
            this[symbol] = new IpfsConnector(symbolEnforcer);
        }
        return this[symbol];
    }

    /**
   * start ipfs
   * @returns {*}
   */
    start () {
        if (!this.ipfsConnector) {
            const future = new Future();
            const config = this._checkConfig();
            if (config) {
                const options = {
                    command: this.executable,
                    args: ['daemon'],
                };
                log.info(`starting ipfs daemon from ${this.executable}`);
                this.ipfsConnector = this.ipfsProcess.spawn(options);
                Meteor.setTimeout(() => {
                    this.api = ipfsAPI(this.sock);
                    log.info(`connecting to ipfsAPI on ${this.sock}`);
                    future.return(true);
                }, 4000);
            } else {
                log.error('error getting ipfs config');
                future.throw(true);
            }
            return future.wait();
        }
        return true;
    }

    /**
   *
   * @returns {*|any}
   * @private
   */
    _checkConfig () {
        const future = new Future();
        Fse.stat(path.join(execPath, configFile), Meteor.bindEnvironment((err, stats) => {
            if (!stats) {
                const hasAssets = this._getAssets(true);
                if (hasAssets) {
                    const init = this._init();
                    if (init) {
                        this._writeToConfig();
                        future.return(true);
                    } else {
                        log.error('could not init ipfs');
                        future.throw(true);
                    }
                } else {
                    log.error('could not download ipfs');
                    future.throw(true);
                }
            } else {
                Fse.readJson(path.join(execPath, configFile), Meteor.bindEnvironment((er, config) => {
                    if (er) {
                        future.throw(er);
                    } else {
                        this.config = config;
                        const hasAssets = this._getAssets();
                        if (hasAssets) {
                            this._writeToConfig();
                            const init = this._init();
                            if (init) {
                                future.return(true);
                            } else {
                                future.throw(false);
                            }
                        } else {
                            future.return(true);
                        }
                    }
                }));
            }
        }));
        return future.wait();
    }

    /**
   * run <code>ipfs init</code>
   * @returns {*|any}
   * @private
   */
    _init () {
        const future = new Future();
        const q = exec(`${this.executable} init --profile server`);

        q.on('exit', (code) => {
            future.return(true);
        });

        q.on('error', (err) => {
            future.throw(err);
        });
        return future.wait();
    }

    /**
   * donwload and extract ipfs
   * @param force
   * @returns {boolean}
   * @private
   */
    _getAssets (force = false) {
        const hasInit = this._checkIpfsConfig();
        if (!hasInit) {
            force = true;
        }
        if (force || (this.config.version != binariesVersion)) {
            const filePath = path.join(execPath, binaries[device]);
            const future = new Future();

            Shelljs.mkdir('-p', ipfsRoot);

            const file = Fse.createWriteStream(filePath);
            Request.get(`${assetsRoot}${binaries[device]}`).on('response', function (response) {
                /** nice message for download * */
                if (response.statusCode == 200) {
                    log.info('====Started to download IPFS binaries====');
                }
            }).on('error', function (error) {
                log.error('!!!Could not download IPFS binaries!!!');
                future.throw('could not download IPFS');
            }).pipe(file)
                .on('finish', () => {
                    log.info('====download completed...extract files...====');
        
                    /** extract contents to .private/ipfs * */
                    if (filePath.indexOf('tar') !== -1) {
                        Shelljs.exec(`tar zxvf ${filePath} -C ${execPath}`, { silent: true });
                    } else {
                        Shelljs.exec(`unzip ${filePath} ${ipfsRoot}`, { silent: true }); // @TODO need to test on win32
                    }

                    /** just to be sure that ipfs is executable * */
                    Shelljs.chmod('+x', path.join(ipfsRoot, ((process.platform == 'win32') ? 'ipfs.exe' : 'ipfs')));
                    log.info('finished');
                    this._delFile();
                    future.return(true);
                });
            return future.wait();
        }
        return false;
    }

    /**
   * write current ipfs version
   * @private
   */
    _writeToConfig () {
        writeJson(path.join(execPath, configFile), { version: binariesVersion }, Meteor.bindEnvironment((error) => {
            if (error) {
                log.error('could not write to ipfs.json');
            } else {
                this.config = { version: binariesVersion };
            }
        }));
    }

    /**
   * check if <code>ipfs init</code>
   * @returns {*|any}
   * @private
   */
    _checkIpfsConfig () {
        const future = new Future();
        Fse.stat(path.join(homeDir, '.ipfs/config'), Meteor.bindEnvironment((err, stats) => {
            if (err) {
                future.return(false);
            } else {
                future.return(true);
            }
        }));
        return future.wait();
    }

    stop () {
        this._kill();
        this.ipfsConnector = false;
    }

    /**
   * kill child process & cleanup
   * @private
   */
    _kill () {
        this.ipfsProcess.kill();
    }

    /**
   * delete ipfs archives
   * @private
   */
    _delFile () {
        Shelljs.rm('-rf', path.join(execPath, 'go-ipfs_v*'));
    }

    /**
   *
   * @param level from $logLevels
   */
    setLogLevel (level = 'info') {
        if (logLevels.indexOf(level) != -1) {
            log.setLevel(level);
        } else {
            log.error('level not from logLevels ', logLevels);
        }
    }
};
