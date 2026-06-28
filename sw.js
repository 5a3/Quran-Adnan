// ملف الخدمة في الخلفية (Service Worker) لإرسال الإشعارات
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // عند الضغط على الإشعار يفتح موقع الصدقة الجارية للفقيد
    event.waitUntil(
        clients.openWindow('/')
    );
});

// استقبال طلب إرسال الإشعار من ملف app.js الرئيسي
self.addEventListener('message', function(event) {
    if (event.data && event.data.action === 'sendNotification') {
        self.registration.showNotification('صدقة جارية 🌟', {
            body: event.data.text,
            icon: 'https://cdn-icons-png.flaticon.com/512/2913/2913520.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/2913/2913520.png',
            dir: 'rtl'
        });
    }
});