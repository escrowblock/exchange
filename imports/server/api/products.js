import { check } from 'meteor/check';
import Api from './config.js';
import { product } from '/imports/collections';

/**
 * Get products
 */
Api.addRoute('getproducts',
    {
        authRequired: false,
        enableCors: true,
    },
    {
        get: {
            action() {
                return {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: product.find({},
                        {
                            fields: {
                                ProductSymbol: 1,
                                ProductFullName: 1,
                                ProductType: 1,
                                DecimalPlaces: 1,
                                TickSize: 1,
                                NoFees: 1,
                            },
                        }).fetch(),
                };
            },
        },
    });

/**
 * Get product
 */
Api.addRoute('getproduct',
    {
        authRequired: false,
        enableCors: true,
    },
    {
        get: {
            action() {
                // string - The Symbol of the product (often a currency).
                check(this.bodyParams.ProductSymbol, String);

                if (product.findOne({ ProductSymbol: this.bodyParams.ProductSymbol })) {
                    return {
                        status: 'success',
                        timestamp: new Date().getTime(),
                        data: product.find({ ProductSymbol: this.bodyParams.ProductSymbol },
                            {
                                fields: {
                                    ProductSymbol: 1,
                                    ProductFullName: 1,
                                    ProductType: 1,
                                    DecimalPlaces: 1,
                                    TickSize: 1,
                                    NoFees: 1,
                                },
                            }).fetch(),
                    };
                }
                return {
                    status: 'error',
                    timestamp: new Date().getTime(),
                    message: 'Not found',
                };
            },
        },
    });
