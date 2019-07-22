import { $ } from 'meteor/jquery';
import { instrument } from '/imports/collections';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

Template.Indicators.onRendered(function () {
    const template = this;

    template.trackerInstrumentCategory = Tracker.autorun(function(computation) {
        if (Session.get('currentInstrumentSymbol')) {
            computation.stop();
      
            $(`.instrumentCategory[data-tab="${Session.get('InstrumentCategory')}"]`).addClass('active');
            $.tab('change tab', Session.get('InstrumentCategory'));
        }
    });
 
    template.trackerAvailableInstrument = Tracker.autorun(function(computation) {
        if (instrument.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') })) {
            computation.stop();
            $('.ui.dropdown.instrumentSymbol').dropdown('set selected', Session.get('currentInstrumentSymbol'));
        }
    });
  
    $('table.instrument').tablesort();
  
    const InstrumentSymbolSearch = Session.get('InstrumentSymbolSearch');
    $('#InstrumentSymbolSearch').val(InstrumentSymbolSearch || '');
  
    /*
    $('.instrumentSymbol .scroll-pane').jScrollPane({ showArrows: true, autoReinitialise: false});
    $('.instrumentSymbol div[data-tab="eth"] .scroll-pane').data('jsp').reinitialise();
    */
});
