passwordGeneration = {
    _pattern: /[a-zA-Z0-9_\-\+*&\?%$#]/,
    _getRandomByte() {
    // http://caniuse.com/#feat=getrandomvalues
        if (window.crypto && window.crypto.getRandomValues) {
            var result = new Uint8Array(1);
            window.crypto.getRandomValues(result);
            return result[0];
        } if (window.msCrypto && window.msCrypto.getRandomValues) {
            var result = new Uint8Array(1);
            window.msCrypto.getRandomValues(result);
            return result[0];
        }
        return Math.floor(Math.random() * 256);
    },
    generate(length) {
        return Array.apply(null, { length })
            .map(function() {
                let result;
                while (true) {
                    result = String.fromCharCode(this._getRandomByte());
                    if (this._pattern.test(result)) {
                        return result;
                    }
                }
            }, this)
            .join('');
    },
};
