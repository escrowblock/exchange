let DefaultAuthApi; let LegacyDefaultAuthApi; let LegacyNoDefaultAuthApi; let
    NoDefaultAuthApi;

DefaultAuthApi = new Restivus({
    apiPath: 'default-auth',
    useDefaultAuth: true,
});

NoDefaultAuthApi = new Restivus({
    apiPath: 'no-default-auth',
    useDefaultAuth: false,
});

LegacyDefaultAuthApi = new Restivus({
    apiPath: 'legacy-default-auth',
    useAuth: true,
});

LegacyNoDefaultAuthApi = new Restivus({
    apiPath: 'legacy-no-default-auth',
    useAuth: false,
});

describe('Authentication', function() {
    it('can be required even when the default endpoints aren\'t configured', function(test, waitFor) {
        let startTime;
        NoDefaultAuthApi.addRoute('require-auth', {
            authRequired: true,
        }, {
            get() {
                return {
                    data: 'test',
                };
            },
        });
        startTime = new Date();
        return HTTP.get(Meteor.absoluteUrl('no-default-auth/require-auth'), waitFor(function(error, result) {
            let durationInMilliseconds; let
                response;
            response = result.data;
            test.isTrue(error);
            test.equal(result.statusCode, 401);
            test.equal(response.status, 'error');
            durationInMilliseconds = new Date() - startTime;
            return test.isTrue(durationInMilliseconds >= 500);
        }));
    });
    describe('The default authentication endpoints', function() {
        let email; let emailLoginToken; let password; let token; let userId; let
            username;
        token = null;
        emailLoginToken = null;
        username = 'test';
        email = 'test@ivus.com';
        password = 'password';
        Meteor.users.remove({
            username,
        });
        userId = Accounts.createUser({
            username,
            email,
            password,
        });
        it('should only be available when configured', function(test, waitFor) {
            HTTP.post(Meteor.absoluteUrl('default-auth/login'), {
                data: {
                    user: username,
                    password,
                },
            }, waitFor(function(error, result) {
                let response;
                response = result.data;
                test.equal(result.statusCode, 200);
                test.equal(response.status, 'success');
                test.equal(response.data.userId, userId);
                return test.isTrue(response.data.authToken);
            }));
            HTTP.post(Meteor.absoluteUrl('no-default-auth/login'), {
                data: {
                    user: username,
                    password,
                },
            }, waitFor(function(error, result) {
                let ref; let ref1; let
                    response;
                response = result.data;
                test.isUndefined(response != null ? (ref = response.data) != null ? ref.userId : void 0 : void 0);
                return test.isUndefined(response != null ? (ref1 = response.data) != null ? ref1.authToken : void 0 : void 0);
            }));
            HTTP.post(Meteor.absoluteUrl('legacy-default-auth/login'), {
                data: {
                    user: username,
                    password,
                },
            }, waitFor(function(error, result) {
                let response;
                response = result.data;
                test.equal(result.statusCode, 200);
                test.equal(response.status, 'success');
                test.equal(response.data.userId, userId);
                return test.isTrue(response.data.authToken);
            }));
            return HTTP.post(Meteor.absoluteUrl('legacy-no-default-auth/login'), {
                data: {
                    user: username,
                    password,
                },
            }, waitFor(function(error, result) {
                let ref; let ref1; let
                    response;
                response = result.data;
                test.isUndefined(response != null ? (ref = response.data) != null ? ref.userId : void 0 : void 0);
                return test.isUndefined(response != null ? (ref1 = response.data) != null ? ref1.authToken : void 0 : void 0);
            }));
        });
        it('should allow a user to login', function(test, waitFor) {
            HTTP.post(Meteor.absoluteUrl('default-auth/login'), {
                data: {
                    username,
                    password,
                },
            }, waitFor(function(error, result) {
                let response;
                response = result.data;
                test.equal(result.statusCode, 200);
                test.equal(response.status, 'success');
                test.equal(response.data.userId, userId);
                return test.isTrue(response.data.authToken);
            }));
            HTTP.post(Meteor.absoluteUrl('default-auth/login'), {
                data: {
                    email,
                    password,
                },
            }, waitFor(function(error, result) {
                let response;
                response = result.data;
                test.equal(result.statusCode, 200);
                test.equal(response.status, 'success');
                test.equal(response.data.userId, userId);
                return test.isTrue(response.data.authToken);
            }));
            HTTP.post(Meteor.absoluteUrl('default-auth/login'), {
                data: {
                    user: username,
                    password,
                },
            }, waitFor(function(error, result) {
                let response;
                response = result.data;
                test.equal(result.statusCode, 200);
                test.equal(response.status, 'success');
                test.equal(response.data.userId, userId);
                return test.isTrue(response.data.authToken);
            }));
            return HTTP.post(Meteor.absoluteUrl('default-auth/login'), {
                data: {
                    user: email,
                    password,
                },
            }, waitFor(function(error, result) {
                let response;
                response = result.data;
                test.equal(result.statusCode, 200);
                test.equal(response.status, 'success');
                test.equal(response.data.userId, userId);
                test.isTrue(response.data.authToken);
                return token = response.data.authToken;
            }));
        });
        it('should allow a user to login again, without affecting the first login', function(test, waitFor) {
            return HTTP.post(Meteor.absoluteUrl('default-auth/login'), {
                data: {
                    user: email,
                    password,
                },
            }, waitFor(function(error, result) {
                let response;
                response = result.data;
                test.equal(result.statusCode, 200);
                test.equal(response.status, 'success');
                test.equal(response.data.userId, userId);
                test.isTrue(response.data.authToken);
                test.notEqual(token, response.data.authToken);
                return emailLoginToken = response.data.authToken;
            }));
        });
        it('should not allow a user with wrong password to login and should respond after 500 msec', function(test, waitFor) {
            let startTime;
            startTime = new Date();
            return HTTP.post(Meteor.absoluteUrl('default-auth/login'), {
                data: {
                    user: username,
                    password: 'NotAllowed',
                },
            }, waitFor(function(error, result) {
                let durationInMilliseconds; let
                    response;
                response = result.data;
                test.equal(result.statusCode, 401);
                test.equal(response.status, 'error');
                durationInMilliseconds = new Date() - startTime;
                return test.isTrue(durationInMilliseconds >= 500);
            }));
        });
        it('should allow a user to logout', function(test, waitFor) {
            return HTTP.post(Meteor.absoluteUrl('default-auth/logout'), {
                headers: {
                    'X-User-Id': userId,
                    'X-Auth-Token': token,
                },
            }, waitFor(function(error, result) {
                let response;
                response = result.data;
                test.equal(result.statusCode, 200);
                return test.equal(response.status, 'success');
            }));
        });
        it('should remove the logout token after logging out and should respond after 500 msec', function(test, waitFor) {
            let startTime;
            DefaultAuthApi.addRoute('prevent-access-after-logout', {
                authRequired: true,
            }, {
                get() {
                    return true;
                },
            });
            startTime = new Date();
            return HTTP.get(Meteor.absoluteUrl('default-auth/prevent-access-after-logout'), {
                headers: {
                    'X-User-Id': userId,
                    'X-Auth-Token': token,
                },
            }, waitFor(function(error, result) {
                let durationInMilliseconds; let
                    response;
                response = result.data;
                test.isTrue(error);
                test.equal(result.statusCode, 401);
                test.equal(response.status, 'error');
                durationInMilliseconds = new Date() - startTime;
                return test.isTrue(durationInMilliseconds >= 500);
            }));
        });
        return it('should allow a second logged in user to logout', function(test, waitFor) {
            return HTTP.post(Meteor.absoluteUrl('default-auth/logout'), {
                headers: {
                    'X-User-Id': userId,
                    'X-Auth-Token': emailLoginToken,
                },
            }, waitFor(function(error, result) {
                let response;
                response = result.data;
                test.equal(result.statusCode, 200);
                return test.equal(response.status, 'success');
            }));
        });
    });
    return describe('An API with custom auth (with a custom error response)', function() {
        let CustomErrorAuthApi;
        CustomErrorAuthApi = new Restivus({
            apiPath: 'custom-error-auth',
            useDefaultAuth: true,
            auth: {
                token: 'services.resume.loginTokens.hashedToken',
                user() {
                    let token; let
                        userId;
                    userId = this.request.headers['x-user-id'];
                    token = this.request.headers['x-auth-token'];
                    if (userId && token) {
                        return {
                            userId,
                            token: Accounts._hashLoginToken(token),
                        };
                    }
                    return {
                        error: {
                            statusCode: 499,
                            body: 'Error!',
                        },
                        userId: true,
                        token: true,
                    };
                },
            },
        });
        CustomErrorAuthApi.addRoute('test', {
            authRequired: true,
        }, {
            get() {
                return true;
            },
        });
        return it('should return a custom error response when provided', function(test, waitFor) {
            return HTTP.get(Meteor.absoluteUrl('custom-error-auth/test'), {}, waitFor(function(error, result) {
                test.isTrue(error);
                test.equal(result.statusCode, 499);
                return test.equal(result.data, 'Error!');
            }));
        });
    });
});
