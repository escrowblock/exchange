import { moment } from 'meteor/momentjs:moment';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { Session } from 'meteor/session';

Template.UploadForm.helpers({
    error() {
        return Template.instance().error.get();
    },
    uploaded_files() {
        return Session.get('userFiles');
    },
    status() {
        let estimateDuration; let i; let j; let len; let onPause; let progress; let upload;
        i = 0;
        const uploads = !_.isUndefined(window.globalDict.get('uploads')) ? window.globalDict.get('uploads').get() : 0;
        progress = 0;
        const { uploadQTY } = Template.instance();
        estimateDuration = 0;
        onPause = false;
        if (uploads) {
            for (j = 0, len = uploads.length; j < len; j += 1) {
                upload = uploads[j];
                onPause = upload.onPause.get();
                progress += upload.progress.get();
                estimateDuration += upload.estimateTime.get();
                i += 1;
            }
            if (i < uploadQTY) {
                progress += 100 * (uploadQTY - i);
            }
            progress = Math.ceil(progress / uploadQTY);
            estimateDuration = (function() {
                let hours; let minutes; let seconds;
                const duration = moment.duration(Math.ceil(estimateDuration / i));
                hours = `${duration.hours()}`;
                if (hours.length <= 1) {
                    hours = `0${hours}`;
                }
                minutes = `${duration.minutes()}`;
                if (minutes.length <= 1) {
                    minutes = `0${minutes}`;
                }
                seconds = `${duration.seconds()}`;
                if (seconds.length <= 1) {
                    seconds = `0${seconds}`;
                }
                return `${hours}:${minutes}:${seconds}`;
            }());
            return {
                progress,
                estimateDuration,
                onPause,
            };
        }
        return false;
    },
});
