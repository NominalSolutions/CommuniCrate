const cron = require('node-cron');
const Notifications = require('../models/notificationsModel'); // Update the path
const Subscription = require('../models/subscriptionModel'); // Update the path

// The cron job function
async function processNotifications() {
    const now = new Date();

    // Find active notifications
    const activeNotifications = await Notifications.find({
        'notifications.ActiveFrom': { $lte: now },
        'notifications.ActiveTo': { $gte: now }
    });

    // Loop through each notification
    for (let notification of activeNotifications) {
        // For simplicity, considering the first notification in array. Adjust based on your logic.
        const notif = notification.notifications[0];

        console.log('Processing notification:', notif.pkId);
        // Determine audience (individual or group) and find matching subscriptions
        // This example demonstrates a simple approach. Customize based on your audience logic.
        for (let audience of notif.audience) {
            if (audience.everyone) {
                console.log('Sending notification to everyone');
                await addNotificationToAllSubscriptions(notif);
            } else {
                console.log('Sending notification to specific audience');
                await addNotificationToSpecificAudience(audience, notif);
            }
        }
    }
}

async function addNotificationToAllSubscriptions(notification) {
    // Find all subscriptions without filtering them by whether they already contain the notification.
    // The check for existing notification pkId will be performed in JavaScript.
    const subscriptions = await Subscription.find({});

    for (let subscription of subscriptions) {
        // Check if the notification pkId already exists in this subscription's notifications
        const notificationExists = subscription.notifications.some(n => n.pkId.toString() === notification.pkId.toString());

        if (!notificationExists) {
            console.log('Adding notification to subscription:', subscription._id);
            // If the notification pkId does not exist, add the new notification
            subscription.notifications.push({
                pkId: notification.pkId,
                delivered: false, // Assuming you want to set delivered to false by default
                title: notification.title,
                body: notification.body,
                createDate: new Date(), // Assuming you want to set createDate to now
                // Add other necessary fields according to your schema
            });

            await subscription.save();
        }
    }
}


async function addNotificationToSpecificAudience(audience, notification) {
    // Find subscriptions based on audience criteria that do not already contain the notification pkId
    const subscriptions = await Subscription.find({
        $or: [
            { loginId: { $in: audience.individual.map(i => i.loginId) } },
            { filter: { $in: audience.group.map(g => g.groupId) } }
        ],
        'notifications.pkId': { $ne: notification.pkId }
    });

    console.log('Adding notification to specific audience:', subscriptions.length, 'subscriptions found.');

    subscriptions.forEach(async (subscription) => {
        // Check if the notification pkId already exists in the subscription's notifications

        console.log('Adding notification to subscription:', subscription._id);
        // Push the new notification if it doesn't exist
        subscription.notifications.push({
            pkId: notification.pkId,
            delivered: false,
            title: notification.title,
            body: notification.body,
            createDate: new Date(),
        });

        await subscription.save();

    });
}


cron.schedule('* * * * *', () => {
    console.log('Running StageNotifications job...');
    processNotifications();
});
