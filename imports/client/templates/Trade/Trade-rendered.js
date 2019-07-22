import { $ } from 'meteor/jquery';
import { price_latest } from '/imports/collections';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

Template.Trade.onRendered(function () {
    const template = this;
    Session.setPersistent('showDepth', false);
    $('.menu.chartsTab .item').tab({
        onVisible(tabPath) {
            if (tabPath == 'depth') {
                Session.setPersistent('showDepth', true);
            } else {
                Session.setPersistent('showDepth', false);
            }
        },
    });
    $('.ui.dropdown.chartPeriod').dropdown({
        clearable: true,
        placeholder: '*',
    });
    $('.ui.dropdown.chartPeriod').dropdown('set selected', Session.get('currentInterval'));
    $('.menu.orderTypeTab .item').tab();
    $('.menu.historyTab .item').tab();
  
    template.trackerBookTable = Tracker.autorun(function(computation) {
        if (price_latest.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') })) {
            computation.stop();
            $('#bookTable').scrollTop((($('#askRows').height() + $('#bidRows').height() + $('#bookSpread').height()) / 2) - 150);
        }
    });
});
