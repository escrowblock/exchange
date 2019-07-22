// Publish
Meteor.publish('userOTP', function () {
    if (this.userId) {
        return Meteor.users.find({ _id: this.userId },
            { fields: { 'onePassCode.activated': 1, 'onePassCode.onLogin': 1, 'onePassCode.lastCheckDate': 1 } });
    }
    this.ready();
});

// Methods
const speakeasy = Npm.require('speakeasy');
const qrcode = Npm.require('qrcode');

Meteor.methods({
    initOTP (name) {
        if (!this.userId) {
            throw new Meteor.Error(403, 'Can only be called by a connected user.');
        }
        const secret = speakeasy.generateSecret();
        const absoluteUrl = Meteor.absoluteUrl().replace('https://', '').replace('/', '');
        const otpURL = `otpauth://totp/${absoluteUrl}:${name}?secret=${secret.base32}&issuer=${absoluteUrl}`;
        Meteor.users.update(this.userId,
            {
                $set: {
                    onePassCodeTmp:
              { secret, activated: true },
                },
            });

        const image = new Promise((resolve) => {
            qrcode.toDataURL(otpURL, function(err, result) {
                resolve(result);
            });
        }).await();

        return { otpURL, otpImage: image, otpCode: secret.base32 };
    },
    activeOTP () {
        if (!this.userId) {
            throw new Meteor.Error(403, 'Can only be called by a connected user.');
        }
        const currentUser = Meteor.users.findOne(this.userId, { fields: { onePassCodeTmp: 1 } });
        currentUser.onePassCodeTmp.lastCheckDate = moment('2000-01-01').toDate();
        currentUser.onePassCodeTmp.fail = 0;
        currentUser.onePassCodeTmp.lastFail = moment('2000-01-01').toDate();
        Meteor.users.update(this.userId, { $set: { onePassCode: currentUser.onePassCodeTmp }, $unset: { onePassCodeTmp: '' } });
    },
    cancelInitOTP () {
        if (!this.userId) {
            throw new Meteor.Error(403, 'Can only be called by a connected user.');
        }
        Meteor.users.update(this.userId, { $unset: { onePassCodeTmp: '', onePassCode: '' } });
    },
    checkOTP (code, tmp) {
        if (!this.userId) {
            throw new Meteor.Error(403, 'Can only be called by a connected user.');
        }
        const profileForFailCheck = Meteor.users.findOne(this.userId, { fields: { onePassCode: 1 } });
        // pause on 20 minutes after 3 fails
        if (profileForFailCheck.fail >= 3
        && new Date().getTime() - new Date(profileForFailCheck.lastFail).getTime() < 20 * 60 * 1000) {
            throw new Meteor.Error(403, 'Try after 20 minutes due to 3 fails.');
        } else if (profileForFailCheck.fail >= 3) {
            Meteor.users.update(this.userId, { $set: { 'onePassCode.fail': 0, 'onePassCode.lastFail': new Date() } });
        }
        let profileOTP = null;
        if (tmp) {
            profileOTP = Meteor.users.findOne(this.userId, { fields: { onePassCodeTmp: 1 } }).onePassCodeTmp;
        } else {
            profileOTP = Meteor.users.findOne(this.userId, { fields: { onePassCode: 1 } }).onePassCode;
        }
        const result = speakeasy.totp.verify({ secret: profileOTP.secret.base32, encoding: 'base32', token: code });
        if (!tmp) {
            // If user has just validate an OTP, set the last check date to now!
            if (result) {
                Meteor.users.update(this.userId, { $set: { 'onePassCode.lastCheckDate': new Date() }, $unset: { 'onePassCode.onLogin': '' } });
            } else {
                Meteor.users.update(this.userId, { $inc: { 'onePassCode.fail': 1 }, $set: { 'onePassCode.lastFail': new Date() } });
            }
        }
        return result;
    },
});
