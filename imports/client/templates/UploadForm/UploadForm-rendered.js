import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';

Template.UploadForm.onRendered(function () {
    this.find('#ui_file_list')._uihooks = {
        insertElement (node, next) {
            $(node).insertBefore(next);
        },
    };
});
