// Push Notifications
// service-worker.js
self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    
    const data = event.data.json(); // Assuming your server sends JSON data

    // Show a notification using Service Worker's API if needed
    const title = data.title;
    const options = {
        body: data.body,
        // You can add more options to customize the notification
    };

    if (!data.isResend) {
        event.waitUntil(self.registration.showNotification(title, options));
    }

    const datetimeReceived = new Date().toISOString(); // ISO format datetime

    // Enhance data object with received datetime
    const notificationData = { ...data, datetimeReceived };
    
    // Post the message data to clients
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            console.log('[Service Worker] Sending message to client.');
            client.postMessage(notificationData); // Send the actual push data
        });
    });
});

