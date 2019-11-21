import { node, schemas } from '/imports/collections.js';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import { Email } from 'meteor/email';
import { check, Match } from 'meteor/check';
  
Meteor.methods({
    sendSupport (docArg) {
        let doc = docArg;
        doc = doc.insertDoc;

        // @DEBUG
        if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
            console.debug(EJSON.stringify(doc));
        }
        //

        check(doc, schemas.support);

        // Build the e-mail text
        const text = `Name: ${doc.name}\n\n Email: ${doc.email}\n\n\n\n${doc.message}`;

        try {
            // Send the e-mail
            Email.send({
                to: Meteor.settings.public.contactmail,
                from: doc.email,
                subject: `ESCB exchange Contact Form - Message From ${doc.name}`,
                text,
            });
        } catch (e) {
            console.error(EJSON.stringify(e));
            return e;
        }

        return true;
    },
    loadContract (name) {
        try {
            /* eslint-disable */ 
            return Assets.getText(`contracts/${name}.json`);
            /* eslint-enable */
        } catch (e) {
            console.error('Wrong contract name.');
            return '';
        }
    },
    getTutorial (source, language) {
        check(language, Match.Maybe(String));
        const _params = { Type: `tutorial_${source}` };
        if (!_.isEmpty(language)) {
            _params.$or = [{ Language: language }, { Language: { $exists: false } }];
        }
        return node.findOne(_params);
    },
});
