import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
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
    'change .js-change-checkbox'(event) {
        const request = this && this.data && this.data.data && this.data.data.request;
        request.fileWorkOrderId = event.currentTarget.value;
    },
    'click .js-remove-file'(event) {
        const request = this && this.data && this.data.data && this.data.data.request;
        const fileWorkOrderId = $(event.currentTarget).data('id');

        if (request && fileWorkOrderId === request.fileWorkOrderId) {
            request.fileWorkOrderId = '';
        }

        const handlerdeletefile = function(_id_file) {
            const _userFiles = Session.get('upload_files');
            let _reactive_userFiles = _userFiles.get();
            _reactive_userFiles = _.filter(_reactive_userFiles, function(obj) { return obj._id != _id_file; });
            _userFiles.set(_reactive_userFiles);
  
            Session.set('upload_files', _userFiles);
            Session.set('userFiles', _reactive_userFiles);
  
            // Delete file from server
            Meteor.call('deleteFile', _id_file);
        };

        handlerdeletefile(fileWorkOrderId);
    },
});
