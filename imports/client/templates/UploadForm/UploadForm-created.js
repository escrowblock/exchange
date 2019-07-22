import { modalAlert } from '/imports/modal';
import { user_files, talk } from '/imports/collections';
import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { encryptMessage } from '/imports/cryptoTalkTools';
import pako from 'pako';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import { ReactiveVar } from 'meteor/reactive-var';

Template.UploadForm.onCreated(function() {
    const self = this;
    this.error = new ReactiveVar(false);
    this.uploadQTY = 0;
    this.showSettings = new ReactiveVar(false);
    this.showProgress = new ReactiveVar(false);
    Session.set('uploads', new ReactiveVar(false));
    Session.set('upload_files', new ReactiveVar([]));
    Session.set('unlist', new ReactiveVar(true));
    Session.set('secured', new ReactiveVar(false));
    Session.set('userOnly', new ReactiveVar(false));
    Session.set('storeTTL', 86400000);
    Session.set('storeTTLUser', 432000000);
    Session.set('showProjectInfo', new ReactiveVar(false));

    this.initiateUpload = function(event, _files, talkId = 0) {
        let secured; let ttl; let unlisted;
        if (Session.get('uploads').get()) {
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
        self.uploadQTY = _files.length;
        const cleanUploaded = function(current) {
            self.showProgress.set(false);
            const _uploads = _.clone(Session.get('uploads').get());
            if (_.isArray(_uploads)) {
                _.each(_uploads, function(upInst, index) {
                    if (upInst.file.name === current.file.name) {
                        _uploads.splice(index, 1);
                        if (_uploads.length) {
                            Session.get('uploads').set(_uploads);
                        } else {
                            self.uploadQTY = 0;
                            Session.get('uploads').set(false);
                        }
                    }
                });
            }
            $('input[name="fileInput"]').val('');
            return null;
        };
        const uploads = [];
        Session.set('transport', 'ddp');
        const created_at = +(new Date());
        if (Meteor.userId()) {
            secured = Session.get('secured').get();
            if (!_.isBoolean(secured)) {
                secured = false;
            }
            if (secured) {
                unlisted = true;
            } else {
                unlisted = Session.get('unlist').get();
                if (!_.isBoolean(unlisted)) {
                    unlisted = true;
                }
            }
            ttl = new Date(created_at + Session.get('storeTTLUser'));
        } else {
            unlisted = false;
            secured = false;
            ttl = new Date(created_at + Session.get('storeTTL'));
        }
        const identity = talk.findOne({ _id: talkId }).Identity;
        if (!identity) {
            return false;
        }
        let channelIdentity;
        
        const values = Object.values(identity);
        for (let i = 0; i < values.length; i += 1) {
            if (values[i].UserId == Meteor.userId()) { // @TODO after Metamask will add decrypt implementation

            }
            if (values[i].UserId == 'Plain') {
                channelIdentity = EJSON.parse(values[i].Body);
            }
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
                }).then(content => encryptMessage(Buffer.from(pako.deflate(content)).toString('hex'), channelIdentity)).then(Meteor.bindEnvironment((encryptedMessage) => {
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
                        transport: Session.get('transport'),
                    }, false)
                        .on('end', function(error, fileObj) {
                            if (!error && _files.length === 1) {
                                const _userFiles = Session.get('upload_files');
                                const _reactive_userFiles = _userFiles.get();
                                _reactive_userFiles.push(fileObj);
                                _userFiles.set(_reactive_userFiles);
                                Session.set('upload_files', _userFiles);
                                Session.set('userFiles', _reactive_userFiles);
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
                            Session.get('uploads').set(uploads);
                        })
                        .start();
                }));
            });
        }
        return null;
    };
});
