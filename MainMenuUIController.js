/**
 * MODULE 5: UI, START TRANSITION, INTRO SEQUENCER & EYELID GAMEPLAY CONTROLLER
 * File: js/modules/MainMenuUIController.js
 */
(function (window) {
  'use strict';
  window.Blindspot = window.Blindspot || {};

  class MainMenuUIController {
    constructor(settings, audio, renderer, anomaly) {
      this.settings = settings;
      this.audio = audio;
      this.renderer = renderer;
      this.anomaly = anomaly;

      // Main Menu & Modal References
      this.autoplayOverlay = document.getElementById('autoplay-overlay');
      this.mainMenuWrapper = document.getElementById('main-menu-wrapper');
      this.btnStartGame = document.getElementById('btn-start-game');
      this.settingsBackdrop = document.getElementById('settings-modal-backdrop');
      this.creditsBackdrop = document.getElementById('credits-modal-backdrop');

      // Blackout, Intro Sequencer & In-Game Viewport References
      this.blackoutCurtain = document.getElementById('blackout-curtain');
      this.gameViewportContainer = document.getElementById('game-viewport-container');
      this.gameCanvas = document.getElementById('gameCanvas');
      this.pointerLockStatusEl = document.getElementById('fpp-pointerlock-status');
      this.btnExitToMenu = document.getElementById('btn-exit-to-menu');

      // Legacy Transition Elements (kept for compatibility)
      this.transitionScreen = document.getElementById('game-transition-screen');
      this.transitionEpigraph = document.getElementById('transition-epigraph');
      this.loadingTelemetry = document.getElementById('loading-telemetry');
      this.returnMenuBtn = document.getElementById('return-menu-btn');

      // Settings Form Controls
      this.sliderMasterVol = document.getElementById('slider-master-vol');
      this.labelMasterVol = document.getElementById('label-master-vol');
      this.sliderSfxVol = document.getElementById('slider-sfx-vol');
      this.labelSfxVol = document.getElementById('label-sfx-vol');
      this.sliderMouseSens = document.getElementById('slider-mouse-sens');
      this.labelMouseSens = document.getElementById('label-mouse-sens');
      this.toggleInvertY = document.getElementById('toggle-invert-y');
      this.selectQuality = document.getElementById('select-graphics-quality');
      this.togglePostFx = document.getElementById('toggle-postfx');
      this.saveStatusMsg = document.getElementById('settings-save-status');
      this.hudFovStatus = document.getElementById('hud-fov-status');
      this.quitFeedbackMsg = document.getElementById('quit-feedback-msg');

      // Instance IntroSequencer terhubung ke transisi masuk FPP Gameplay
      this.introSequencer = new window.Blindspot.IntroSequencer(
        this.settings,
        this.audio,
        () => this._enterGameplayFromIntro()
      );

      this._syncControlsFromState();
      this._applyVisualSettingsToDOM();
      this._bindEvents();
      this._startHudClock();
    }

    _syncControlsFromState() {
      const s = this.settings.state;
      this.sliderMasterVol.value = s.masterVolume;
      this.labelMasterVol.textContent = `${s.masterVolume}%`;

      this.sliderSfxVol.value = s.sfxVolume;
      this.labelSfxVol.textContent = `${s.sfxVolume}%`;

      this.sliderMouseSens.value = s.mouseSensitivity.toFixed(1);
      this.labelMouseSens.textContent = `${Number(s.mouseSensitivity).toFixed(1)}x`;

      this.toggleInvertY.setAttribute('aria-pressed', String(s.invertY));
      this.toggleInvertY.textContent = s.invertY ? 'ON' : 'OFF';

      this.selectQuality.value = s.graphicsQuality;

      this.togglePostFx.setAttribute('aria-pressed', String(s.postProcessing));
      this.togglePostFx.textContent = s.postProcessing ? 'ON' : 'OFF';
    }

    _applyVisualSettingsToDOM() {
      const s = this.settings.state;
      document.body.classList.remove('quality-low', 'quality-medium', 'quality-high');
      document.body.classList.add(`quality-${s.graphicsQuality.toLowerCase()}`);

      if (s.postProcessing) {
        document.body.classList.remove('postfx-off');
      } else {
        document.body.classList.add('postfx-off');
      }

      if (this.hudFovStatus) {
        this.hudFovStatus.textContent =
          `OPTIC_SENS: ${Number(s.mouseSensitivity).toFixed(1)}x | QUALITY: ${s.graphicsQuality.toUpperCase()}`;
      }

      this.renderer.resize();
      this.audio.applyRealTimeVolume();
    }

    _bindEvents() {
      // 1. Autoplay Policy Gate Overlay (Fail-safe: works on click, pointerdown, touchstart, or keydown)
      let gateUnlocked = false;
      const unlockHandler = () => {
        if (gateUnlocked) return;
        gateUnlocked = true;
        if (this.autoplayOverlay) {
          this.autoplayOverlay.classList.add('dismissed');
          this.autoplayOverlay.style.pointerEvents = 'none';
          this.autoplayOverlay.style.opacity = '0';
          setTimeout(() => {
            if (this.autoplayOverlay && this.autoplayOverlay.classList.contains('dismissed')) {
              this.autoplayOverlay.style.display = 'none';
            }
          }, 1300);
        }
        this.audio.unlockAndFadeIn();
        this.audio.playClickSfx();
        this.anomaly.triggerTitleGlitch(320);
      };
      window.__blindspotUnlockGate = unlockHandler;
      if (this.autoplayOverlay) {
        this.autoplayOverlay.addEventListener('click', unlockHandler);
        this.autoplayOverlay.addEventListener('pointerdown', unlockHandler);
        this.autoplayOverlay.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            unlockHandler();
          }
        });
      }
      // Jika pengguna sudah mengklik layar sebelum modul selesai dimuat, langsung buka gate:
      if (window.__blindspotGateClickedEarly) {
        unlockHandler();
      }

      // 2. Attach Hover & Click SFX
      document.querySelectorAll('[data-ui-sfx="true"]').forEach((el) => {
        el.addEventListener('mouseenter', () => this.audio.playHoverSfx());
        el.addEventListener('click', () => this.audio.playClickSfx());
      });

      // 3. Main Menu Navigation Buttons
      this.btnStartGame.addEventListener('click', () => {
        this.triggerStartGameTransition();
      });

      document.getElementById('btn-open-settings').addEventListener('click', () => {
        this.openSettingsModal();
      });

      document.getElementById('btn-open-credits').addEventListener('click', () => {
        this.openCreditsModal();
      });

      // 4. Settings Modal Controls
      this.sliderMasterVol.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.settings.state.masterVolume = val;
        this.labelMasterVol.textContent = `${val}%`;
        this.audio.applyRealTimeVolume();
        this.saveStatusMsg.textContent = 'PERUBAHAN BELUM DISIMPAN KE STORAGE';
      });

      this.sliderSfxVol.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.settings.state.sfxVolume = val;
        this.labelSfxVol.textContent = `${val}%`;
        this.saveStatusMsg.textContent = 'PERUBAHAN BELUM DISIMPAN KE STORAGE';
      });
      this.sliderSfxVol.addEventListener('change', () => {
        this.audio.playHoverSfx();
      });

      this.sliderMouseSens.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.settings.state.mouseSensitivity = val;
        this.labelMouseSens.textContent = `${val.toFixed(1)}x`;
        this._applyVisualSettingsToDOM();
        this.saveStatusMsg.textContent = 'PERUBAHAN BELUM DISIMPAN KE STORAGE';
      });

      this.toggleInvertY.addEventListener('click', () => {
        this.settings.state.invertY = !this.settings.state.invertY;
        this._syncControlsFromState();
        this.saveStatusMsg.textContent = 'PERUBAHAN BELUM DISIMPAN KE STORAGE';
      });

      this.selectQuality.addEventListener('change', (e) => {
        this.settings.state.graphicsQuality = e.target.value;
        this._applyVisualSettingsToDOM();
        this.saveStatusMsg.textContent = 'PERUBAHAN BELUM DISIMPAN KE STORAGE';
      });

      this.togglePostFx.addEventListener('click', () => {
        this.settings.state.postProcessing = !this.settings.state.postProcessing;
        this._syncControlsFromState();
        this._applyVisualSettingsToDOM();
        this.saveStatusMsg.textContent = 'PERUBAHAN BELUM DISIMPAN KE STORAGE';
      });

      document.getElementById('btn-save-settings').addEventListener('click', () => {
        const ok = this.settings.save();
        this.saveStatusMsg.textContent = ok
          ? 'TERSIMPAN KE LOCALSTORAGE BROWSER'
          : 'KONFIGURASI AKTIF DI MEMORI SESI';
        setTimeout(() => {
          this.closeSettingsModal();
        }, 220);
      });

      document.getElementById('btn-reset-settings').addEventListener('click', () => {
        this.settings.reset();
        this._syncControlsFromState();
        this._applyVisualSettingsToDOM();
        this.saveStatusMsg.textContent = 'DIKEMBALIKAN KE PENGATURAN DEFAULT';
      });

      document.getElementById('btn-close-settings-x').addEventListener('click', () => {
        this.closeSettingsModal();
      });

      // 5. Credits / Quit Modal Actions
      document.getElementById('btn-close-credits-x').addEventListener('click', () => {
        this.closeCreditsModal();
      });

      document.getElementById('btn-cancel-quit').addEventListener('click', () => {
        this.closeCreditsModal();
      });

      document.getElementById('btn-confirm-quit').addEventListener('click', () => {
        this.quitFeedbackMsg.textContent = 'MEMUTUSKAN TRANSMISI CAM_04...';
        this.audio.fadeVolumeTo(0, 1000);
        setTimeout(() => {
          this.closeCreditsModal();
          gateUnlocked = false;
          this.autoplayOverlay.style.display = 'flex';
          requestAnimationFrame(() => {
            this.autoplayOverlay.classList.remove('dismissed');
            this.autoplayOverlay.style.opacity = '1';
            this.autoplayOverlay.style.pointerEvents = 'auto';
          });
          this.audio.unlocked = false;
          this.quitFeedbackMsg.textContent = 'STATUS: TERKUNCI DI DALAM KORIDOR';
        }, 1050);
      });

      // 6. Pointer Lock pada klik pertama di #gameCanvas & tombol keluar kembali ke Menu
      if (this.gameCanvas) {
        this.gameCanvas.addEventListener('click', () => {
          this._requestBodyPointerLock();
        });
      }

      document.addEventListener('pointerlockchange', () => {
        if (!this.pointerLockStatusEl) return;
        const locked = Boolean(document.pointerLockElement);
        this.pointerLockStatusEl.textContent = locked
          ? 'POINTER LOCK: AKTIF [ESC UNTUK MELEPAS]'
          : 'KLIK LAYAR KORIDOR UNTUK MENGUNCI KURSOR (POINTER LOCK)';
      });

      if (this.btnExitToMenu) {
        this.btnExitToMenu.addEventListener('click', () => {
          this.returnToMainMenu();
        });
      }

      if (this.returnMenuBtn) {
        this.returnMenuBtn.addEventListener('click', () => {
          this.returnToMainMenu();
        });
      }

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.settingsBackdrop.classList.contains('open')) {
            this.closeSettingsModal();
          }
          if (this.creditsBackdrop.classList.contains('open')) {
            this.closeCreditsModal();
          }
        }
      });
    }

    openSettingsModal() {
      this.saveStatusMsg.textContent = 'KONFIGURASI SINKRON DENGAN LOCALSTORAGE';
      this.settingsBackdrop.classList.add('open');
    }

    closeSettingsModal() {
      this.settingsBackdrop.classList.remove('open');
    }

    openCreditsModal() {
      this.creditsBackdrop.classList.add('open');
    }

    closeCreditsModal() {
      this.creditsBackdrop.classList.remove('open');
    }

    /**
     * 1. Transisi Pasca-Klik START:
     * - Kunci/nonaktifkan tombol START agar tidak bisa diklik ganda.
     * - Fade-out volume BGM menu secara bertahap hingga senyap (1.5 detik), lalu pause & stop.
     * - Terapkan fade-to-black pekat pada layar dan sembunyikan seluruh UI Main Menu (display: none).
     * - Jalankan IntroSequencer (Index 0 - 11).
     */
    triggerStartGameTransition() {
      if (this.btnStartGame.disabled) return;
      this.btnStartGame.disabled = true;

      this.anomaly.triggerTitleGlitch(420);
      this.mainMenuWrapper.classList.add('fading-out');
      this.blackoutCurtain.classList.remove('hidden');
      this.blackoutCurtain.classList.add('active');

      // Fade-out BGM 1500ms lalu pause & hentikan pemutaran audio menu
      this.audio.fadeOutAndStopMenuBgm(1500).then(() => {
        // Sembunyikan seluruh elemen UI Main Menu (display: none)
        this.mainMenuWrapper.classList.add('hidden-menu');

        // Mulai sekuens narasi Voice-Over & Subtitle
        this.introSequencer.start();
      });
    }

    /**
     * 4. Transisi Masuk ke Gameplay (FPP In-Game) setelah Intro selesai atau di-skip:
     * - Sembunyikan overlay subtitle intro & blackout curtain.
     * - Putar audio suasana koridor looping: assets/audio/ambience_game.mp3.
     * - Tampilkan <canvas id="gameCanvas"> dengan animasi "kelopak mata terbuka" (2 detik).
     * - Panggil initGameScene() & minta Pointer Lock API saat animasi kelopak mata selesai.
     */
    _enterGameplayFromIntro() {
      // Sembunyikan tirai blackout statis karena tirai kelopak mata (#eyelid-top/bottom) mengambil alih
      this.blackoutCurtain.classList.remove('active');
      this.blackoutCurtain.classList.add('hidden');

      // Tampilkan viewport game FPP dengan kelopak mata masih tertutup rapat
      this.gameViewportContainer.classList.remove('eyes-open');
      this.gameViewportContainer.classList.add('active');
      this.gameViewportContainer.setAttribute('aria-hidden', 'false');

      // Inisialisasi scene 3D (hook initGameScene)
      if (typeof window.initGameScene === 'function') {
        window.initGameScene(this.gameCanvas, this.settings.state);
      }

      // Putar audio suasana koridor looping: assets/audio/ambience_game.mp3
      this.audio.startGameAmbience();

      // Picu animasi transisi "kelopak mata terbuka" (membelah vertikal ke atas & bawah selama 2 detik)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.gameViewportContainer.classList.add('eyes-open');
        });
      });

      // Minta akses Pointer Lock API saat animasi kelopak mata selesai (2000ms)
      setTimeout(() => {
        this._requestBodyPointerLock();
      }, 2000);
    }

    _requestBodyPointerLock() {
      try {
        if (document.body && typeof document.body.requestPointerLock === 'function') {
          const lockPromise = document.body.requestPointerLock();
          if (lockPromise && typeof lockPromise.catch === 'function') {
            lockPromise.catch(() => {});
          }
        }
      } catch (_) {}
    }

    returnToMainMenu() {
      if (typeof window.Blindspot.stopGameScene === 'function') {
        window.Blindspot.stopGameScene();
      }
      this.gameViewportContainer.classList.remove('eyes-open', 'active');
      this.gameViewportContainer.setAttribute('aria-hidden', 'true');

      this.blackoutCurtain.classList.remove('active');
      this.blackoutCurtain.classList.add('hidden');

      this.mainMenuWrapper.classList.remove('hidden-menu', 'fading-out');
      this.btnStartGame.disabled = false;

      this.audio.resumeMenuBgm();
    }

    _startHudClock() {
      const clockEl = document.getElementById('hud-clock');
      if (!clockEl) return;
      let sec = 9;
      setInterval(() => {
        sec = (sec + 1) % 60;
        const pad = String(sec).padStart(2, '0');
        clockEl.textContent = `OCT 29 // 03:14:${pad} AM`;
      }, 1000);
    }
  }

  window.Blindspot.MainMenuUIController = MainMenuUIController;
})(window);
