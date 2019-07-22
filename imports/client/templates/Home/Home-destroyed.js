import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

Template.Home.onDestroyed(function() {
    if (!_.isUndefined(this.subsAllPrice24)) {
        this.subsAllPrice24.stop();
    }
    if (!_.isUndefined(this.subsInstrument)) {
        this.subsInstrument.stop();
    }
    if (!_.isUndefined(this.trackerAllPrice24)) {
        this.trackerAllPrice24.stop();
    }
});
