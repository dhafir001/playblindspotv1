(function (window) {
  'use strict';
  window.Blindspot = window.Blindspot || {};

  /**
   * MODULE 2: HORROR AUDIO ENGINE (MP3 File Paths + Web Audio API Fallback)
   * File: js/modules/HorrorAudioEngine.js
   */

  class HorrorAudioEngine {
    constructor(settingsManager) {
      this.settings = settingsManager;
      this.AUDIO_PATHS = {
        bgm: 'assets/audio/bgm_menu.mp3',
        hover: 'assets/audio/ui_hover.mp3',
        click: 'assets/audio/ui_click.mp3'
      };

      this.bgmElement = document.getElementById('bgm-audio');
      this.unlocked = false;
      this.usingSynthBgm = false;
      this.fadeMultiplier = 0;
      this.fadeRafId = null;

      this.audioCtx = null;
      this.synthMasterGain = null;

      this._setupBgmElement();
    }

    _setupBgmElement() {
      if (!this.bgmElement) return;
      this.bgmElement.src = this.AUDIO_PATHS.bgm;
      this.bgmElement.loop = true;
      this.bgmElement.volume = 0;

      this.bgmElement.addEventListener('error', () => {
        this.usingSynthBgm = true;
        if (this.unlocked) {
          this._startSynthDrone();
        }
      });
    }

    unlockAndFadeIn() {
      if (this.unlocked) return;
      this.unlocked = true;

      this._initWebAudioContext();

      if (this.bgmElement && !this.usingSynthBgm) {
        const playPromise = this.bgmElement.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            this.usingSynthBgm = true;
            this._startSynthDrone();
          });
        }
      } else {
        this.usingSynthBgm = true;
        this._startSynthDrone();
      }

      this.fadeVolumeTo(1.0, 2400);
    }

    fadeVolumeTo(targetMultiplier, durationMs = 1500) {
      if (this.fadeRafId) {
        cancelAnimationFrame(this.fadeRafId);
      }
      const startMultiplier = this.fadeMultiplier;
      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = -(Math.cos(Math.PI * progress) - 1) / 2;
        this.fadeMultiplier = startMultiplier + (targetMultiplier - startMultiplier) * eased;
        this.applyRealTimeVolume();

        if (progress < 1) {
          this.fadeRafId = requestAnimationFrame(step);
        }
      };

      this.fadeRafId = requestAnimationFrame(step);
    }

    applyRealTimeVolume() {
      const masterNorm = (this.settings.state.masterVolume / 100) * this.fadeMultiplier;
      const clampedVol = Math.max(0, Math.min(1, masterNorm));

      if (this.bgmElement && !this.usingSynthBgm) {
        try {
          this.bgmElement.volume = clampedVol;
        } catch (_) {}
      }

      if (this.synthMasterGain && this.audioCtx) {
        try {
          this.synthMasterGain.gain.setTargetAtTime(
            clampedVol * 0.38,
            this.audioCtx.currentTime,
            0.06
          );
        } catch (_) {}
      }
    }

    playHoverSfx() {
      if (!this.unlocked) return;
      const effectiveVol = this._getEffectiveSfxVolume();
      if (effectiveVol <= 0.001) return;

      try {
        const hoverAudio = new Audio(this.AUDIO_PATHS.hover);
        hoverAudio.volume = effectiveVol;
        const p = hoverAudio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            this._playSynthHover(effectiveVol);
          });
        }
      } catch (_) {
        this._playSynthHover(effectiveVol);
      }
    }

    playClickSfx() {
      if (!this.unlocked) return;
      const effectiveVol = this._getEffectiveSfxVolume();
      if (effectiveVol <= 0.001) return;

      try {
        const clickAudio = new Audio(this.AUDIO_PATHS.click);
        clickAudio.volume = effectiveVol;
        const p = clickAudio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            this._playSynthClick(effectiveVol);
          });
        }
      } catch (_) {
        this._playSynthClick(effectiveVol);
      }
    }

    _getEffectiveSfxVolume() {
      const master = this.settings.state.masterVolume / 100;
      const sfx = this.settings.state.sfxVolume / 100;
      return Math.max(0, Math.min(1, master * sfx));
    }

    _initWebAudioContext() {
      if (this.audioCtx) {
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        return;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        this.audioCtx = new AudioCtx();
      } catch (_) {}
    }

    _startSynthDrone() {
      this._initWebAudioContext();
      if (!this.audioCtx || this.synthMasterGain) return;

      try {
        const ctx = this.audioCtx;
        this.synthMasterGain = ctx.createGain();
        this.synthMasterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        this.synthMasterGain.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(46.25, ctx.currentTime);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(65.41, ctx.currentTime);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.14, ctx.currentTime);
        lfoGain.gain.setValueAtTime(55, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(145, ctx.currentTime);
        filter.Q.setValueAtTime(4.5, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.synthMasterGain);

        osc1.start();
        osc2.start();
        lfo.start();

        this.applyRealTimeVolume();
      } catch (_) {}
    }

    _playSynthHover(vol) {
      if (!this.audioCtx) return;
      try {
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(190, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(88, ctx.currentTime + 0.065);

        gain.gain.setValueAtTime(vol * 0.16, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.075);
      } catch (_) {}
    }

    _playSynthClick(vol) {
      if (!this.audioCtx) return;
      try {
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(125, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(36, ctx.currentTime + 0.16);

        gain.gain.setValueAtTime(vol * 0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.17);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } catch (_) {}
    }
  }

  window.Blindspot.HorrorAudioEngine = HorrorAudioEngine;
})(window);
