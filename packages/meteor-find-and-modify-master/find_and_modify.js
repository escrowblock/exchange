import { MongoInternals } from 'meteor/mongo';
import { Decimal } from 'meteor/mongo-decimal';

(function() {
    // Code adapted from https://github.com/meteor/meteor/issues/1070

    var replaceTypes = function (document, atomTransformer) {
        if (typeof document !== 'object' || document === null) return document;
  
        const replacedTopLevelAtom = atomTransformer(document);
        if (replacedTopLevelAtom !== undefined) return replacedTopLevelAtom;
  
        let ret = document;
        _.each(document, function (val, key) {
            const valReplaced = replaceTypes(val, atomTransformer);
            if (val !== valReplaced) {
                // Lazy clone. Shallow copy.
                if (ret === document) ret = _.clone(document);
                ret[key] = valReplaced;
            }
        });
        return ret;
    };

    // This is used to add or remove EJSON from the beginning of everything nested
    // inside an EJSON custom type. It should only be called on pure JSON!
    var replaceNames = function (filter, thing) {
        if (typeof thing === 'object' && thing !== null) {
            if (_.isArray(thing)) {
                return _.map(thing, _.bind(replaceNames, null, filter));
            }
            const ret = {};
            _.each(thing, function (value, key) {
                ret[filter(key)] = replaceNames(filter, value);
            });
            return ret;
        }
        return thing;
    };

    const replaceMongoAtomWithMeteor = function (document) {
        if (document instanceof MongoInternals.NpmModules.mongodb.module.Binary) {
            const buffer = document.value(true);
            return new Uint8Array(buffer);
        }
        if (document instanceof MongoInternals.NpmModules.mongodb.module.ObjectID) {
            return new Mongo.ObjectID(document.toHexString());
        }
        if (document instanceof MongoInternals.NpmModules.mongodb.module.Decimal128) {
            return Decimal(document.toString());
        }
        if (document.EJSON$type && document.EJSON$value && _.size(document) === 2) {
            return EJSON.fromJSONValue(replaceNames(function (name) { return name.substr(5); }, document));
        }
        if (document instanceof MongoInternals.NpmModules.mongodb.module.Timestamp) {
            // For now, the Meteor representation of a Mongo timestamp type (not a date!
            // this is a weird internal thing used in the oplog!) is the same as the
            // Mongo representation. We need to do this explicitly or else we would do a
            // structural clone and lose the prototype.
            return document;
        }
        return undefined;
    };

    const replaceMeteorAtomWithMongo = function (document) {
        if (EJSON.isBinary(document)) {
            // This does more copies than we'd like, but is necessary because
            // MongoDB.BSON only looks like it takes a Uint8Array (and doesn't actually
            // serialize it correctly).
            return new MongoInternals.NpmModules.mongodb.module.Binary(Buffer.from(document));
        }
        if (document instanceof Mongo.ObjectID) {
            return new MongoInternals.NpmModules.mongodb.module.ObjectID(document.toHexString());
        }
        if (document instanceof MongoInternals.NpmModules.mongodb.module.Timestamp) {
            // For now, the Meteor representation of a Mongo timestamp type (not a date!
            // this is a weird internal thing used in the oplog!) is the same as the
            // Mongo representation. We need to do this explicitly or else we would do a
            // structural clone and lose the prototype.
            return document;
        }
        if (document instanceof Decimal) {
            return MongoInternals.NpmModules.mongodb.module.Decimal128.fromString(document.toString());
        }
        if (EJSON._isCustomType(document)) {
            return replaceNames(function (name) { return `EJSON${name}`; }, EJSON.toJSONValue(document));
        }
        // It is not ordinarily possible to stick dollar-sign keys into mongo
        // so we don't bother checking for things that need escaping at this time.
        return undefined;
    };

    // Helper func to run shared validation code
    function validate(collection, args) {
        if (!collection._name) {
            throw new Meteor.Error(405, 'findAndModify: Must have collection name.');
        }

        if (!args) {
            throw new Meteor.Error(405, 'findAndModify: Must have args.');
        }
    
        if (!args.query) {
            throw new Meteor.Error(405, 'findAndModify: Must have query.');
        }

        if (!args.update && !args.remove) {
            throw new Meteor.Error(405, 'findAndModify: Must have update or remove.');
        }
    }

    if (Meteor.isServer) {
        Mongo.Collection.prototype.findAndModify = function(args, rawResult) {
            validate(this, args);

            const q = {};
            q.query = args.query || {};
            q.sort = args.sort || [];
            if (args.update) {
                q.update = args.update;
            }

            q.options = {};
            if (args.new !== undefined) {
                q.options.new = args.new;
            }
            if (args.remove !== undefined) {
                q.options.remove = args.remove;
            }
            if (args.upsert !== undefined) {
                q.options.upsert = args.upsert;
            }
            if (args.fields !== undefined) {
                q.options.fields = args.fields;
            }
            if (args.writeConcern !== undefined) {
                q.options.w = args.writeConcern;
            }
            if (args.maxTimeMS !== undefined) {
                q.options.wtimeout = args.maxTimeMS;
            }
            if (args.bypassDocumentValidation != undefined) {
                q.options.bypassDocumentValidation = args.bypassDocumentValidation;
            }

            // If upsert, assign a string Id to $setOnInsert unless otherwise provided
            if (q.options.upsert) {
                q.update = q.update || {};
                q.update.$setOnInsert = q.update.$setOnInsert || {};
                q.update.$setOnInsert._id = q.update.$setOnInsert._id || Random.id(17);
            }

            // Use rawCollection object introduced in Meteor 1.0.4.
            const collectionObj = this.rawCollection();

            const wrappedFunc = Meteor.wrapAsync(collectionObj.findAndModify,
                collectionObj);
            const result = wrappedFunc(
                replaceTypes(q.query, replaceMeteorAtomWithMongo),
                replaceTypes(q.sort, replaceMeteorAtomWithMongo),
                replaceTypes(q.update, replaceMeteorAtomWithMongo),
                q.options,
            );

            return rawResult ? result : replaceTypes(result.value, replaceMongoAtomWithMeteor);
        };
    }

    if (Meteor.isClient) {
        Mongo.Collection.prototype.findAndModify = function(args) {
            validate(this, args);

            const findOptions = {};
            if (args.sort !== undefined) {
                findOptions.sort = args.sort;
            }
            if (args.fields !== undefined) {
                findOptions.fields = args.fields;
            }
            if (args.skip !== undefined) {
                findOptions.skip = args.skip;
            }
            const ret = this.findOne(args.query, findOptions);
            if (args.remove) {
                if (ret) this.remove({ _id: ret._id });
            } else {
                if (args.upsert && !ret) {
                    const writeResult = this.upsert(args.query, args.update);
                    if (writeResult.insertedId && args.new) {
                        return this.findOne({ _id: writeResult.insertedId }, findOptions);
                    } if (findOptions.sort) {
                        return {};
                    }
                    return null;
                } if (ret) {
                    // If we're in a simulation, it's safe to call update with normal
                    // selectors (which is needed, e.g., for modifiers with positional
                    // operators). Otherwise, we'll have to do an _id only update to
                    // get around the restriction that lets untrusted (e.g. client)
                    // code update collections by _id only.
                    const enclosing = DDP._CurrentInvocation.get();
                    const alreadyInSimulation = enclosing && enclosing.isSimulation;
                    if (alreadyInSimulation) {
                        // Add _id to query because Meteor's update doesn't include certain
                        // options that the full findAndModify does (like sort). Create
                        // shallow copy before update so as not to mess with user's
                        // original query object
                        const updatedQuery = {};
                        for (const prop in args.query) {
                            updatedQuery[prop] = args.query[prop];
                        }
                        updatedQuery._id = ret._id;
                        this.update(updatedQuery, args.update);
                    } else {
                        this.update({ _id: ret._id }, args.update);
                    }
          
                    if (args.new) {
                        return this.findOne({ _id: ret._id }, findOptions);
                    }
                }
            }

            return ret;
        };
    }
}());
