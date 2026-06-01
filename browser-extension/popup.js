/**
 * ApplyPilot AI — Popup Script
 *
 * Controls the extension popup: detects job content on the page,
 * shows a preview, and sends it to the ApplyPilot API.
 */

const statusEl = document.getElementById('status');
const jobPreview = document.getElementById('jobPreview');
const jobTitle = document.getElementById('jobTitle');
const jobCompany = document.getElementById('jobCompany');
const jobLocation = document.getElementById('jobLocation');
const jobSnippet = document.getElementById('jobSnippet');
const importBtn = document.getElementById('importBtn');
const openAppBtn = document.getElementById('openAppBtn');
const serverUrlInput = document.getElementById('serverUrl');

let extractedData = null;

// Load saved server URL
chrome.storage.local.get(['serverUrl'], (result) => {
  if (result.serverUrl) {
    serverUrlInput.value = result.serverUrl;
  }
});

// Save server URL on change
serverUrlInput.addEventListener('change', () => {
  chrome.storage.local.set({ serverUrl: serverUrlInput.value });
});

// On popup open: extract job from current tab
async function init() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      showStatus('error', 'Cannot access this tab');
      return;
    }

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: 'extractJob' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('error', 'Cannot read this page. Try refreshing.');
        return;
      }

      if (!response || !response.success) {
        showStatus('error', response?.error || 'Could not extract job data');
        return;
      }

      extractedData = response.data;

      // Check if it looks like a job posting
      const text = (extractedData.description || '').toLowerCase();
      const jobSignals = [
        'responsibilities', 'requirements', 'qualifications', 'experience',
        'salary', 'apply', 'role', 'position', 'we are looking',
        'job description', 'about the role', 'what you will do',
        'skills', 'benefits', 'perks', 'team', 'candidate',
      ];
      const matchCount = jobSignals.filter(s => text.includes(s)).length;

      if (matchCount >= 2) {
        showStatus('found', 'Job posting detected!');
        showJobPreview();
        importBtn.disabled = false;
      } else if (extractedData.description && extractedData.description.length > 300) {
        showStatus('found', 'Page content captured (may not be a job)');
        showJobPreview();
        importBtn.disabled = false;
      } else {
        showStatus('error', 'No job posting detected on this page');
      }
    });
  } catch (err) {
    showStatus('error', 'Extension error: ' + err.message);
  }
}

function showStatus(type, message) {
  const dotColors = { detecting: 'blue pulse', found: 'green', error: 'red', success: 'green' };
  statusEl.className = 'status ' + type;
  statusEl.innerHTML = `<div class="dot ${dotColors[type] || 'blue'}"></div><span>${message}</span>`;
}

function showJobPreview() {
  if (!extractedData) return;

  jobTitle.textContent = extractedData.title || 'Job Title Unknown';
  jobCompany.textContent = extractedData.company || extractedData.hostname || '-';
  jobLocation.textContent = extractedData.location || '';
  jobSnippet.textContent = (extractedData.description || '').slice(0, 200) + '...';
  jobPreview.classList.remove('hidden');
}

// Import button
importBtn.addEventListener('click', async () => {
  if (!extractedData) return;

  const serverUrl = serverUrlInput.value.replace(/\/+$/, '');
  importBtn.disabled = true;
  importBtn.innerHTML = '<div class="spinner"></div> Importing...';

  try {
    // Try URL import first (let the server fetch and parse)
    const response = await fetch(`${serverUrl}/api/jobs/import-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: extractedData.url }),
    });

    if (!response.ok) {
      // Fallback: send raw text to regular job import
      const fallbackRes = await fetch(`${serverUrl}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_description: extractedData.description,
          title: extractedData.title,
          company: extractedData.company,
          source_url: extractedData.url,
          source: extractedData.hostname,
        }),
      });

      if (!fallbackRes.ok) throw new Error('Import failed');
    }

    showStatus('success', '✓ Job imported to ApplyPilot!');
    importBtn.innerHTML = '<span>✓</span> Imported!';
    importBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

  } catch (err) {
    showStatus('error', 'Import failed. Check server URL.');
    importBtn.disabled = false;
    importBtn.innerHTML = '<span>⚡</span> Retry Import';
  }
});

// Open app button
openAppBtn.addEventListener('click', () => {
  const serverUrl = serverUrlInput.value.replace(/\/+$/, '');
  chrome.tabs.create({ url: `${serverUrl}/jobs` });
});

// Init on popup open
init();
