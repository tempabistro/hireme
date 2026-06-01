/**
 * ApplyPilot AI — Background Service Worker
 *
 * Handles extension lifecycle events and badge updates.
 */

// Set default server URL on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['serverUrl'], (result) => {
    if (!result.serverUrl) {
      chrome.storage.local.set({ serverUrl: 'http://localhost:3000' });
    }
  });
});
