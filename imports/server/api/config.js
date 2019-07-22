import { Restivus } from 'meteor/logvik:restivus';

const Api = new Restivus({
    version: 'v1',
    useDefaultAuth: true,
    prettyJson: true,
    extAuth: 'apiKey',
});

export { Api as default };
