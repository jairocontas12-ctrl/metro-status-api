self.addEventListener("push", e => {
  const data = e.data.json();
  
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    vibrate: [200, 100, 200],
    requireInteraction: true // Fica na tela até clicar
  });
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  // Abre o site ao clicar na notificação
  e.waitUntil(
    clients.openWindow("/")
  );
});
