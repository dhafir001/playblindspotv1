# BLINDSPOT — Psychological Horror 3D Web Game (1-Folder Flat & Subfolder Compatible)

Seluruh file HTML, CSS, dan modul JavaScript kini berada **di dalam satu folder yang sama** (dan juga tetap kompatibel jika Anda memasukkannya ke dalam subfolder):

```text
blindspot/
├── index.html                        # File utama HTML5
├── style.css                         # Stylesheet utama
├── main.js                           # Entry point aplikasi
├── SettingsManager.js                # Modul pengaturan & localStorage
├── HorrorAudioEngine.js              # Modul BGM, SFX & Ambience Koridor
├── HorrorVisualRenderer.js           # Modul renderer Canvas 3D koridor & grain
├── BlindspotAnomalyController.js     # Modul siluet blindspot & glitch judul
├── IntroSequencer.js                 # Modul antrean Voice-Over Intro (01-12) & Subtitle
├── GameScene.js                      # Hook initGameScene() & FPP Pointer Lock
├── bgm_menu.mp3, ui_hover.mp3, ...   # File audio (tersedia di root & assets/audio/)
└── assets/audio/                     # Cadangan path standar assets/audio/
```
