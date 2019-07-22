import { Showdown } from 'meteor/markdown';
import { Template } from 'meteor/templating';

Template.About.helpers({
    formatBodyAbout () {
        const converter = new Showdown.converter({ parseImgDimensions: true, tables: true, simpleLineBreaks: true });
        return converter.makeHtml(this.about.body);
    },
    formatBody () {
        const converter = new Showdown.converter({ parseImgDimensions: true, tables: true, simpleLineBreaks: true });
        return converter.makeHtml(this.body);
    },
});
