import { tryFillOrder, calculateAlgoOrders } from '/imports/tools';
import { Job } from 'meteor/vsivsi:job-collection';
import { MatchingEngineJobs } from '/imports/collections';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
// import { LongRunningChildProcess } from 'meteor/sanjo:long-running-child-process';

// Can be scalled by scheme https://github.com/vsivsi/meteor-job-collection
// The first optimization can be done by the splitting on queues by instruments
// Clean old jobs
new Job(MatchingEngineJobs, 'cleanup', {}).repeat({
    schedule: MatchingEngineJobs.later.parse.text('every 2 minutes'),
}).save({
    cancelRepeats: true,
});

const q = MatchingEngineJobs.processJobs('cleanup', {
    pollInterval: false,
    workTimeout: 60 * 1000,
}, function(job, cb) {
    const current = new Date();
    current.setMinutes(current.getMinutes() - 2);
    const ids = MatchingEngineJobs.find({
        status: {
            $in: Job.jobStatusRemovable,
        },
        updated: {
            $lt: current,
        },
    }, {
        fields: {
            _id: 1,
        },
    }).map(function(d) {
        return d._id;
    });
    if (ids.length > 0) {
        MatchingEngineJobs.removeJobs(ids);
    }
    job.done(`Removed ${ids.length} old jobs`);
    return cb();
});

MatchingEngineJobs.find({
    type: 'cleanup',
    status: 'ready',
}).observe({
    added() {
        return q.trigger();
    },
});

if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
    // MatchingEngineJobs.setLogStream(process.stdout);
}

const qFill = MatchingEngineJobs.processJobs('Fill', {
    pollInterval: false,
},
function (job, cb) {
    const { data } = job;
    if (Meteor.isTest) {
        console.log(`fill order started ${data.OrderId}`);
    }
    tryFillOrder(data.OrderId, function() {
        if (Meteor.isTest) {
            console.log(`fill order done ${data.OrderId}`);
        }
        job.done(`order done OrderId is ${data.OrderId}`);
        cb();
    });
});

MatchingEngineJobs.find({ type: 'Fill', status: 'ready' }).observe({
    added () {
        qFill.trigger();
    },
});

/*
// by time
MatchingEngineJobs.processJobs('Fill', {
    pollInterval: 100, // every miliseconds
},
function (job, cb) {
    const { data } = job;
    if (Meteor.isTest) {
        console.log('fill order started ' + data.OrderId);
    }
    tryFillOrder(data.OrderId, function() {
        if (Meteor.isTest) {
            console.log('fill order done ' + data.OrderId);
        }
        job.done(`order done OrderId is ${data.OrderId}`);
        cb();
    });
});
*/

const qAlgo = MatchingEngineJobs.processJobs('Algo', {
    pollInterval: false,
},
function (job, cb) {
    const { data } = job;
    if (Meteor.isTest) {
        console.log(`algo trade started ${data.trade._id}`);
    }
    calculateAlgoOrders(data.currentDate, data.trade, function() {
        if (Meteor.isTest) {
            console.log(`algo trade done ${data.trade._id}`);
        }
        job.done(`trade done _id ${data.trade._id}`);
        cb();
    });
});

MatchingEngineJobs.find({ type: 'Algo', status: 'ready' }).observe({
    added () {
        qAlgo.trigger();
    },
});

/*
// by time
MatchingEngineJobs.processJobs('Algo', {
    pollInterval: 100, // every 100 miliseconds
},
function (job, cb) {
    const { data } = job;
    if (Meteor.isTest) {
        console.log('algo trade started ' + data.trade._id);
    }
    calculateAlgoOrders(data.currentDate, data.trade, function() {
        if (Meteor.isTest) {
            console.log('algo trade done ' + data.trade._id);
        }
        job.done(`trade done _id ${data.trade._id}`);
        cb();
    });
});
*/
/*
// @TODO on v2
//Distributed strategy for Matching Engine
const path = Npm.require('path');
const execPath = path.join(`${process.env.PWD}/`, '.private');
const executable = path.join(execPath, 'MatchingEngineWorker.js');

const workerProcess = new LongRunningChildProcess(`MatchingEngineWorker`);
const puppeteerWorkerProcess = [];

const env = {"METEOR_TOKEN": "xUNCVLCx6P/ZUT5TngLOSZcussFcCRxYOS4Gb0sU7NE=",
             "REDIS_PORT": Meteor.settings.redisOplog.redis.port,
             "REDIS_HOST": Meteor.settings.redisOplog.redis.host
            };

if (!_.isUndefined(Meteor.settings.redisOplog.redis.password)) {
    env.REDIS_PASSWORD = Meteor.settings.redisOplog.redis.password;
}

//METEOR_TOKEN - here need to add Auth token directly to the table
puppeteerWorkerProcess.push(
    workerProcess.spawn({"command": "node",
                         "args": [executable],
                         "options": {"env": env,
                                     "stdio": (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) ? "inherit": "ignore"
                                    }
                        })
);
*/
