(function (window) {
  'use strict';
  window.Blindspot = window.Blindspot || {};

  /**
   * MODULE 5: UI & MENU CONTROLLER
   * File: js/modules/MainMenuUIController.js
   */

  class MainMenuUIController {
    constructor(settings, audio, renderer, anomaly) {
      this.settings = settings;
      this.audio = audio;
      this.renderer = renderer;
      this.anomaly = anomaly;

      this.autoplayOverlay = document.getElementById('autoplay-overlay');
      this.settingsBackdrop = document.getElementById('settings-modal-backdrop');
      this.creditsBackdrop = document.getElementById('credits-modal-backdrop');
      this.transitionScreen = document.getElementById('game-transition-screen');
      this.transitionEpigraph = document.getElementById('transition-epigraph');
      this.loadingTelemetry = document.getElementById('loading-telemetry');
      this.returnMenuBtn = document.getElementById('return-menu-btn');

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
      const unlockHandler = () => {
        this.autoplayOverlay.classList.add('dismissed');
        this.audio.unlockAndFadeIn();
        this.audio.playClickSfx();
        this.anomaly.triggerTitleGlitch(320);
      };
      this.autoplayOverlay.addEventListener('click', unlockHandler, { once: true });
      this.autoplayOverlay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          unlockHandler();
        }
      }, { once: true });

      document.querySelectorAll('[data-ui-sfx="true"]').forEach((el) => {
        el.addEventListener('mouseenter', () => this.audio.playHoverSfx());
        el.addEventListener('click', () => this.audio.playClickSfx());
      });

      document.getElementById('btn-start-game').addEventListener('click', () => {
        this.triggerStartGameTransition();
      });

      document.getElementById('btn-open-settings').addEventListener('click', () => {
        this.openSettingsModal();
      });

      document.getElementById('btn-open-credits').addEventListener('click', () => {
        this.openCreditsModal();
      });

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
          this.autoplayOverlay.classList.remove('dismissed');
          this.audio.unlocked = false;
          this.quitFeedbackMsg.textContent = 'STATUS: TERKUNCI DI DALAM KORIDOR';
        }, 1050);
      });

      this.returnMenuBtn.addEventListener('click', () => {
        this.transitionEpigraph.classList.remove('show');
        this.loadingTelemetry.classList.remove('show');
        this.returnMenuBtn.classList.remove('show');
        this.transitionScreen.classList.remove('active');
        this.audio.fadeVolumeTo(1.0, 1600);
      });

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

    triggerStartGameTransition() {
      this.anomaly.triggerTitleGlitch(450);
      this.audio.fadeVolumeTo(0.08, 2200);
      this.transitionScreen.classList.add('active');

      setTimeout(() => {
        this.transitionEpigraph.classList.add('show');
      }, 900);

      setTimeout(() => {
        this.loadingTelemetry.classList.add('show');
      }, 2100);

      setTimeout(() => {
        this.returnMenuBtn.classList.add('show');
      }, 3200);
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
