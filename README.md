<div align="center">
  <img title="Escrowblock exchange logo" src="public/favicon.png">
</div>

- [Project Aim](#project-aim)
- [Installation](#installation)
  - [Development](#development)
  - [Deployment](#deployment)
- [Structure](#structure)
  - [General review](#general-review)
  - [UI](#ui)
  - [Translation](#translation)
  - [Matching engine](#matching-engine)
  - [Web3 crypto messaging](#web3-crypto-messaging)
  - [Deferred transactions](#deferred-transactions)
  - [Sandbox mode](#sandbox-mode)
  - [Blockchain interactions](#blockchain-interactions)
- [Roadmap](#roadmap)
- [Feature requests](#feature-requests)
- [Contributing](#contributing)
  - [Development](#development)
  - [Issue Triage](#severity)
  - [Grants](#grants)
- [API](#api)
- [License](#license)
- [Sandbox](#sandbox)
- [Production](#production)

# Project Aim

The goal of the project is to use the capabilities of local crypto-crypto and crypto-fiat exchanges.
Thus, Escrowblock Foundation forms a global rating system of counterparties involving escrow for the prevention of fraudulent schemes.
The owner who will create a new exchange based on this software must use HMW and follow by [License](#license)

# Installation

ESCB exchange uses the Meteor.js cross-platform framework. To install it you need to follow the instructions on [the official website of the framework] (https://www.meteor.com/install)

## Development

To quickly launch a developer environment, you need to configure:
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
- Run `meteor npm i` to install dependencies
- Run the `npm run devstartnix` script for Linux, or `npm run devstartwin` for Windows

Also for testing email sending it may be useful to add MAIL_URL to the scripts that are used for development. Full list
environment variables for meteor can be found in [official documentation](https://docs.meteor.com/environment-variables.html)

The devstarthttpsnix script is designed to run in https mode for localhost. This is required for developing a Talk system, since Chrome does not
work with crypto in unprotected mode.

## Deployment

To deploy the ESCB exchange in sandbox/development/production environments use [MUP] (http://meteor-up.com/)
To deploy sandbox/development/production version, you need to change the settings in the .deployx/(sandbox/development/production)/mup.js file
Descriptions of the settings for deployment can be found at [MUP Docs] (http://meteor-up.com/docs.html#additional-setupdeploy-information)  

# Structure

Application structure ESCB Exchange is as close as possible to the recommendations on the official framework [Meteor.js](http://guide.meteor.com/)

## General review

The application has two entry points one by one for the client code and the server one. `/client/main.js` and `/server/main.js` respectively.
All application code is in the folder `/imports`.

## UI

The application uses two frameworks to display the client side. [Blaze.js](http://blazejs.org/) and [React.js](https://reactjs.org/)
Blaze.js renders templates for exchange pages. React.js is used to display trading graphs.

## Translation

To display the interface in various languages, the meteor package `tap:i18n` is used. Files for translation are in the `/i18n` folder.
To add a new language, follow the recommendations from the official documentation. [TAPi18n](https://github.com/TAPevents/tap-i18n)

## Matching engine

This is the heart of any exchange. Matching engine works through a distributed queue based on [vsivsi:job-collection](https://github.com/vsivsi/meteor-job-collection)
The MatchingEngine.jobs collection contains a list of tasks to perform.
All based on queue with two operations:
1) Fill order
2) Recalculate Algo orders
Getting into the order queue provides [matb33:collection-hooks](https://github.com/matb33/meteor-collection-hooks)
The queue is processed asynchronously through triggers at the `order` MongoDb collection.

## Web3 crypto messaging

Counterparties can chat via "Talk system". Such a communication channel works in the following simplified way:
Bob and Alice each have two keys — open, which is used to generate the ETH address of the wallet and closed, which is used to sign transactions.
At the stage of forming a new communication channel, Bob generates a new key pair, public and private (identity), and encrypts this identity channel with Alice’s public key.
At this stage in the database for two counterparties, there is an identity channel encrypted with the public key for Bob and Alice. This provides a confidential channel for their communication.
To send a message, Bob decrypt with his private key the identity channel. Encodes the message with the public key of the identity channel and sends it.
Alice and Bob use the identity channel private key to read all messages in a confidential channel.

If the process of the transaction requires assistance in resolving the dispute. Then Bob or Alice can invite other participants to the group through the following mechanism.
One of the parties, for example, Alice, presses the button — to invite the moderator into the conversation.
Identity channel is encrypted in Bob’s browser with the public key of the moderator and is recorded in the database.

The moderator decrypt the private key of the identity channel and can use a confidential channel of communication with the parties to the transaction.
If in the course of the transaction it is necessary to provide evidence in the form of images or other media files, they are encrypted by the identity channel and recorded in ipfs. Such files can be obtained by a hash code by anyone who has it. But such files can only be decrypted using the identity channel.
The advantages of such a scheme for building a confidential communication channel:
 - Only encryption keys available in the user’s browser are used. This eliminates a middle-man attack. All data is sent via end-to-end encryption. Generation of an identity channel does not require the participation of the server part or any other party, as is the case in the algorithm https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange
 - Identity channel is stored in an encrypted form for each participant in a confidential conversation. This eliminates the possibility of its leakage by hacking the database.
 - The ability to add an unlimited number of participants in the conversation.
 - The good speed of encoding and decoding messages, as one identity channel is used for all messages and files in a confidential conversation.
 - For each communication channel a new identity channel is formed, so if one identity channel leaks, it is impossible to read other channels.

The only possible disadvantage of this construction scheme:
 - In case of a leak of the private key of one of the participants in a confidential conversation, as it is possible to read all the messages in the channel.
 - It is not possible to use the server performance for a search. Any string search can be performed only on the client side, but due to each deal in creating a new channel, the data length for a search will be limited.

On localhost, you can experience a problem with https://github.com/w3c/webcrypto/issues/28.
You have to set up the secure connection https://github.com/nourharidy/meteor-ssl
```
SSL(
  Assets.getText("localhost.key"),
  Assets.getText("localhost.cert"),
443);
```
For this aim you can run command `npm run devstarthttpsnix` with `"lhttps": true` in localdevelopment/settings.json

`Notes:` Metamask can't decrypt message via privateKey [See here](https://github.com/MetaMask/metamask-extension/issues/6498). 
Due to this circumstance ESCB dev team has added some limitation for Web3 message system. Identity for channels stored in db by common rules. 
When Metamask will apply PR on including decrypting feature ESCB dev team will migrate on full flow - encrypting/decrypting channel identity by personal keys.

## Deferred transactions

To maintain decentralization, ESCB exchange implements a deferred (pending) transaction. Under such a transaction, one of the participants makes a deposit for 
the transaction using HMW, and the second one fulfills the conditions of the transaction, after which it receives the deposited funds.
Consider an example of a transaction on the example of buying 1 ETH for $100. Seller 1 ETH has on deposit the amount that is reserved for 
the transaction. The buyer receives the details for the transfer of p2p, for example from card to card. 
After confirming the transfer, the amount of 1 ETH is transferred to the buyer. At this stage, there could be possible disputes between 
the parties of the transaction. See [Web3 crypto messaging](#web3-crypto-messaging)

## Sandbox mode

If in settings.json specify `sanbox:true`, then orders will be generated by CRON, all balance will be supported on 10 amount value for any deposit. 
This mode will allow users to test all systems on the ESCB exchange.

## Blockchain interactions

@TODO description about HMW

# Roadmap

* [ ] full test cover
* [ ] add redis oplog
* [ ] add blockchain interactions based on HMW

# Feature requests

To add request for a new feature you must create Issue into repository by "Feature request"

# Contributing

Description is [here](CONTRIBUTING.md)

## Development

Description is [here](DEVELOPMENT.md)

## Issue Triage

Description is [here](ISSUE_TRIAGE.md)

## Grants

For great PR or founded security bug ESCB dev team can award a grant 

# API

For some endpoints you must use authenticated request. To do this you must be logged in the system via API.
You can do this by sending key and hashed via your secretKey in HMAC sha256 format string with your key in HEX encoding.

```nodejs
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', 'Secret');
      hmac.update('key');
      
console.log(hmac.digest('hex'));
```

Obtaining auth-token via curl

```
curl http://api.escb.exchange/login -X POST -d "key=EoQeal53HFnWAKqBylKVOPuYyD5fjHFg1UdI9Dafkrk&hash=5344f2c11f77554f6d217125893922badd9828a682365811fd34ed30ecb7e196"

```

As only you will have the token, you can do authenticated request to system. But for placing orders and some other requests
you must use signed request. Such signed request must be sent via signature. Such a signature can be compared as hashed totalParams
in HMAC sha256 format. TotalParams is concatenated query and body for request.
Example:

`hash=2347248273489EFAD34923EFA34923FEFA34923FE`

API documentation is [here](https://docs.escb.exchange)

API production endpoint is https://api.escb.exchange
API sandbox endpoint is https://apisandbox.escb.exchange

# License

[GPL-3.0-or-later](GPL-3.0-or-later) and [ESCB.LICENSE](ESCB.LICENSE)

# Sandbox

https://sandbox.escb.exchange

# Production

https://escb.exchange