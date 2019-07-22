# Development

This document is intended to provide instructions and helpful information for developers who are [contributing](CONTRIBUTING.md) [pull-requests](https://github.com/escrowblock/exchange/pulls/).

As the first suggestion to the reader of this document: If, during the course of development, a ESCB-exchange-specific process is revealed which is helpful and not documented here, please consider editing this document and submitting a pull-request.  Another developer will be thankful!

## Running from a Git checkout

If you want to run on the bleeding edge, or [help contribute to ESCB exchange](CONTRIBUTING.md), you
can run ESCB exchange directly from a Git checkout using these steps:

1. [Install meteor](https://www.meteor.com/install)

2. **Clone from GitHub**

    ```sh
    $ git clone --recursive https://github.com/escrowblock/exchange.git
    $ cd exchange
    ```
3. **Configure**
    - Copy the .deployx_example folder to .deployx
    - Go to /.deployx/localdevelopment
    - Open file settings.json
    - Change settings for which "add me please" is specified ("appName" - firebase setting for PUSH notifications, 
    "infura_token" - token from dashboard on infura.io, "HMW" - official address for Escrowblock Hierarchy of multisign wallets,
    "senderID" - firebase setting for PUSH notifications, "contactmail" - email for support, "noreplymail" - email for sending, 
    "telegramToken" - for telegram bot notifications, "gcmKey" - firebase setting for PUSH notifications)
    - Copy /package.json_example to /package.json
    - Open file /package.json
    - Change settings for which "add me please" is specified

3. **Run a ESCB exchange command to install dependencies**

    ```sh
    $ meteor npm i
    ```

4. **Ready to Go!**

    Your local ESCB exchange checkout is now ready to use! You can use all commands into package.js. For example:
    For Linux
    
    ```sh
    $ npm run devstartnix
    ```
    
    For Windows
    
    ```sh
    $ npm run devstartwin
    ```

## Code style

* New contributions should follow the [Meteor Style Guide](https://github.com/meteor/javascript/) as closely as possible.
  * The Meteor Style Guide is very close to the [Airbnb Style Guide](https://github.com/airbnb/javascript) with a few notable changes.
* New code should match existing code (in the same vicinity) when the context of a change is minimal, but larger amounts of new code should follow the guide.
* Do not change code that doesn't directly relate to the feature/bug that you're working on.
* Basic linting is accomplished (via ESLint) by running `npm run lint`.

## Testing

[Mocha](https://github.com/practicalmeteor/meteor-mocha-core) uses for testing purposes. You can review `/imports/server/specs` for better understanding our approach.
ESCB dev team follows by [Meteor testing guide](https://guide.meteor.com/testing.html)

## Packages

You can add any package to `/packages` folder if it doesn't' meet with needed features. For example, it forces to use old dependencies.
ESCB dev team will review changes and create external package for ESCB exchange.

## Commit messages

Good commit messages are very important and you should make sure to explain what is changing and why.  The commit message should include:

* A short and helpful commit title (maximum 80 characters).
* A commit description which clearly explains the change if it's not super-obvious by the title.  Some description always helps!
* Reference related issues and pull-requests by number in the description body (e.g. "#9999").
* Add "Fixes" before the issue number if the addition of that commit fully resolves the issue.
