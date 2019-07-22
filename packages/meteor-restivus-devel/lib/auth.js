let getUserQuerySelector; let passwordValidator; let
    userValidator;

this.Auth || (this.Auth = {});


/*
  A valid user will have exactly one of the following identification fields: id, username, or email
 */

userValidator = Match.Where(function(user) {
    check(user, {
        id: Match.Optional(String),
        username: Match.Optional(String),
        email: Match.Optional(String),
    });
    if (_.keys(user).length === !1) {
        throw new Match.Error('User must have exactly one identifier field');
    }
    return true;
});


/*
  A password can be either in plain text or hashed
 */

passwordValidator = Match.OneOf(String, {
    digest: String,
    algorithm: String,
});


/*
  Return a MongoDB query selector for finding the given user
 */

getUserQuerySelector = function(user) {
    if (user.id) {
        return {
            _id: user.id,
        };
    } if (user.username) {
        return {
            username: user.username,
        };
    } if (user.email) {
        return {
            'emails.address': user.email,
        };
    }
    throw new Error('Cannot create selector from invalid user');
};

this.Auth.customAttemptLogin = function(methodInvocation, methodName, methodArgs, result) {
    let attempt; let ret; let
        user;
    if (!result) {
        throw new Error('result is required');
    }
    if (!result.userId && !result.error) {
        throw new Error('A login method must specify a userId or an error');
    }
    user = null;
    if (result.userId) {
        user = Meteor.users.findOne(result.userId);
    }
    attempt = {
        type: result.type || 'unknown',
        allowed: !!(result.userId && !result.error),
        methodName,
        methodArguments: _.toArray(methodArgs),
    };
    if (result.error) {
        attempt.error = result.error;
    }
    if (user) {
        attempt.user = user;
    }
    Accounts._validateLogin(methodInvocation.connection, attempt);
    if (attempt.allowed) {
        ret = result.options || {};
        ret.type = attempt.type;
        Accounts._successfulLogin(methodInvocation.connection, attempt);
        return ret;
    }
    Accounts._failedLogin(methodInvocation.connection, attempt);
    throw attempt.error;
};

/*
  Log a user in with their password
 */

this.Auth.loginWithPassword = function(user, password, ip, headers) {
    let authToken; let authenticatingUser; let authenticatingUserSelector; let hashedToken; let passwordVerification; let preparedPassword; let
        ref;
    if (!user || !password) {
        throw new Meteor.Error(401, 'Unauthorized');
    }
    check(user, userValidator);
    check(password, passwordValidator);
    authenticatingUserSelector = getUserQuerySelector(user);
    authenticatingUser = Meteor.users.findOne(authenticatingUserSelector);
    if (!authenticatingUser) {
        throw new Meteor.Error(401, 'Unauthorized');
    }
    if (!((ref = authenticatingUser.services) != null ? ref.password : void 0)) {
        throw new Meteor.Error(401, 'Unauthorized');
    }
    passwordVerification = Accounts._checkPassword(authenticatingUser, password);
    passwordVerification.type = 'password';
    preparedPassword = _.isString(password) ? {
        digest: SHA256(password),
        algorithm: 'sha-256',
    } : password;
    Auth.customAttemptLogin({
        connection: {
            id: null,
            close () {
            },
            onClose () {
            },
            clientAddress: ip,
            httpHeaders: headers,
        },
    }, 'login', [
        {
            user,
            password: preparedPassword,
        },
    ], passwordVerification);
    authToken = Accounts._generateStampedLoginToken();
    hashedToken = Accounts._hashLoginToken(authToken.token);
    Accounts._insertHashedLoginToken(authenticatingUser._id, {
        hashedToken,
        when: authToken.when,
    });
    return {
        authToken: authToken.token,
        userId: authenticatingUser._id,
    };
};

/*
  Log a user in with external way
 */

this.Auth.loginWithExtAuth = function(serviceName, params, ip, headers) {
    let authToken; let authenticatingUserId; let hashedToken; let
        resultVerification;
    if (!_.isUndefined(Accounts._findExtUser)) {
        authenticatingUserId = Accounts._findExtUser(serviceName, params);
    } else {
        throw new Meteor.Error(401, 'Unauthorized');
    }
    resultVerification = {
        userId: authenticatingUserId,
        type: serviceName,
    };
    Auth.customAttemptLogin({
        connection: {
            id: null,
            close () {
            },
            onClose () {
            },
            clientAddress: ip,
            httpHeaders: headers,
        },
    }, 'login', [
        params,
    ], resultVerification);
    authToken = Accounts._generateStampedLoginToken();
    hashedToken = Accounts._hashLoginToken(authToken.token);
    Accounts._insertHashedLoginToken(authenticatingUserId, {
        hashedToken,
        when: authToken.when,
    });
    return {
        authToken: authToken.token,
        userId: authenticatingUserId,
    };
};
