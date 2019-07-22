import { Push } from 'meteor/raix:push';
import { Meteor } from 'meteor/meteor';

function subscribeForPushNotification(reg) {
    // console.log('Registered push service worker', reg);
    reg.pushManager.subscribe({ userVisibleOnly: true }).then(function(sub) {
        const data = {
            appName: Meteor.settings.public.appName,
            id: Push.id(),
            userId: Meteor.userId(),
            token: {
                gcm: sub.endpoint.split('/').pop(),
            },
        };
        Meteor.call('raix:push-update', data, function(err) {
            if (err) {
                console.log(err);
            } else {
                Push.enabled(true);
            }
        });
    });

    // set up a message channel to communicate with the SW
    const channel = new window.MessageChannel();
    
    /*
    channel.port1.onmessage = function(e) {
        console.log(e);
    };
    */
    
    if (reg.active) {
        const mySW = reg.active;
        mySW.postMessage(document.visibilityState, [channel.port2]);

        document.removeEventListener('visibilitychange', document);
        document.addEventListener('visibilitychange', function() {
            if (mySW.state === 'redundant') {
                console.warn('Service worker state is a redundant');
                return;
            }
            mySW.postMessage(document.visibilityState);
        });

        window.onbeforeunload = function() {
            mySW.postMessage('hidden');
        };
    }
}

function setWorkerForNotification() {
    if ('serviceWorker' in window.navigator) {
        window.navigator.serviceWorker
            .register('/push-client-sw.js')
            .then(function(reg) {
                let mySW;
                if (reg.installing) {
                    mySW = reg.installing;
                } else if (reg.waiting) {
                    mySW = reg.waiting;
                } else if (reg.active) {
                    mySW = reg.active;
                }

                if (mySW) {
                    // console.log("sw current state", mySW.state);
                    if (mySW.state == 'activated') {
                        console.log('sw already activated - Do watever needed here');
                        // reg.showNotification('Hi, there!');
                        subscribeForPushNotification(reg);
                    }
                    mySW.addEventListener('statechange', function(e) {
                        // console.log("sw statechange : ", e.target.state);
                        if (e.target.state == 'activated') {
                            // console.log("Just now activated. now we can subscribe for push notification");
                            subscribeForPushNotification(reg);
                        }
                    });
                }
            }).catch(function(e) {
                if (window.Notification.permission === 'denied') {
                    // The user denied the notification permission which
                    // means we failed to subscribe and the user will need
                    // to manually change the notification permission to
                    // subscribe to push messages
                    console.log('Permission for Notifications was denied');
                } else {
                    // A problem occurred with the subscription, this can
                    // often be down to an issue or lack of the gcm_sender_id
                    // and / or gcm_user_visible_only
                    console.log('Unable to subscribe to push.', e);
                }
            });
    }
}

if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
} else if (window.Notification.permission === 'granted') { // Let's check whether notification permissions have alredy been granted
    // If it's okay let's create a notification
    // var notification = new Notification("Hi there!");
    setWorkerForNotification();
} else if (window.Notification.permission !== 'denied' || window.Notification.permission === 'default') {
    window.Notification.requestPermission(function (permission) {
        // If the user accepts, let's create a notification
        if (permission === 'granted') {
            setWorkerForNotification();
        }
    });
}
