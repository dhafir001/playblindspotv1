(function (window) {
  'use strict';
  window.Blindspot = window.Blindspot || {};

  /**
   * MODULE 1: STORAGE & CONFIGURATION MANAGER (localStorage Integrated)
   * File: js/modules/SettingsManager.js
   */

  const STORAGE_KEY = 'blindspot_horror_settings_v1';

  const DEFAULT_SETTINGS = Object.freeze({
    masterVolume: 75,        // 0 - 100
    sfxVolume: 80,           // 0 - 100
    mouseSensitivity: 1.0,   // 0.1 - 3.0
    invertY: false,          // boolean
    graphicsQuality: 'High', // 'Low' | 'Medium' | 'High'
    postProcessing: true     // boolean
  });

  class SettingsManager {
    constructor() {
      this.state = { ...DEFAULT_SETTINGS };
      this.load();
    }

    load() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.state = {
            masterVolume: this._clampNum(parsed.masterVolume, 0, 100, DEFAULT_SETTINGS.masterVolume),
            sfxVolume: this._clampNum(parsed.sfxVolume, 0, 100, DEFAULT_SETTINGS.sfxVolume),
            mouseSensitivity: this._clampNum(parsed.mouseSensitivity, 0.1, 3.0, DEFAULT_SETTINGS.mouseSensitivity),
            invertY: typeof parsed.invertY === 'boolean' ? parsed.invertY : DEFAULT_SETTINGS.invertY,
            graphicsQuality: ['Low', 'Medium', 'High'].includes(parsed.graphicsQuality)
              ? parsed.graphicsQuality
              : DEFAULT_SETTINGS.graphicsQuality,
            postProcessing: typeof parsed.postProcessing === 'boolean'
              ? parsed.postProcessing
              : DEFAULT_SETTINGS.postProcessing
          };
        }
      } catch (err) {
        this.state = { ...DEFAULT_SETTINGS };
      }
      return this.state;
    }

    save() {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        return true;
      } catch (err) {
        return false;
      }
    }

    reset() {
      this.state = { ...DEFAULT_SETTINGS };
      this.save();
      return this.state;
    }

    _clampNum(val, min, max, fallback) {
      const num = Number(val);
      if (Number.isNaN(num)) return fallback;
      return Math.min(max, Math.max(min, num));
    }
  }

  window.Blindspot.STORAGE_KEY = STORAGE_KEY;
  window.Blindspot.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  window.Blindspot.SettingsManager = SettingsManager;
})(window);
