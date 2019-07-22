import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

Template.Indicators.onDestroyed(function() {
    if (!_.isUndefined(this.subsInstrument)) {
        this.subsInstrument.stop();
    }
    if (!_.isUndefined(this.subsPrice24)) {
        this.subsPrice24.stop();
    }
    if (!_.isUndefined(this.subsAllPrice24)) {
        this.subsAllPrice24.stop();
    }
    if (!_.isUndefined(this.trackerAvailableInstrument)) {
        this.trackerAvailableInstrument.stop();
    }
    if (!_.isUndefined(this.trackerInstrumentCategory)) {
        this.trackerInstrumentCategory.stop();
    }
    if (!_.isUndefined(this.interval)) {
        this.interval = null;
    }
});
