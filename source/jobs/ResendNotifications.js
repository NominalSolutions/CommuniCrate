const cron = require('node-cron');
const Subscription = require('../models/subscriptionModel');
const webPush = require('web-push');

// Function to resend notifications without a receipt
async function resendUnreceivedNotifications() {
    try {
        // Find all subscriptions
        const subscriptions = await Subscription.find({});

        // Iterate over each subscription
        for (let subscription of subscriptions) {
            // Filter notifications without a receipt date
            const unreceivedNotifications = subscription.notifications.filter(notification => !notification.receipt || !notification.receipt.dateTime);

            // Resend each unreceived notification
            for (let notification of unreceivedNotifications) {
                const payload = JSON.stringify({
                    endpoint: subscription.endpoint,
                    notificationId: notification.pkId,
                    title: notification.title,
                    body: notification.body,
                    isResend: true
                });

                // Resend notification using web-push
                await webPush.sendNotification(subscription.toObject(), payload);
                console.log("Resending notification", notification.pkId, "to", subscription.endpoint);
                // Optionally, update the notification to reflect the resend attempt
                // Note: This step depends on how you want to track resend attempts
            }

            // Save the subscription if you've made changes (e.g., tracking resend attempts)
            await subscription.save();
        }
    } catch (error) {
        console.error('Error resending unreceived notifications:', error);
    }
}

// Schedule the job to run periodically (e.g., every hour)
cron.schedule('*/5 * * * *', () => {
    console.log('Running ResendNotifications job...');
    resendUnreceivedNotifications();
});