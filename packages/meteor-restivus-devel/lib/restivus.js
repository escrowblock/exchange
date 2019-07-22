Restivus = (function() {
    function Restivus(options) {
        let corsHeaders;
        this._routes = [];
        this._config = {
            paths: [],
            useDefaultAuth: false,
            apiPath: 'api/',
            version: null,
            prettyJson: false,
            extAuth: null,
            auth: {
                token: 'services.resume.loginTokens.hashedToken',
                user() {
                    let token;
                    if (this.request.headers['x-auth-token']) {
                        token = Accounts._hashLoginToken(this.request.headers['x-auth-token']);
                    }
                    if (this.request.headers['x-auth-hashedtoken']) {
                        token = this.request.headers['x-auth-hashedtoken'];
                    }
                    return {
                        userId: this.request.headers['x-user-id'],
                        apiKey: this.request.headers['X-API-Authorization'],
                        token,
                    };
                },
            },
            defaultHeaders: {
                'Content-Type': 'application/json',
            },
            enableCors: true,
        };
        _.extend(this._config, options);
        if (this._config.enableCors) {
            corsHeaders = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
            };
            if (this._config.useDefaultAuth) {
                corsHeaders['Access-Control-Allow-Headers'] += ', X-User-Id, X-Auth-Token, X-Auth-HashedToken, X-API-Authorization';
            }
            _.extend(this._config.defaultHeaders, corsHeaders);
            if (!this._config.defaultOptionsEndpoint) {
                this._config.defaultOptionsEndpoint = function() {
                    this.response.writeHead(200, corsHeaders);
                    return this.done();
                };
            }
        }
        if (this._config.apiPath[0] === '/') {
            this._config.apiPath = this._config.apiPath.slice(1);
        }
        if (_.last(this._config.apiPath) !== '/') {
            this._config.apiPath = `${this._config.apiPath}/`;
        }
        if (this._config.version) {
            this._config.apiPath += `${this._config.version}/`;
        }
        if (this._config.useDefaultAuth) {
            this._initAuth();
        } else if (this._config.useAuth) {
            this._initAuth();
            console.warn('Warning: useAuth API config option will be removed in Restivus v1.0 ' + '\n    Use the useDefaultAuth option instead');
        }
        return this;
    }


    /**
    Add endpoints for the given HTTP methods at the given path

    @param path {String} The extended URL path (will be appended to base path of the API)
    @param options {Object} Route configuration options
    @param options.authRequired {Boolean} The default auth requirement for each endpoint on the route
    @param options.roleRequired {String or String[]} The default role required for each endpoint on the route
    @param endpoints {Object} A set of endpoints available on the new route (get, post, put, patch, delete, options)
    @param endpoints.<method> {Function or Object} If a function is provided, all default route
        configuration options will be applied to the endpoint. Otherwise an object with an `action`
        and all other route config options available. An `action` must be provided with the object.
   */

    Restivus.prototype.addRoute = function(path, options, endpoints) {
        let route;
        route = new shareRoute(this, path, options, endpoints);
        this._routes.push(route);
        route.addToApi();
        return this;
    };


    /**
    Generate routes for the Meteor Collection with the given name
   */

    Restivus.prototype.addCollection = function(collection, options) {
        let collectionEndpoints; let collectionRouteEndpoints; let endpointsAwaitingConfiguration; let entityRouteEndpoints; let excludedEndpoints; let methods; let methodsOnCollection; let path; let
            routeOptions;
        if (options == null) {
            options = {};
        }
        methods = ['get', 'post', 'put', 'patch', 'delete', 'getAll'];
        methodsOnCollection = ['post', 'getAll'];
        if (collection === Meteor.users) {
            collectionEndpoints = this._userCollectionEndpoints;
        } else {
            collectionEndpoints = this._collectionEndpoints;
        }
        endpointsAwaitingConfiguration = options.endpoints || {};
        routeOptions = options.routeOptions || {};
        excludedEndpoints = options.excludedEndpoints || [];
        path = options.path || collection._name;
        collectionRouteEndpoints = {};
        entityRouteEndpoints = {};
        if (_.isEmpty(endpointsAwaitingConfiguration) && _.isEmpty(excludedEndpoints)) {
            _.each(methods, function(method) {
                if (indexOf.call(methodsOnCollection, method) >= 0) {
                    _.extend(collectionRouteEndpoints, collectionEndpoints[method].call(this, collection));
                } else {
                    _.extend(entityRouteEndpoints, collectionEndpoints[method].call(this, collection));
                }
            }, this);
        } else {
            _.each(methods, function(method) {
                let configuredEndpoint; let
                    endpointOptions;
                if (indexOf.call(excludedEndpoints, method) < 0 && endpointsAwaitingConfiguration[method] !== false) {
                    endpointOptions = endpointsAwaitingConfiguration[method];
                    configuredEndpoint = {};
                    _.each(collectionEndpoints[method].call(this, collection), function(action, methodType) {
                        return configuredEndpoint[methodType] = _.chain(action).clone().extend(endpointOptions).value();
                    });
                    if (indexOf.call(methodsOnCollection, method) >= 0) {
                        _.extend(collectionRouteEndpoints, configuredEndpoint);
                    } else {
                        _.extend(entityRouteEndpoints, configuredEndpoint);
                    }
                }
            }, this);
        }
        this.addRoute(path, routeOptions, collectionRouteEndpoints);
        this.addRoute(`${path}/:id`, routeOptions, entityRouteEndpoints);
        return this;
    };


    /**
    A set of endpoints that can be applied to a Collection Route
   */

    Restivus.prototype._collectionEndpoints = {
        get(collection) {
            return {
                get: {
                    action() {
                        let entity;
                        entity = collection.findOne(this.urlParams.id);
                        if (entity) {
                            return {
                                status: 'success',
                                timestamp: new Date().getTime(),
                                data: entity,
                            };
                        }
                        return {
                            statusCode: 404,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: 'Item not found',
                            },
                        };
                    },
                },
            };
        },
        put(collection) {
            return {
                put: {
                    action() {
                        let entity; let
                            entityIsUpdated;
                        entityIsUpdated = collection.update(this.urlParams.id, this.bodyParams);
                        if (entityIsUpdated) {
                            entity = collection.findOne(this.urlParams.id);
                            return {
                                status: 'success',
                                timestamp: new Date().getTime(),
                                data: entity,
                            };
                        }
                        return {
                            statusCode: 404,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: 'Item not found',
                            },
                        };
                    },
                },
            };
        },
        patch(collection) {
            return {
                patch: {
                    action() {
                        let entity; let
                            entityIsUpdated;
                        entityIsUpdated = collection.update(this.urlParams.id, {
                            $set: this.bodyParams,
                        });
                        if (entityIsUpdated) {
                            entity = collection.findOne(this.urlParams.id);
                            return {
                                status: 'success',
                                timestamp: new Date().getTime(),
                                data: entity,
                            };
                        }
                        return {
                            statusCode: 404,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: 'Item not found',
                            },
                        };
                    },
                },
            };
        },
        delete(collection) {
            return {
                delete: {
                    action() {
                        if (collection.remove(this.urlParams.id)) {
                            return {
                                status: 'success',
                                timestamp: new Date().getTime(),
                                data: {
                                    message: 'Item removed',
                                },
                            };
                        }
                        return {
                            statusCode: 404,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: 'Item not found',
                            },
                        };
                    },
                },
            };
        },
        post(collection) {
            return {
                post: {
                    action() {
                        let entity; let
                            entityId;
                        entityId = collection.insert(this.bodyParams);
                        entity = collection.findOne(entityId);
                        if (entity) {
                            return {
                                statusCode: 201,
                                body: {
                                    status: 'success',
                                    timestamp: new Date().getTime(),
                                    data: entity,
                                },
                            };
                        }
                        return {
                            statusCode: 400,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: 'No item added',
                            },
                        };
                    },
                },
            };
        },
        getAll(collection) {
            return {
                get: {
                    action() {
                        let entities;
                        entities = collection.find().fetch();
                        if (entities) {
                            return {
                                status: 'success',
                                timestamp: new Date().getTime(),
                                data: entities,
                            };
                        }
                        return {
                            statusCode: 404,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: 'Unable to retrieve items from collection',
                            },
                        };
                    },
                },
            };
        },
    };


    /**
    A set of endpoints that can be applied to a Meteor.users Collection Route
   */

    Restivus.prototype._userCollectionEndpoints = {
        get(collection) {
            return {
                get: {
                    action() {
                        let entity;
                        entity = collection.findOne(this.urlParams.id, {
                            fields: {
                                profile: 1,
                            },
                        });
                        if (entity) {
                            return {
                                status: 'success',
                                data: entity,
                            };
                        }
                        return {
                            statusCode: 404,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: 'User not found',
                            },
                        };
                    },
                },
            };
        },
        put(collection) {
            return {
                put: {
                    action() {
                        let entity; let
                            entityIsUpdated;
                        entityIsUpdated = collection.update(this.urlParams.id, {
                            $set: {
                                profile: this.bodyParams,
                            },
                        });
                        if (entityIsUpdated) {
                            entity = collection.findOne(this.urlParams.id, {
                                fields: {
                                    profile: 1,
                                },
                            });
                            return {
                                status: 'success',
                                timestamp: new Date().getTime(),
                                data: entity,
                            };
                        }
                        return {
                            statusCode: 404,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: 'User not found',
                            },
                        };
                    },
                },
            };
        },
        delete(collection) {
            return {
                delete: {
                    action() {
                        if (collection.remove(this.urlParams.id)) {
                            return {
                                status: 'success',
                                timestamp: new Date().getTime(),
                                data: {
                                    message: 'User removed',
                                },
                            };
                        }
                        return {
                            statusCode: 404,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: 'User not found',
                            },
                        };
                    },
                },
            };
        },
        post(collection) {
            return {
                post: {
                    action() {
                        let entity; let
                            entityId;
                        entityId = Accounts.createUser(this.bodyParams);
                        entity = collection.findOne(entityId, {
                            fields: {
                                profile: 1,
                            },
                        });
                        if (entity) {
                            return {
                                statusCode: 201,
                                body: {
                                    status: 'success',
                                    timestamp: new Date().getTime(),
                                    data: entity,
                                },
                            };
                        }
                        ({
                            statusCode: 400,
                        });
                        return {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'No user added',
                        };
                    },
                },
            };
        },
        getAll(collection) {
            return {
                get: {
                    action() {
                        let entities;
                        entities = collection.find({}, {
                            fields: {
                                profile: 1,
                            },
                        }).fetch();
                        if (entities) {
                            return {
                                status: 'success',
                                timestamp: new Date().getTime(),
                                data: entities,
                            };
                        }
                        return {
                            statusCode: 404,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: 'Unable to retrieve users',
                            },
                        };
                    },
                },
            };
        },
    };

    Restivus.prototype._getIp = function(socket) {
    // For the reported client address for a connection to be correct,
    // the developer must set the HTTP_FORWARDED_COUNT environment
    // variable to an integer representing the number of hops they
    // expect in the `x-forwarded-for` header. E.g., set to "1" if the
    // server is behind one proxy.
    //
    // This could be computed once at startup instead of every time.
        const httpForwardedCount = parseInt(process.env.HTTP_FORWARDED_COUNT) || 0;
        if (httpForwardedCount === 0) {
            return socket.remoteAddress;
        }

        let forwardedFor = socket.headers['x-forwarded-for'];
        if (!_.isString(forwardedFor)) {
            return null;
        }
        forwardedFor = forwardedFor.trim().split(/\s*,\s*/);

        // Typically the first value in the `x-forwarded-for` header is
        // the original IP address of the client connecting to the first
        // proxy.  However, the end user can easily spoof the header, in
        // which case the first value(s) will be the fake IP address from
        // the user pretending to be a proxy reporting the original IP
        // address value.  By counting HTTP_FORWARDED_COUNT back from the
        // end of the list, we ensure that we get the IP address being
        // reported by *our* first proxy.

        if (httpForwardedCount < 0 || httpForwardedCount > forwardedFor.length) {
            return null;
        }

        return forwardedFor[forwardedFor.length - httpForwardedCount];
    };
  
    /*
    Add /login and /logout endpoints to the API
   */

    Restivus.prototype._initAuth = function() {
        let logout; let
            self;
        self = this;

        /*
      Add a login endpoint to the API
      After the user is logged in, the onLoggedIn hook is called (see Restfully.configure() for
      adding hook).
     */
        this.addRoute('login', {
            authRequired: false,
        }, {
            post() {
                let auth; let e; let extraData; let password; let ref; let ref1; let response; let searchQuery; let
                    user;
                user = {};
                if (self._config.extAuth == null) {
                    if (this.bodyParams.user) {
                        if (this.bodyParams.user.indexOf('@') === -1) {
                            user.username = this.bodyParams.user;
                        } else {
                            user.email = this.bodyParams.user;
                        }
                    } else if (this.bodyParams.username) {
                        user.username = this.bodyParams.username;
                    } else if (this.bodyParams.email) {
                        user.email = this.bodyParams.email;
                    }
                    password = this.bodyParams.password;
                    if (this.bodyParams.hashed) {
                        password = {
                            digest: password,
                            algorithm: 'sha-256',
                        };
                    }
                    try {
                        auth = Auth.loginWithPassword(user, password, self._getIp({ headers: this.request.headers, remoteAddress: this.request.connection.remoteAddress }), this.request.headers);
                    } catch (_error) {
                        e = _error;
                        return {
                            statusCode: e.error,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: e.reason,
                            },
                        };
                    }
                } else {
                    try {
                        auth = Auth.loginWithExtAuth(self._config.extAuth, this.bodyParams, self._getIp({ headers: this.request.headers, remoteAddress: this.request.connection.remoteAddress }), this.request.headers);
                    } catch (_error) {
                        e = _error;
                        return {
                            statusCode: e.error,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: e.reason,
                            },
                        };
                    }
                }
                if (auth.userId && auth.authToken) {
                    searchQuery = {};
                    searchQuery[self._config.auth.token] = Accounts._hashLoginToken(auth.authToken);
                    this.user = Meteor.users.findOne({
                        _id: auth.userId,
                    }, searchQuery);
                    this.userId = (ref = this.user) != null ? ref._id : void 0;
                }
                response = {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: auth,
                };
                extraData = (ref1 = self._config.onLoggedIn) != null ? ref1.call(this) : void 0;
                if (extraData != null) {
                    _.extend(response.data, {
                        extra: extraData,
                    });
                }
                return response;
            },
        });
        logout = function() {
            let authToken; let extraData; let hashedToken; let index; let ref; let response; let tokenFieldName; let tokenLocation; let tokenPath; let tokenRemovalQuery; let
                tokenToRemove;
            authToken = this.request.headers['x-auth-token'];
            hashedToken = Accounts._hashLoginToken(authToken);
            tokenLocation = self._config.auth.token;
            index = tokenLocation.lastIndexOf('.');
            tokenPath = tokenLocation.substring(0, index);
            tokenFieldName = tokenLocation.substring(index + 1);
            tokenToRemove = {};
            tokenToRemove[tokenFieldName] = hashedToken;
            tokenRemovalQuery = {};
            tokenRemovalQuery[tokenPath] = tokenToRemove;
            Meteor.users.update(this.user._id, {
                $pull: tokenRemovalQuery,
            });
            response = {
                status: 'success',
                timestamp: new Date().getTime(),
                data: {
                    userId: this.user._id,
                },
            };
            extraData = (ref = self._config.onLoggedOut) != null ? ref.call(this) : void 0;
            if (extraData != null) {
                _.extend(response.data, {
                    extra: extraData,
                });
            }
            return response;
        };

        /*
      Add a logout endpoint to the API
      After the user is logged out, the onLoggedOut hook is called (see Restfully.configure() for
      adding hook).
     */
        return this.addRoute('logout', {
            authRequired: true,
        }, {
            post: logout,
        });
    };

    return Restivus;
}());
