import { modalAlert } from '/imports/modal';
import { user_files } from '/imports/collections';
import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { encryptMessage } from '/imports/cryptoTalkTools';
import pako from 'pako';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

Template.UploadForm.onCreated(function() {
    const self = this;
    this.error = new ReactiveVar(false);
    this.uploadQTY = new ReactiveVar(0);
    this.showProgress = new ReactiveVar(false);
    window.globalDict.set('uploads', new ReactiveVar(false));
    window.globalDict.set('uploadFiles', new ReactiveVar([]));
    this.storeTTLUser = 432000000;
    if (window.globalDict.get('uploadFiles').get()) {
        Session.set('userFiles', window.globalDict.get('uploadFiles').get());
    }
    this.initiateUpload = function(event, _files, talkId = 0) {
        const secured = true;
        const unlisted = true;
        if (window.globalDict.get('uploads').get()) {
            return false;
        }
        if (!_files.length) {
            self.error.set(TAPi18n.__('Please select a file to upload'));
            return false;
        }
        if (_files.length > 6) {
            self.error.set(TAPi18n.__('Please select up to 6 files'));
            return false;
        }
        self.uploadQTY.set(_files.length);
        const cleanUploaded = function(current) {
            self.showProgress.set(false);
            const _uploads = _.clone(window.globalDict.get('uploads').get());
            if (_.isArray(_uploads)) {
                _.each(_uploads, function(upInst, index) {
                    if (upInst.file.name === current.file.name) {
                        _uploads.splice(index, 1);
                        if (_uploads.length) {
                            window.globalDict.set('uploads', new ReactiveVar(_uploads));
                        } else {
                            self.uploadQTY.set(0);
                            window.globalDict.set('uploads', new ReactiveVar(false));
                        }
                    }
                });
            }
            $('input[name="fileInput"]').val('');
            $('#attachFileToTalk').removeAttr('disabled').removeClass('loading');
            return null;
        };
        const uploads = [];
        const created_at = +(new Date());
        const ttl = new Date(created_at + self.storeTTLUser);
        const channelIdentity = Session.get(`channelIdentity${talkId}`);
        if (!channelIdentity) {
            return false;
        }
        
        if (channelIdentity) {
            return _.each(_files, function(file, i) {
                // @TODO add error handling
                new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.onload = () => {
                        resolve(fr.result);
                    };
                    fr.onerror = () => {
                        fr.abort();
                        reject();
                    };
                    fr.readAsArrayBuffer(file);
                }).then((content) => {
                    const encryptedMessage = encryptMessage(Buffer.from(pako.deflate(content)).toString('hex'), channelIdentity);
                    const base64 = Buffer.from(encryptedMessage).toString('base64');

                    return user_files.insert({
                        file: base64,
                        fileName: file.name,
                        type: file.type,
                        isBase64: true,
                        meta: {
                            blamed: 0,
                            secured,
                            expireAt: ttl,
                            unlisted,
                            downloads: 0,
                            created_at: created_at - 1 - i,
                            talkId,
                        },
                        streams: 'dynamic',
                        chunkSize: 'dynamic',
                        transport: 'ddp',
                    }, false)
                        .on('end', function(error, fileObj) {
                            if (!error && _files.length === 1) {
                                const uploadFiles = window.globalDict.get('uploadFiles').get();
                                uploadFiles.push(fileObj);
                                window.globalDict.set('uploadFiles', new ReactiveVar(uploadFiles));
                                Session.set('userFiles', uploadFiles);
                            }
                            cleanUploaded(this);
                        }).on('abort', function() {
                            cleanUploaded(this);
                        }).on('error', function(error) {
                            modalAlert(TAPi18n.__('Oops, something happened'), error.reason);
                            self.error.set(`${(self.error.get() ? `${self.error.get()}<br />` : '') + this.file.name}: ${(error != null ? error.reason : null) || error}`);
                            Meteor.setTimeout(function() {
                                return self.error.set(false);
                            }, 1000);
                            cleanUploaded(this);
                        })
                        .on('start', function() {
                            uploads.push(this);
                            window.globalDict.set('uploads', new ReactiveVar(uploads));
                        })
                        .on('pause', function() {
                            if (this.onPause.get()) {
                                this.continueInterval = setInterval(this.continue, 1000);
                            } else {
                                clearInterval(this.continueInterval);
                            }
                        })
                        .start();
                });
            });
        }
        return null;
    };
});
