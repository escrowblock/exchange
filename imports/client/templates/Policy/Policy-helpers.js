import { Showdown } from 'meteor/markdown';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.Policy.helpers({
    formatBody() {
        const converter = new Showdown.converter(
            {
                parseImgDimensions: true,
                tables: true,
                simpleLineBreaks: true,
            },
        );
        return converter.makeHtml(this.body);
    },
    unlogged() {
        return !Meteor.userId();
    },
});
