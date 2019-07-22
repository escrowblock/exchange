import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';

Template.Home.onCreated(function() {
    const template = this;
    template.trackerAllPrice24 = Tracker.autorun(function() {
        if (Session.get('homeInstrumentCategory')) {
            template.subsInstrument = template.subscribe('AvailableInstrument', Session.get('homeInstrumentCategory'));
            template.subsAllPrice24 = template.subscribe('AllPrice24', Session.get('homeInstrumentCategory'));
        }
    });
});
