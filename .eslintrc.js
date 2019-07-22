module.exports = {
    "parser": "babel-eslint",
    "parserOptions": {
        "allowImportExportEverywhere": true,
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "env": {
        "es6":     true,
        "browser": true,
        "node":    true,
    },
    "plugins": [
        "meteor",
        "react"
    ],
    "extends": ["eslint:recommended", "plugin:meteor/recommended", "plugin:react/recommended", "@meteorjs/eslint-config-meteor"],
    "settings": {
        "import/resolver": "meteor",
        "react": {
          "createClass": "createReactClass", // Regex for Component Factory to use,
                                             // default to "createReactClass"
          "pragma": "React",  // Pragma to use, default to "React"
          "version": "detect", // React version. "detect" automatically picks the version you have installed.
                               // You can also use `16.0`, `16.3`, etc, if you want to override the detected value.
                               // default to latest and warns if missing
                               // It will default to "detect" in the future
        }
    },
    "rules": {
        "react/jsx-filename-extension": [1, {
            "extensions": [".jsx"]
        }],
        "react/jsx-no-bind": [2, {
            "ignoreRefs": false,
            "allowArrowFunctions": false,
            "allowFunctions": false,
            "allowBind": false
        }],
        "meteor/no-session": [
            0
        ],
        "meteor/template-names": "off", //@TODO remove later
        "eqeqeq": "off", //@TODO remove later
        "no-underscore-dangle": "off", //@TODO remove later
        "camelcase": "off", //@TODO remove later
        "no-shadow": "off", //@TODO remove later
        "no-console": "off", //@TODO remove later
        "max-len": [0, {code: 100}],
        "import/no-absolute-path": [0],
        "meteor/audit-argument-checks": [0],
        "indent": ["error", 4],
        "switch-colon-spacing": [0],
        "no-invalid-this": [0],
        "new-cap": [0],
        "no-trailing-spaces": [2, {
            skipBlankLines: true
        }],
    },
    "overrides": [{
        files: "*.js,*.jsx",
    }]
};