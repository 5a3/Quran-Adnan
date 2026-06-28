const surahContainer = document.getElementById('surahContainer');
const audioPlayerContainer = document.getElementById('audioPlayerContainer');
const mainAudio = document.getElementById('mainAudio');
const currentSurahTitle = document.getElementById('currentSurahTitle');
const notificationBanner = document.getElementById('notificationBanner');
const btnAllowNotifications = document.getElementById('btnAllowNotifications');

const azkarList = [
    "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
    "أستغفر الله العظيم وأتوب إليه .. استغفر لعلها تفرج.",
    "لا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّهِ العلي العظيم",
    "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
    "لا إِلَهَ إِلا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
    "الحَمْدُ لله حَمداً كَثيراً طَيّباً مُباركاً فِيه",
    "اللهم اغفر للمؤمنين والمؤمنات والمسلمين والمسلمات الأحياء منهم والأموات.",
    "اللهم ارحم عدنان علي العطاس واغفر له واجعل قبره روضة من رياض الجنة."
];

// ==========================================
// 1. إدارة الإشعارات والـ Service Worker
// ==========================================
if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.register('sw.js')
    .then(function(swReg) {
        console.log('Service Worker Registered Successfully');
        // نقوم بالفحص بعد تسجيل الـ Service Worker بنجاح
        checkNotificationStatus();
    })
    .catch(function(error) {
        console.error('Service Worker Error:', error);
    });
} else {
    // إذا كان المتصفح لا يدعم الإشعارات نهائياً نقوم بإخفاء الشريط
    if(notificationBanner) notificationBanner.style.display = 'none';
}

function checkNotificationStatus() {
    // إذا وافق المستخدم مسبقاً: نُخفي الشريط تماماً ونشغل المؤقت
    if (Notification.permission === 'granted') {
        if (notificationBanner) notificationBanner.style.setProperty('display', 'none', 'important');
        startZikrTimer();
    } 
    // إذا رفض المستخدم مسبقاً: نُخفي الشريط أيضاً لأنه اختار الرفض
    else if (Notification.permission === 'denied') {
        if (notificationBanner) notificationBanner.style.setProperty('display', 'none', 'important');
    } 
    // إذا كانت الحالة افتراضية (لم يختار بعد): نترك الشريط ظاهراً ليضغط عليه
    else {
        if (notificationBanner) notificationBanner.style.setProperty('display', 'flex', 'important');
    }
}

if(btnAllowNotifications) {
    btnAllowNotifications.addEventListener('click', function() {
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                if (notificationBanner) notificationBanner.style.setProperty('display', 'none', 'important');
                sendZikrNotification("تم تفعيل التذكير بالأذكار بنجاح. جزاك الله خيراً.");
                startZikrTimer();
            } else {
                if (notificationBanner) notificationBanner.style.setProperty('display', 'none', 'important');
            }
        });
    });
}

function triggerRandomZikr() {
    const randomIndex = Math.floor(Math.random() * azkarList.length);
    const zikrText = azkarList[randomIndex];
    sendZikrNotification(zikrText);
}

function sendZikrNotification(text) {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            action: 'sendNotification',
            text: text
        });
    }
}

function startZikrTimer() {
    const oneHour = 3600000;
    setInterval(triggerRandomZikr, oneHour);
}

// ==========================================
// 2. جلب وتشغيل وتحميل سور القرآن الكريم
// ==========================================
async function fetchSurahs() {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/quran/ar.alafasy');
        const data = await response.json();
        displaySurahs(data.data.surahs);
    } catch (error) {
        surahContainer.innerHTML = '<p style="text-align: center; color: red; grid-column: 1/-1;">حدث خطأ أثناء تحميل السور. يرجى التحديث.</p>';
        console.error(error);
    }
}

function displaySurahs(surahs) {
    surahContainer.innerHTML = '';

    surahs.forEach(surah => {
        const card = document.createElement('div');
        card.classList.add('surah-card');
        
        const formattedNumber = String(surah.number).padStart(3, '0');
        const audioUrl = `https://server8.mp3quran.net/afs/${formattedNumber}.mp3`;

        card.innerHTML = `
            <div class="surah-info">
                <div class="surah-number">${surah.number}</div>
                <div>
                    <div class="surah-name">سورة ${surah.name}</div>
                    <div class="surah-meta">${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} | آياتها ${surah.ayahs.length}</div>
                </div>
            </div>
            <div class="card-controls">
                <button class="download-btn" data-url="${audioUrl}" data-name="سورة_${surah.name}" title="تحميل السورة">
                    <i class="fa-solid fa-cloud-arrow-down"></i>
                </button>
                <div class="play-icon"><i class="fa-solid fa-play"></i></div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.download-btn')) return;

            document.querySelectorAll('.surah-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            currentSurahTitle.innerText = `جاري التشغيل: سورة ${surah.name}`;
            mainAudio.src = audioUrl;
            audioPlayerContainer.style.display = 'flex';
            mainAudio.play();
        });

        surahContainer.appendChild(card);
    });

    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('data-url');
            const name = this.getAttribute('data-name');
            downloadAudio(url, name, this);
        });
    });
}

async function downloadAudio(url, filename, buttonElement) {
    const originalIcon = buttonElement.innerHTML;
    buttonElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    buttonElement.style.pointerEvents = 'none';

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${filename}.mp3`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('فشل التحميل المباشر:', error);
        window.open(url, '_blank');
    } finally {
        buttonElement.innerHTML = originalIcon;
        buttonElement.style.pointerEvents = 'auto';
    }
}

fetchSurahs();