/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyDaUkAstAp9UmIe7JXL-nyZWC2pj9mbMds',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'anting-app-0001.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'anting-app-0001',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'anting-app-0001.firebasestorage.app',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '1056425866540',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:1056425866540:web:255444cf3c30c607606889',
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: 'service_Anting Gmail',
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'template_ldawy7n',
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: 'obIJwnfu1eIk3rYGH',
    NEXT_PUBLIC_TELEGRAM_BOT_TOKEN: '8696316543:AAGV7Y4GwKt8eezkjG1VZroJhhoqSAq4B4A',
    NEXT_PUBLIC_TELEGRAM_CHAT_ID: '8933138604',
  },
};

module.exports = nextConfig;
