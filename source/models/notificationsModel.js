const mongoose = require('mongoose');

const notificationsSchema = new mongoose.Schema({
    notifications: [{
        pkId: { type: String, required: true, unique: true, default: () => new mongoose.Types.ObjectId() },
        audience: [{
            everyone: { type: Boolean, required: true, default: false },
            individual: [{ 
                loginId: { type: String, required: false },
                delivered: { type: Boolean, required: true, default: false } 
            }],
            group: [{ 
                groupId: { type: String, required: false },
                delivered: { type: Boolean, required: true, default: false }
            }],
        }],
        title: { type: String, required: true },
        body: { type: String, required: true },
        ActiveFrom: { type: Date, required: true, default: null},
        ActiveTo: { type: Date, required: true, default: null}        
    }],
}, { timestamps: true }); // Enable timestamps to automatically add createdAt and updatedAt fields

const Notifications = mongoose.model('Notifications', notificationsSchema);

module.exports = Notifications;
