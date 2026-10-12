"@/components/ServiceWorkerRegistration";

// Inside your metadata export, add:
export const metadata: Metadata = {
  // ... existing metadata ...
  manifest: "/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ChayilResources",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
  themeColor: "#1e40af",
};

// Inside your <body> tag, add:
<body>
  <ServiceWorkerRegistration />
  {/* ... rest of your body content ... */}
</body>
