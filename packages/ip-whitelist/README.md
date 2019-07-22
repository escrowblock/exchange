# user IP Whitelist
## A very simple firewall for user [Meteor](https://www.meteor.com/)

The aim of this package is to only allow access to your Meteor application from a whitelist of IP addresses your users will define. Deploy your in-development application to a hosting service so you can test on different devices or perfect your deployment pipeline whilst keeping it safe from prying eyes.

### Meteor Compatibility

Tested with Meteor v1.6.x.

### Installation
```ssh
meteor add logvik:user-ip-whitelist
```

### Configuration
The package expects to find a private email key in your METEOR_SETTINGS environment variable e.g:
```json

{
    "private": {
        "email": {
          "from": "admin@example.com"
        }
    }
}
```
Your hosting provider may give you the ability to configure environment variables via their control panel. Alternatively if you are deploying to Meteor's free hosting service for non-production apps you can define your setting in a settings.json file and use:


```ssh
meteor deploy yourapp.meteor.com --settings settings.json
```

### Usage
Add this line to your server-side code:
```javascript
IPWhitelist();
```

### Behaviour
Each user will have a whitelist and if a client will use different IP it will send pin-code to email for confirmation an access.
