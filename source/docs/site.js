
if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(swReg => {
            console.log('Service Worker is registered', swReg);
            // Check the subscription
            checkSubscription(swReg);
        })
        .catch(error => {
            console.error('Service Worker Error', error);
        });
} else {
    console.warn('Push messaging is not supported');
}

function checkSubscription(swReg) {
    swReg.pushManager.getSubscription()
        .then(subscription => {
            if (subscription) {
                console.log('User is subscribed.', subscription);
                subscribeUser(swReg);
            } else {
                console.log('User is NOT subscribed.');
                subscribeUser(swReg);
            }
        });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        console.log('Received message from service worker:', event.data);
        const data = event.data;
        storeNotification(data);
        showNotification(data);
        sendReceiptNotification(data);
    });
}