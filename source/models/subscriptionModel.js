const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    endpoint: { type: String, required: true, unique: true },
    keys: {
        auth: { type: String, required: true },
        p256dh: { type: String, required: true }
    },
    loginId: { type: String, required: true },
    browser: {
        name: { type: String, required: true }, // e.g., Chrome, Firefox
        version: { type: String, required: true }, // e.g., 87.0.4280
        os: { type: String, required: true }, // e.g., Windows 10
    },
    lastLogin: { type: Date, default: Date.now }, // Automatically set to the current date
    customData: { type: String, required: false },
    filter: { type: String, required: false },
    locale: { type: String, required: false },
    notifications: [{
        pkId: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        body: { type: String, required: true },
        createDate: { type: Date, default: Date.now },
        receipt: {
            dateTime: { type: Date, required: false, default: null},
            deleteDate: { type: Date, required: false, default: null}
        }
    }],
}, { timestamps: true }); // Enable timestamps to automatically add createdAt and updatedAt fields

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
