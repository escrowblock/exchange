import Cookies from 'js-cookie';
import { getCategoryByInstrumentSymbol } from '/imports/tools';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

Template.Indicators.onCreated(function () {
    const template = this;
  
    // Initial states
    let currentInstrumentSymbol = '';
    if (document.location.hash.substr(1)) {
        const hash = document.location.hash.substr(1).split('=');
        if (hash[0] == 'IS') {
            [, currentInstrumentSymbol] = hash;
        }
    }
    if (currentInstrumentSymbol == '') {
        currentInstrumentSymbol = Cookies.get('currentInstrumentSymbol') ? Cookies.get('currentInstrumentSymbol') : 'BTC_USD';
    }
  
    const symbol = String(currentInstrumentSymbol).split('_');
    const InstrumentCategory = getCategoryByInstrumentSymbol({ Product1Symbol: symbol[0], Product2Symbol: symbol[1] }, Meteor.userId(), currentInstrumentSymbol);
    Session.setPersistent('InstrumentCategory', InstrumentCategory);
    Session.setPersistent('homeInstrumentCategory', InstrumentCategory);
  
    // need to change after category
    Session.setPersistent('currentInstrumentSymbol', currentInstrumentSymbol);
     
    if (_.isUndefined(Session.get('currentInterval'))) {
        Session.setPersistent('currentInterval', Cookies.get('currentInterval') ? Cookies.get('currentInterval') : '1h');
    }
  
    if (_.isUndefined(Session.get('themeMode'))) {
        Session.setPersistent('themeMode', Cookies.get('themeMode') ? Cookies.get('themeMode') : 'sun');
    }
  
    template.tracker = Tracker.autorun(function() {
        if (Session.get('currentInstrumentSymbol')) {
            template.subsPrice24 = template.subscribe('Price24', Session.get('currentInstrumentSymbol'));
        }

        if (Session.get('InstrumentCategory')) {
            template.subsInstrument = template.subscribe('AvailableInstrument', Session.get('InstrumentCategory'));
            template.subsAllPrice24 = template.subscribe('AllPrice24', Session.get('InstrumentCategory'));
        }
    });

    template.interval = setInterval(() => {
        Session.set('currentTime', new Date());
    }, 1000);
});
