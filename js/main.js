/**
 * BLINDSPOT — Application Entry Point
 * File: js/main.js
 */
(function (window) {
  'use strict';

  window.addEventListener('DOMContentLoaded', () => {
    const {
      SettingsManager,
      HorrorAudioEngine,
      HorrorVisualRenderer,
      BlindspotAnomalyController,
      MainMenuUIController
    } = window.Blindspot;

    const settingsManager = new SettingsManager();
    const audioEngine = new HorrorAudioEngine(settingsManager);
    const visualRenderer = new HorrorVisualRenderer(settingsManager);
    const anomalyController = new BlindspotAnomalyController();

    new MainMenuUIController(
      settingsManager,
      audioEngine,
      visualRenderer,
      anomalyController
    );

    const loop = (timestamp) => {
      visualRenderer.render(timestamp);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
})(window);
