/* eslint-env mocha */

import { assert } from 'meteor/practicalmeteor:chai';
import Mailer from './mailer';

describe('Mailer', () => {
    it('should be defined', () => {
        assert.isObject(Mailer);
    });
});
