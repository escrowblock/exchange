import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.AdminLayout.onCreated(function() {
    const self = this;

    self.minHeight = new ReactiveVar($(window).height() - $('.main-header').height());

    $(window).resize(function () {
        self.minHeight.set($(window).height() - $('.main-header').height());
    });

    $('body').addClass('fixed');
  
    this.subscribe('adminCollectionsCount');
    this.subscribe('adminUsers');
});
