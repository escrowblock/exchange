import { tryFillOrder, calculateAlgoOrders } from '/imports/tools';
import { Job } from 'meteor/vsivsi:job-collection';
import { myJobs } from '/imports/collections';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';

// Can be scalled by scheme https://github.com/vsivsi/meteor-job-collection
// The first optimization can be done by the splitting on queues by instruments
// Clean old jobs
new Job(myJobs, 'cleanup', {}).repeat({
    schedule: myJobs.later.parse.text('every 5 minutes'),
}).save({
    cancelRepeats: true,
});

const q = myJobs.processJobs('cleanup', {
    pollInterval: false,
    workTimeout: 60 * 1000,
}, function(job, cb) {
    const current = new Date();
    current.setMinutes(current.getMinutes() - 5);
    const ids = myJobs.find({
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
        myJobs.removeJobs(ids);
    }
    job.done(`Removed ${ids.length} old jobs`);
    return cb();
});

myJobs.find({
    type: 'cleanup',
    status: 'ready',
}).observe({
    added() {
        return q.trigger();
    },
});

if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
    // myJobs.setLogStream(process.stdout);
}

const qFill = myJobs.processJobs('Fill', {
    pollInterval: 1000000000, // Don't poll
},
function (job, cb) {
    const { data } = job;
    // console.log('fill order online ' + data.OrderId);
    tryFillOrder(data.OrderId, function() {
        job.done(`order done OrderId is ${data.OrderId}`);
        cb();
    });
});

myJobs.find({ type: 'Fill', status: 'ready' }).observe({
    added () {
        qFill.trigger();
    },
});

// by time
myJobs.processJobs('Fill', {
    pollInterval: 1000, // every second
},
function (job, cb) {
    const { data } = job;
    // console.log('fill order by time ' + data.OrderId);
    tryFillOrder(data.OrderId, function() {
        job.done(`order done OrderId is ${data.OrderId}`);
        cb();
    });
});

const qAlgo = myJobs.processJobs('Algo', {
    pollInterval: 1000000000, // Don't poll
},
function (job, cb) {
    const { data } = job;
    // console.log('algo order ' + data.trade._id);
    calculateAlgoOrders(data.currentDate, data.trade, function() {
        // console.log('trade done ' + data.trade._id);
        job.done(`trade done _id ${data.trade._id}`);
        cb();
    });
});

myJobs.find({ type: 'Algo', status: 'ready' }).observe({ added () { qAlgo.trigger(); } });
