importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyDaUkAstAp9UmIe7JXL-nyZWC2pj9mbMds",
  authDomain: "anting-app-0001.firebaseapp.com",
  projectId: "anting-app-0001",
  storageBucket: "anting-app-0001.firebasestorage.app",
  messagingSenderId: "1056425866540",
  appId: "1:1056425866540:web:255444cf3c30c607606889"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
