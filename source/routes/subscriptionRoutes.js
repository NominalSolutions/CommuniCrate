const express = require('express');
const router = express.Router();
const Subscription = require('../models/subscriptionModel');
const webPush = require('web-push');
const mongoose = require('mongoose');

// POST endpoint to add a new subscription
router.post('/subscribe', async (req, res) => {
    try {
        const filter = { endpoint: req.body.endpoint }; // Define how to find the document
        const update = {
            endpoint: req.body.endpoint,
            keys: {
                p256dh: req.body.subscription.keys.p256dh,
                auth: req.body.subscription.keys.auth
            },
            loginId: req.body.loginId,
            browser: req.body.browser,
            locale: req.body.locale,
            customData: req.body.customData,
            filter: req.body.filter,
            lastLogin: Date.now(),
        };

        const options = { new: true, upsert: true }; // Return the modified document and create a new one if it doesn't exist

        // Find the subscription and update it, or insert it if it doesn't exist
        const subscription = await Subscription.findOneAndUpdate(filter, update, options);

        res.status(201).json({ message: 'Subscription processed successfully.', subscription });
    } catch (error) {
        console.error('Error in /subscribe:', error);
        res.status(500).json({ message: 'Failed to process subscription', error: error.message });
    }
});

// DELETE endpoint to remove all subscriptions
router.delete('/subscriptions', async (req, res) => {
    try {
        await Subscription.deleteMany({}); // Deletes all documents in the collection
        res.status(200).json({ message: 'All subscriptions have been deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete subscriptions', error: error.message });
    }
});

// GET endpoint to fetch all subscriptions
router.get('/subscriptions', async (req, res) => {
    try {
        const subscriptions = await Subscription.find({});
        res.status(200).json(subscriptions);
    } catch (error) {
        res.status(500).send({ message: 'Failed to fetch subscriptions', error: error.message });
    }
});

router.post('/send-notification', async (req, res) => {
    const { endpoint } = req.body;
    const { title, body } = req.body;
    try {
        const subscription = await Subscription.findOne({ endpoint }); // Fetch the subscription from your database
        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        // Explicitly create an ObjectId for the notification
        const notificationId = new mongoose.Types.ObjectId();

        // Add the new notification with the created ObjectId
        subscription.notifications.push({
            pkId: notificationId,
            title: title,
            body: body
        });

        await subscription.save();

        // Construct payload including the notification ID
        const payload = JSON.stringify({ endpoint: endpoint, title, body, notificationId: notificationId.toString() });

        await webPush.sendNotification(subscription.toObject(), payload);

        res.status(200).json({ message: "Notification sent successfully" });
    } catch (error) {
        console.error('Error sending notifications to: ', req.body.endpoint, error);
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
