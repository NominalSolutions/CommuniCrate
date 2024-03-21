# Nominal Solutions CommuniCrate
CommuniCrate, brought to you by Nominal Solutions LLC, is a comprehensive solution for managing subscriptions and notifications. It simplifies the process of sending targeted notifications and managing subscriber lists, making communication seamless and efficient.

## Features
- Subscription Management: Easily manage and store subscriber details.
- Send Notifications: Seamlessly send notifications to individual subscribers or in bulk.
- Analytics: Track the delivery and interaction of sent notifications.
- Security: Ensure the security of your communications with industry-standard protocols.

## Getting Started
### Prerequisites
- Node.js (version 12.x or above)
- MongoDB (version 4.x or above)
- npm (version 6.x or above)

# Installation
1. Clone the repository:

```sh
git clone https://github.com/yourusername/communicrate.git
```

2. Navigate to the project directory:

```sh
cd communicrate
```

3. Install dependencies:

```sh
npm install
```

4. Configure your environment variables:
Create a .env file in the root directory and set up your environment variables:

```env
DATABASE_URI=mongodb://localhost:27017/communicrate
VAPID_PUBLIC_KEY=YourVapidPublicKey
VAPID_PRIVATE_KEY=YourVapidPrivateKey
```

5. Start the server:

```sh
npm start
```

Your CommuniCrate backend should now be running and accessible.

# Usage
## Subscribing a User
Send a POST request to /api/subscribe with the subscription object and loginId:

``` json
{
  "endpoint": "https://example.com/push-service/send/some-unique-id",
  "keys": {
    "auth": "yourAuthKey",
    "p256dh": "yourP256dhKey"
  },
  "loginId": "userLoginId123"
}
```

## Sending Notifications
- To all subscribers: Send a POST request to /api/send-notify-all with a title and body in the request body.
- To a specific subscriber: Send a POST request to /api/send-notification with the subscription details and message payload.

# Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

# License
Distributed under the MIT License. See LICENSE for more information.

Project Link: https://github.com/nominalsolutions/communicrate