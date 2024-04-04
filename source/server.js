require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const webPush = require('web-push');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json()); // Middleware to parse JSON bodies

// Require the ResendNotifications.js to start the job
require('./jobs/StageNotifications');
require('./jobs/ResendNotifications');

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

const subscriptionRoutes = require('./routes/subscriptionRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');

// Use routes
app.use('/api', subscriptionRoutes);
app.use('/api', notificationsRoutes);

webPush.setVapidDetails(
    'mailto:' + process.env.MAILTO_ADDRESS,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  
