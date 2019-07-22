module.exports = {
  // Server authentication info
  "servers": {
    "one": {
      "host": "",
      "username": "",
      "password": "",
      // or pem file (ssh based authentication)
      //"pem": "../../private/vault/deployment.pem"
    }
  },
  "meteor": {
    "name": "escb-exchange",
    "path": "../../",
    "servers": {
      "one": {}
    },
    "buildOptions": {
      "serverOnly": true,
      "debug": false
    },
    "env": {
      "ROOT_URL": "https://localhost",
      "MONGO_URL": "mongodb://mongo:27017/meteor",
      "PORT": "3002",
      "HTTP_FORWARDED_COUNT": 1,
      "MAIL_URL": "smtps://noreply%40mail.com:password@mail.com:465"
    },
    "docker": {
      "image": 'logvik/meteord:base',
      "args": [
        '--link=mongodb:mongo',
      ]
    },
    "deployCheckWaitTime": 60, //default 10
    "enableUploadProgressBar": true
  }
}
