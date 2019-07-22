let DefaultApi; let
    HookApi;

HookApi = new Restivus({
    useDefaultAuth: true,
    apiPath: 'hook-api',
    onLoggedIn() {
        return Meteor.users.findOne({
            _id: this.userId,
        });
    },
    onLoggedOut() {
        return Meteor.users.findOne({
            _id: this.userId,
        });
    },
});

DefaultApi = new Restivus({
    useDefaultAuth: true,
    apiPath: 'no-hook-api',
});

describe('User login and logout', function() {
    let email; let password; let token; let userId; let
        username;
    token = null;
    username = 'test2';
    email = 'test2@ivus.com';
    password = 'password';
    Meteor.users.remove({
        username,
    });
    userId = Accounts.createUser({
        username,
        email,
        password,
    });
    describe('with hook returns', function() {
        it('should call the onLoggedIn hook and attach returned data to the response as data.extra', function(test, waitFor) {
            return HTTP.post(Meteor.absoluteUrl('hook-api/login'), {
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
                test.equal(response.data.extra.username, username);
                return token = response.data.authToken;
            }));
        });
        return it('should call the onLoggedOut hook and attach returned data to the response as data.extra', function(test, waitFor) {
            return HTTP.post(Meteor.absoluteUrl('hook-api/logout'), {
                headers: {
                    'X-User-Id': userId,
                    'X-Auth-Token': token,
                },
            }, waitFor(function(error, result) {
                let response;
                response = result.data;
                test.equal(result.statusCode, 200);
                test.equal(response.status, 'success');
                return test.equal(response.data.extra.username, username);
            }));
        });
    });
    return describe('without hook returns', function() {
        it('should not attach data.extra to the response when login is called', function(test, waitFor) {
            return HTTP.post(Meteor.absoluteUrl('no-hook-api/login'), {
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
                test.isUndefined(response.data.extra);
                return token = response.data.authToken;
            }));
        });
        return it('should not attach data.extra to the response when logout is called', function(test, waitFor) {
            return HTTP.post(Meteor.absoluteUrl('no-hook-api/logout'), {
                headers: {
                    'X-User-Id': userId,
                    'X-Auth-Token': token,
                },
            }, waitFor(function(error, result) {
                let response;
                response = result.data;
                test.equal(result.statusCode, 200);
                test.equal(response.status, 'success');
                return test.isUndefined(response.data.extra);
            }));
        });
    });
});
