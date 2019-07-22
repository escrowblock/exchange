describe('A route', (function(_this) {
    return function() {
        let Api;
        Api = new Restivus();
        it('can be constructed with options', function(test) {
            let route;
            route = new shareRoute(Api, 'test-route-1', {
                authRequired: true,
                roleRequired: ['admin', 'dev'],
            }, {
                get() {
                    return 'GET test-route-1';
                },
            });
            test.equal(route.path, 'test-route-1');
            test.isTrue(route.options.authRequired);
            test.isTrue(_.contains(route.options.roleRequired, 'admin'));
            test.isTrue(_.contains(route.options.roleRequired, 'dev'));
            return test.equal(route.endpoints.get(), 'GET test-route-1');
        });
        it('can be constructed without options', function(test) {
            let route;
            route = new shareRoute(Api, 'test-route-2', {
                get() {
                    return 'GET test-route-2';
                },
            });
            test.equal(route.path, 'test-route-2');
            return test.equal(route.endpoints.get(), 'GET test-route-2');
        });
        it('should support endpoints for all HTTP methods', function(test) {
            let route;
            route = new shareRoute(Api, 'test-route-3', {
                get() {
                    return 'GET test-route-2';
                },
                post() {
                    return 'POST test-route-2';
                },
                put() {
                    return 'PUT test-route-2';
                },
                patch() {
                    return 'PATCH test-route-2';
                },
                delete() {
                    return 'DELETE test-route-2';
                },
                options() {
                    return 'OPTIONS test-route-2';
                },
            });
            test.equal(route.endpoints.get(), 'GET test-route-2');
            test.equal(route.endpoints.post(), 'POST test-route-2');
            test.equal(route.endpoints.put(), 'PUT test-route-2');
            test.equal(route.endpoints.patch(), 'PATCH test-route-2');
            test.equal(route.endpoints.delete(), 'DELETE test-route-2');
            return test.equal(route.endpoints.options(), 'OPTIONS test-route-2');
        });
        return describe('that\'s initialized without options', function() {
            return it('should have the default configuration', function(test) {
                test.equal(Api._config.apiPath, 'api/');
                test.isFalse(Api._config.useAuth);
                test.isFalse(Api._config.prettyJson);
                return test.equal(Api._config.auth.token, 'services.resume.loginTokens.hashedToken');
            });
        });
    };
}(this)));
