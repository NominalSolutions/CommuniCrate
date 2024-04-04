const express = require('express');
const router = express.Router();
const Subscription = require('../models/subscriptionModel');
const Notifications = require('../models/notificationsModel');
const webPush = require('web-push');
const mongoose = require('mongoose');

router.post('/create-notification', async (req, res) => {
    const { title, body, ActiveFrom, ActiveTo, selectedLoginIds, selectedGroupIds } = req.body;
    try {
        const newNotification = new Notifications({
            notifications: [{
                audience: [{
                    individual: selectedLoginIds.map(loginId => ({ loginId, delivered: false })),
                    group: selectedGroupIds.map(groupId => ({ groupId, delivered: false })),
                }],
                title,
                body,
                ActiveFrom,
                ActiveTo
            }]
        });
        await newNotification.save();
        res.status(201).json({ message: 'Notification created successfully', data: newNotification });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create notification', error: error.message });
    }
});

// delete all notifications from all subscribers
router.delete('/delete-all-notifications', async (req, res) => {
    try {
        const subscriptions = await Subscription.find({});
        for (let subscription of subscriptions) {
            subscription.notifications = [];
            console.log(`Deleting notifications for subscription: ${subscription.endpoint}`);
            await subscription.save();
        }
        res.status(200).json({ message: 'All notifications deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete all notifications', error: error.message });
    }
});

// POST endpoint to send a notification to all subscribers
router.post('/send-notify-all', async (req, res) => {
    const { title, body, groupAttribute } = req.body;

    try {
        let query = {};

        // If a groupAttribute is provided, use it to filter subscriptions
        if (groupAttribute && groupAttribute.value) {
            query.filter = { $regex: groupAttribute.value.trimStart(), $options: 'i' }; // Case-insensitive match
        }

        const subscriptions = await Subscription.find(query);
        console.log(`Sending notifications, found ${subscriptions.length} subscriptions matching filter criteria.`);

        // Explicitly create an ObjectId for the notification
        const notificationId = new mongoose.Types.ObjectId();

        // for each subscription, store the notification in the database and send the notification and  wait for promise to resolve
        await Promise.all(subscriptions.map(async subscription => {
            subscription.notifications.push({
                pkId: notificationId,
                title: title,
                body: body
            });

            await subscription.save();

            // Construct payload including the notification ID
            const payload = JSON.stringify({ endpoint: subscription.endpoint, title, body, notificationId: notificationId.toString() });

            await webPush.sendNotification(subscription.toObject(), payload);
        }));       

        res.status(200).json({ message: `Notifications sent successfully${groupAttribute ? ` to group ${groupAttribute.value.trimStart()}` : " to all subscribers"}.` });
    } catch (error) {
        console.error('Error sending notifications: ', groupAttribute.value);
        if (error.statusCode === 410) {
            // Remove the subscription from your database
            await Subscription.deleteOne({ endpoint: error.endpoint });
            res.status(410).json({ message: "Subscription has been deleted." });
            console.log("Subscription has been deleted.");
        }
        else if (error.statusCode === 404) {
            res.status(404).json({ message: "Subscription not found." });
            console.log("Subscription not found.");
        }
        else {
            res.status(500).json({ message: "Error sending notifications", error: error.toString() });
        }
    }
});

// Enpoint to receive notification receipts
router.post('/notification-receipt', async (req, res) => {
    console.log("Processing notification receipt");
    const { endpoint, notificationId } = req.body;
    try {
        const subscription = await Subscription.findOne({ endpoint });
        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        // Find the notification by its ID and update the receipt date       
        const notification = subscription.notifications.find(n => n.pkId.toString() === notificationId);
        if (!notification) {
            console.log("Notification not found.");
            return res.status(404).json({ message: "Notification not found." });
        }

        notification.receipt = { dateTime: Date.now() };
        await subscription.save();
        console.log("Notification receipt processed successfully");
        res.status(200).json({ message: "Notification receipt processed successfully" });
    } catch (err) {
        console.error("Error processing notification receipt:", err);
        res.status(500).json({ message: "Error processing notification receipt", error: err.toString() });
    }
});

router.post('/mark-notification-deleted', async (req, res) => {
    const { endpoint, notificationId } = req.body;

    try {
        const subscription = await Subscription.findOne({ endpoint });
        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        // Find the notification by its ID
        const notification = subscription.notifications.find(n => n.pkId.toString() === notificationId);
        if (!notification) {
            console.log("Notification not found.");
            return res.status(404).json({ message: "Notification not found." });
        }

        // Set the deleteDate for the notification
        notification.receipt.deleteDate = Date.now();

        // Save the subscription document to persist changes
        await subscription.save();
        res.status(200).json({ message: "Notification marked as deleted successfully" });
    } catch (err) {
        console.error("Error marking notification as deleted:", err);
        res.status(500).json({ message: "Error marking notification as deleted", error: err.toString() });
    }
});


router.get('/notifications/status', async (req, res) => {
    try {
        const subscriptions = await Subscription.find({}).select('notifications -_id');
        const notifications = subscriptions.flatMap(sub => sub.notifications.map(notif => ({
            id: notif.pkId,
            title: notif.title,
            createDate: notif.createDate,
            received: !!notif.receipt.dateTime,
            deleted: !!notif.receipt.deleteDate,
        })));
        
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: "Error fetching notification statuses", error: error.toString() });
    }
});


module.exports = router;
