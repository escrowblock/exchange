import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

Template.UploadForm.events({
    'change input[name="fileInput"]'(event, templateInstance) {
        if ($(templateInstance.find('input[name="fileInput"]')).val()) {
            return $(templateInstance.find('form#uploadFile')).submit();
        }
        return false;
    },
    'submit form#uploadFile'(event, templateInstance) {
        event.preventDefault();
        templateInstance.error.set(false);
        $('#attachFileToTalk').attr('disabled', 'disabled').addClass('loading');
        templateInstance.initiateUpload(event, event.currentTarget.fileInput.files, $('#talk_id').val());
        return false;
    },
    'click .dropZone'(event, templateInstance) {
        $(templateInstance.find('input')).click();
    },
    'dragenter .dropZone'(event) {
        event.preventDefault();
        $(event.currentTarget).addClass('dropOverHighlight');
    },
    'dragleave .dropZone'(event) {
        event.preventDefault();
        $(event.currentTarget).removeClass('dropOverHighlight');
    },
    'dragover .dropZone'(event) {
        event.preventDefault();
        $(event.currentTarget).addClass('dropOverHighlight');
    },
    'drop .dropZone'(event, templateInstance) {
        event.preventDefault();
        $(event.currentTarget).removeClass('dropOverHighlight');
        const oEvent = event.originalEvent;
        const files = oEvent.dataTransfer && oEvent.dataTransfer.files;
        templateInstance.error.set(false);
        templateInstance.initiateUpload(event, files);
    },
    'click .remove-file'(event, templateInstance) {
        let target;
        if (!$(event.target).hasClass('remove-file')) {
            target = $(event.target).closest('.remove-file');
        } else {
            target = $(event.target);
        }
        
        const fileId = target.data('id');
        
        let uploadFiles = window.globalDict.get('uploadFiles').get();
        uploadFiles = _.filter(uploadFiles, function(obj) { return obj._id != fileId; });
        window.globalDict.set('uploadFiles', new ReactiveVar(uploadFiles));
        Session.set('userFiles', uploadFiles);
        if (uploadFiles.length) {
            window.globalDict.get('uploads', new ReactiveVar(uploadFiles));
        } else {
            window.globalDict.get('uploads', new ReactiveVar(false));
            templateInstance.uploadQTY.set(0);
        }
        window.globalDict.set('uploads', new ReactiveVar(false));
        // Delete file from server
        Meteor.call('deleteFile', fileId);
    },
});
