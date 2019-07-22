let port;
let state;

function getEndpoint() {
    return self.registration.pushManager.getSubscription()
        .then(function(subscription) {
            if (subscription) {
                return new String(subscription.endpoint).substr(new String(subscription.endpoint).indexOf('gcm/send/') + 9);
            }
            throw new Error('User not subscribed');
        });
}

self.onmessage = function(e) {
    state = e.data;
    // console.log(state);
    // console.log(e);
    port = e.ports[0];
};

self.addEventListener('push', function(event) {
    // console.log('Received a push message', event);

    const { data } = event;
    let notificationOptions = {};

    if (data != null && data.text() == 'Test push message from DevTools.') {
        notificationOptions = {
            body: 'Test!',
            icon: '/img/push-icon.png',
            tag: 'ESCB',
            path: '#',
        };
        event.waitUntil(self.registration.showNotification('TEST NOTIFICATION', notificationOptions));
    } else {
        event.waitUntil(
            getEndpoint().then(function(endpoint) {
                return fetch(`/getPayload/${endpoint}`).then(function(data) {
                    if (data.status == 200) {
                        data.json().then(function(json) {
                            notificationOptions = {
                                body: json.message,
                                icon: '/img/push-icon.png',
                                tag: 'ESCB',
                                data: json,
                            };
                            // console.log(json);
                            // console.log(state);
                            if (state != 'visible') {
                                self.registration.showNotification(json.from, notificationOptions);
                            }
                        });
                    }
                }).catch(function(err) {
                    console.log(err);
                });
            }),
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    // console.log('[Service Worker] Notification click Received.', event);
    if (event.notification.data) {
        event.waitUntil(
            clients.openWindow(event.notification.data.path),
        );
    }
    event.notification.close();
});
