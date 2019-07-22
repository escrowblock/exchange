import { AutoForm } from 'meteor/aldeed:autoform';
import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

AutoForm.addInputType('select-radio-buttonGroup', {
    template: 'afRadioGroup_buttonGroup',
    valueOut () {
        return this.find('input[type=radio]:checked').val();
    },
    contextAdjust (contextArg) {
        const context = contextArg;
        const itemAtts = _.omit(context.atts);

        // build items list
        context.items = [];

        // Add all defined options
        _.each(context.selectOptions, function(opt) {
            context.items.push({
                name: context.name,
                label: TAPi18n.__(opt.label),
                value: opt.value,
                // _id must be included because it is a special property that
                // #each uses to track unique list items when adding and removing them
                // See https://github.com/meteor/meteor/issues/2174
                _id: opt.value,
                selected: (opt.value === context.value),
                atts: itemAtts,
            });
        });

        return context;
    },
});

Template.afRadioGroup_buttonGroup.helpers({
    atts: function selectedAttsAdjust() {
        const atts = _.clone(this.atts);
        if (this.selected) {
            atts.checked = '';
        }
        // remove data-schema-key attribute because we put it
        // on the entire group
        delete atts['data-schema-key'];
        return atts;
    },
    dsk: function dsk() {
        return {
            'data-schema-key': this.atts['data-schema-key'],
        };
    },
});
