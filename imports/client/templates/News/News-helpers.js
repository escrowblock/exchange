import { moment } from 'meteor/momentjs:moment';
import { Showdown } from 'meteor/markdown';
import { Template } from 'meteor/templating';

Template.News.helpers({
    notEmpty() {
        return this.news.count();
    },
});

Template.NewsItem.helpers({
    formatBody () {
        const converter = new Showdown.converter({ parseImgDimensions: true, tables: true, simpleLineBreaks: true });
        return converter.makeHtml(this.body);
    },
    date() {
        return moment(this.created).format('Do MMM YYYY hh:mm A');
    },
});
