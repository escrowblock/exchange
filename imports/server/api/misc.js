import crypto from 'crypto';
import { api_key } from '/imports/collections';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

const checkSigned = (bodyParamsArg) => {
    const serverTime = new Date().getTime();
    const bodyParams = Object.assign({}, bodyParamsArg);
    bodyParams.recvWindow = Number(bodyParams.recvWindow).valueOf();
    if (!bodyParams.recvWindow) {
        bodyParams.recvWindow = 5000;
    }
    check(bodyParams.recvWindow, Number);

    bodyParams.timestamp = Number(bodyParams.timestamp).valueOf();
    check(bodyParams.timestamp, Number);

    return !(bodyParams.timestamp < (serverTime + 1000) && (serverTime - bodyParams.timestamp) <= bodyParams.recvWindow);
};

export { checkSigned };

const checkProtected = (bodyParams, userId) => {
    try {
        if (_.isUndefined(api_key.findOne({ UserId: userId }, { fields: { Secret: 1 } }))) {
            throw new Meteor.Error(403, '');
        }
        const secret = api_key.findOne({ UserId: userId }, { fields: { Secret: 1 } }).Secret;
        const hmac = crypto.createHmac('sha256', secret);
        const map = [];
        const entries = Object.entries(bodyParams);
        for (let i = 0; i < entries.length; i += 1) {
            const [key, value] = entries[i];
            if (key !== 'signature') {
                map.push(`${key}=${value}`);
            }
        }
        hmac.update(map.join('&'));
          
        if (bodyParams.signature !== hmac.digest('hex')) {
            throw new Meteor.Error(403, '');
        }
    } catch (e) {
        return true;
    }
    return false;
};

export { checkProtected };
