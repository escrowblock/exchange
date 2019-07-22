import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.Talk.onRendered(function () {
    if (this.data && this.data.Talk) {
        Meteor.call('setReadMessage', this.data.Talk._id);
    }
  
    const feed = this.find('.talks .scroll-pane .feed');

    if (feed) {
        $('.talks .scroll-pane').css({ height: Number($(window).height()).valueOf() - Number($('#bodyMessage')[0].scrollHeight).valueOf() - 150 });
        const pane = $('.talks .scroll-pane');
        pane.jScrollPane({ showArrows: true, autoReinitialise: true });
        pane.data('jsp').reinitialise();
        pane.data('jsp').scrollToBottom();
        
        const contentPane = pane.data('jsp').getContentPane();
        contentPane.append(
            $('.talks .scroll-pane .feed')[0],
        );
    
        feed._uihooks = {
            insertElement (node, next) {
                $(node).insertBefore(next);
                setTimeout(function() {
                    const pane = $('.talks .scroll-pane');
                    pane.data('jsp').reinitialise();
                    pane.data('jsp').scrollToBottom();
                }, 1000);
        
                contentPane.append(
                    $('.talks .scroll-pane .feed')[0],
                );
            },
        };
    }
});
