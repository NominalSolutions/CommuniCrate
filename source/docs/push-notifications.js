///PushNotifications
// Subscribe the user to push

let fullMessage;
function subscribeUser(swReg) {
    const applicationServerKey = urlBase64ToUint8Array('ADD_KEY'); //generate using keygen.js
    swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    })
        .then(subscription => {
            const browserData = getBrowserData(); // Function to get browser name, version, and OS
            const locale = navigator.language;

            // Prepare the subscription object to match the expected schema
            const subscriptionData = {
                endpoint: subscription.endpoint,
                subscription: subscription,
                loginId: "user01", // Replace with actual loginId
                browser: browserData,
                locale: locale,
                customData: "{\"branch\": \"Test Branch\", \"Tag\": \"483AA3\"}", // replace with actual data
                filter: "Test Branch" //replace with actual data
            };

            // Send the subscription object to the server
            fetch('http://localhost:3000/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriptionData)
            })
                .then(response => response.json())
                .then(data => console.log(data))
                .catch(error => console.error('Error subscribing', error));
        })
        .catch(error => console.error('Failed to subscribe the user: ', error));
}

function getBrowserData() {
    // Simple example function to obtain browser data. Consider using a library for more accurate results.
    const ua = navigator.userAgent;
    let name = 'Unknown', version = 'Unknown', os = 'Unknown';

    // Simplistic detection, might need more sophisticated library like UAParser.js for complex cases
    if (ua.indexOf("Firefox") !== -1) {
        name = "Firefox";
        version = ua.split("Firefox/")[1].split(" ")[0];
    } else if (ua.indexOf("Chrome") !== -1) {
        name = "Chrome";
        version = ua.split("Chrome/")[1].split(" ")[0];
    } // Add more conditions for other browsers

    if (ua.indexOf("Windows") !== -1) os = "Windows";
    else if (ua.indexOf("Macintosh") !== -1) os = "MacOS";
    // Add more conditions for other OSes

    return { name, version, os };
}

// Utility function
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

//Locally store notifications
function storeNotification(data) {
    // Get existing notifications from local storage
    let notifications = JSON.parse(localStorage.getItem('notifications')) || [];

    // Add the new notification data
    notifications.push(data);

    // Save back to local storage
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationIcon();
}

// Function to show the notification
function showNotification(message) {
    const notificationContainer = document.getElementById('notification-container');
    const messageElement = document.getElementById('notification-message');
    const titleElement = document.getElementById('notification-title');
    const readMoreElement = document.getElementById('notification-read-more');
    
    titleElement.textContent = message.title;
    if (message.body.length > 100) {
        messageElement.textContent = `${message.body.substring(0, 97)}...`;
        readMoreElement.style.display = 'inline'; // Show 'Read More'
        fullMessage = message.body;
    } else {
        messageElement.textContent = message.body;
        readMoreElement.style.display = 'none'; // Hide 'Read More'
    }

    notificationContainer.style.display = 'block';
}

function updateNotificationIcon() {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const icon = document.querySelector('.notification-icon');
    // Change icon color based on notifications presence
    icon.style.color = notifications.length > 0 ? 'gold' : 'white';
}


// Close the modal when the user clicks anywhere outside of it
window.onclick = function (event) {
    const modal = document.getElementById('notification-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'stored-notifications';
    document.body.appendChild(container);
    return container;
}

// Function to close the notification
function closeNotification() {
    document.getElementById('notification-container').style.display = 'none';

    isExpanded = false;
}

let isExpanded = false;

function toggleExpandNotification() {
    const container = document.getElementById('notification-container');
    const content = document.getElementById('notification-content');
    const readMoreLink = document.getElementById('notification-read-more');

    const messageElement = document.getElementById('notification-message');

    if (!isExpanded) {
        // Expand
        container.style.width = '400px'; // Increase width
        content.style.maxHeight = 'none'; // Remove max height restriction
        readMoreLink.style.display = 'none'; // Hide read more link
        isExpanded = true;
        messageElement.textContent = fullMessage;
    } else {
        // Collapse
        container.style.width = '300px'; // Reset width
        content.style.maxHeight = '200px'; // Reset max height
        isExpanded = false;
    }
}

///////////////

function displayStoredNotifications() {
    const modal = document.getElementById('customNotificationModal');
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = ''; // Clear current list content

    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const icon = document.querySelector('.notification-icon');
    icon.style.color = notifications.length > 0 ? 'gold' : 'white';

    if (notifications.length === 0) {
        notificationList.innerHTML = '<br><br><p>No notifications to display</p>';

        modal.style.display = 'block';
        return;
    }

    // Create table elements
    const table = document.createElement('table');
    table.className = 'cp-datatable';
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Define table headers
    thead.innerHTML = `<tr>
                        <th>Time Received</th>
                        <th>Title</th>
                        <th></th>
                        <th></th>
                       </tr>`;

    // Populate table rows
    notifications.forEach((notification, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${new Date(notification.datetimeReceived).toLocaleString()}</td>
                        <td>${notification.title}</td>
                        <td><a href="#" class="table-link view-link" onclick="viewNotification(${index})">View</a></td>
                        <td><a href="#" class="table-link delete-link" onclick="deleteNotification(${index})">Delete</a></td>`;
        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    notificationList.appendChild(table);

    modal.style.display = 'block';
}

function closeCustomModal() {
    const modal = document.getElementById('customNotificationModal');
    modal.style.display = 'none';
}

function clearNotifications() {
    localStorage.setItem('notifications', JSON.stringify([]));
    displayStoredNotifications(); // Refresh the list
}

function deleteNotification(index) {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const notification = notifications[index];  
    const notificationId = notification.notificationId;
    const endpoint = notification.endpoint;

    // Send a request to the server to delete the notification
    fetch('http://localhost:3000/api/mark-notification-deleted', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId, endpoint })
    })
        .then(response => {
            if (!response.ok) {
                // If the server response was not OK, throw an error with the status
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return response.json(); // Parse JSON response if the request was successful
        })
        .then(data => {
            console.log('Notification was deleted successfully:', data);

            notifications.splice(index, 1);
            localStorage.setItem('notifications', JSON.stringify(notifications));
            displayStoredNotifications(); // Refresh the list
        })
        .catch(error => {
            // if 404, force delete from local storage
            if (error.message.includes('404')) {
                notifications.splice(index, 1);
                localStorage.setItem('notifications', JSON.stringify(notifications));
                displayStoredNotifications(); // Refresh the list
            }
            else {
                console.error('Error deleting notification:', error);
            }
        });
}

function viewNotification(index) {
    // Logic to view a specific notification
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const notification = notifications[index];
    showNotification(notification);
}


function sendReceiptNotification(data) {

    const receipt = {
        endpoint: data.endpoint,
        notificationId: data.notificationId
    }
    console.log(data.endpoint);
    fetch('http://localhost:3000/api/notification-receipt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(receipt)
    })
        .then(response => {
            if (!response.ok) {
                // If the server response was not OK, throw an error with the status
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return response.json(); // Parse JSON response if the request was successful
        })
        .then(data => {
            console.log('Notification receipt was recorded successfully:', data);
        })
        .catch(error => {
            console.error('Error sending notification receipt:', error);
        });
}