let assert; let child_process; let fs; let
    path;

fs = Npm.require('fs-extra');

path = Npm.require('path');

assert = Npm.require('assert');

child_process = Npm.require('child_process');

LongRunningChildProcess = (function() {
    LongRunningChildProcess.prototype.taskName = null;

    LongRunningChildProcess.prototype.child = null;

    LongRunningChildProcess.prototype.pid = null;

    LongRunningChildProcess.prototype.dead = false;

    function LongRunningChildProcess(taskName) {
        log.debug(`LongRunningChildProcess.constructor(taskName=${taskName})`);
        this.taskName = taskName;
        this.pid = this.readPid();
    }

    LongRunningChildProcess.prototype.getTaskName = function() {
        return this.taskName;
    };

    LongRunningChildProcess.prototype.getChild = function() {
        return this.child;
    };

    LongRunningChildProcess.prototype.getPid = function() {
        return this.pid;
    };

    LongRunningChildProcess.prototype._setPid = function(pid) {
        log.debug(`LongRunningChildProcess._setPid(pid=${pid})`);
        this.pid = pid;
        log.debug(`Saving ${this.taskName} pid ${pid} to ${this._getPidFilePath()}`);
        return fs.outputFile(this._getPidFilePath(), `${pid}`);
    };

    LongRunningChildProcess.prototype.isDead = function() {
        return this.dead;
    };

    LongRunningChildProcess.prototype.isRunning = function() {
        let err; let
            pid;
        log.debug('LongRunningChildProcess.isRunning()');
        pid = this.getPid();
        if (!pid) {
            log.debug('LongRunningChildProcess.isRunning returns false');
            return false;
        }
        try {
            process.kill(pid, 0);
            log.debug('LongRunningChildProcess.isRunning returns true');
            return true;
        } catch (_error) {
            err = _error;
            log.trace(err);
            log.debug('LongRunningChildProcess.isRunning returns false');
            return false;
        }
    };

    LongRunningChildProcess.prototype._getMeteorPid = function() {
        let parentPid; let
            parentPidIndex;
        parentPid = null;
        parentPidIndex = _.indexOf(process.argv, '--parent-pid');
        if (parentPidIndex !== -1) {
            parentPid = process.argv[parentPidIndex + 1];
            log.debug(`The pid of the main Meteor app process is ${parentPid}`);
        } else if (process.env.METEOR_PARENT_PID) {
            parentPid = process.env.METEOR_PARENT_PID;
            log.debug(`The pid of the main Meteor app process is ${parentPid}`);
        } else {
            log.error('Could not find the pid of the main Meteor app process');
        }
        return parentPid;
    };

    LongRunningChildProcess.prototype._getMeteorAppPath = function() {
        if (!this.appPath) {
            this.appPath = process.env.PWD;
        }
        return this.appPath;
    };

    LongRunningChildProcess.prototype._getMeteorLocalPath = function() {
        if (Meteor.isProduction) {
            return path.join(this._getMeteorAppPath(), '');
        }
        return path.join(this._getMeteorAppPath(), '.meteor/local/build/');
    };

    LongRunningChildProcess.prototype._getPidFilePath = function() {
        return path.join(this._getMeteorLocalPath(), `run/${this.taskName}.pid`);
    };

    LongRunningChildProcess.prototype._getLogFilePath = function() {
        return path.join(this._getMeteorLocalPath(), `log/${this.taskName}.log`);
    };

    LongRunningChildProcess.prototype._getSpawnScriptPath = function() {
        return path.join(this._getMeteorLocalPath(), 'programs/server/assets/packages/sanjo_long-running-child-process/lib/spawnScript.js');
    };

    LongRunningChildProcess.prototype.readPid = function() {
        let err; let
            pid;
        log.debug('LongRunningChildProcess.readPid()');
        try {
            pid = parseInt(fs.readFileSync(this._getPidFilePath(), {
                encoding: 'utf8',
            }, 10));
            log.debug(`LongRunningChildProcess.readPid returns ${pid}`);
            return pid;
        } catch (_error) {
            err = _error;
            log.debug('LongRunningChildProcess.readPid returns null');
            return null;
        }
    };

    LongRunningChildProcess.prototype.spawn = function(options) {
        let command; let commandArgs; let env; let logFile; let nodeDir; let nodePath; let spawnOptions; let spawnScript; let
            stdio;
        log.debug('LongRunningChildProcess.spawn()', options);
        check(options, Match.ObjectIncluding({
            command: String,
            args: [Match.Any],
            options: Match.Optional(Match.ObjectIncluding({
                cwd: Match.Optional(Match.OneOf(String, void 0)),
                env: Match.Optional(Object),
                stdio: Match.Optional(Match.OneOf(String, [Match.Any])),
            })),
        }));
        if (!options.options) {
            options.options = {};
        }
        if (this.isRunning()) {
            return false;
        }
        logFile = this._getLogFilePath();
        fs.ensureDirSync(path.dirname(logFile));
        if (options.options.stdio) {
            stdio = options.options.stdio;
        } else {
            this.fout = fs.openSync(logFile, 'w');
            stdio = ['ignore', this.fout, this.fout];
        }
        nodePath = process.execPath;
        nodeDir = path.dirname(nodePath);
        env = _.clone(options.options.env || process.env);
        env.PATH = `${nodeDir}:${env.PATH || process.env.PATH}`;
        if (process.env.LONG_RUNNING_CHILD_PROCESS_LOG_LEVEL && !env.LONG_RUNNING_CHILD_PROCESS_LOG_LEVEL) {
            env.LONG_RUNNING_CHILD_PROCESS_LOG_LEVEL = process.env.LONG_RUNNING_CHILD_PROCESS_LOG_LEVEL;
        }
        spawnOptions = {
            cwd: options.options.cwd || this._getMeteorAppPath(),
            env,
            detached: true,
            stdio,
        };
        command = path.basename(options.command);
        spawnScript = this._getSpawnScriptPath();
        commandArgs = [spawnScript, this._getMeteorPid(), this._getPidFilePath(), this.taskName, options.command].concat(options.args);
        fs.chmodSync(spawnScript, 0x164);
        log.debug(`LongRunningChildProcess.spawn is spawning '${command}'`);
        this.child = child_process.spawn(nodePath, commandArgs, spawnOptions);
        this.dead = false;
        this._setPid(this.child.pid);
        this.child.on('exit', (function(_this) {
            return function(code) {
                log.debug(`LongRunningChildProcess: child_process.on 'exit': command=${command} code=${code}`);
                if (_this.fout) {
                    return fs.closeSync(_this.fout);
                }
            };
        }(this)));
        return true;
    };

    LongRunningChildProcess.prototype.kill = function(signal) {
        let err; let
            pid;
        if (signal == null) {
            signal = 'SIGINT';
        }
        log.debug(`LongRunningChildProcess.kill(signal=${signal})`);
        if (!this.dead) {
            try {
                if (this.child != null) {
                    this.child.kill(signal);
                } else {
                    pid = this.getPid();
                    process.kill(pid, signal);
                }
                this.dead = true;
                this.pid = null;
                return fs.removeSync(this._getPidFilePath());
            } catch (_error) {
                err = _error;
                return log.warn('Error: While killing process:\n', err);
            }
        }
    };

    return LongRunningChildProcess;
}());

if (process.env.IS_MIRROR === 'true') {
    LongRunningChildProcess.fs = fs;
    LongRunningChildProcess.path = path;
    LongRunningChildProcess.assert = assert;
    LongRunningChildProcess.child_process = child_process;
}
