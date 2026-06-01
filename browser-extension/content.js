/**
 * ApplyPilot AI — Content Script
 *
 * Runs on every page to extract job posting content when requested.
 * Uses smart selectors to find job descriptions on popular job sites.
 */

// Site-specific selectors for popular job boards
const SITE_SELECTORS = {
  'linkedin.com': {
    title: '.top-card-layout__title, .job-details-jobs-unified-top-card__job-title, h1',
    company: '.topcard__org-name-link, .job-details-jobs-unified-top-card__company-name, a[data-tracking-control-name="public_jobs_topcard-org-name"]',
    description: '.show-more-less-html__markup, .description__text, .job-details-jobs-unified-top-card__job-description',
    location: '.topcard__flavor--bullet, .job-details-jobs-unified-top-card__bullet',
  },
  'indeed.com': {
    title: '.jobsearch-JobInfoHeader-title, h1[data-testid="jobsearch-JobInfoHeader-title"]',
    company: '.jobsearch-InlineCompanyRating-companyHeader, [data-testid="inlineHeader-companyName"]',
    description: '#jobDescriptionText, .jobsearch-jobDescriptionText',
    location: '.jobsearch-JobInfoHeader-subtitle > div, [data-testid="inlineHeader-companyLocation"]',
  },
  'glassdoor.com': {
    title: '.css-1vg6q84, [data-test="jobTitle"]',
    company: '.css-87uc0g, [data-test="employerName"]',
    description: '.jobDescriptionContent, [data-test="jobDescriptionContent"]',
    location: '.css-56kyx5, [data-test="location"]',
  },
  'reed.co.uk': {
    title: 'h1',
    company: '[itemprop="hiringOrganization"]',
    description: '[itemprop="description"], .description',
    location: '[itemprop="jobLocation"]',
  },
  'totaljobs.com': {
    title: 'h1',
    company: '.company-link, [data-at="header-company"]',
    description: '.job-description, [data-at="job-description"]',
    location: '.travelTime-locationText, [data-at="header-location"]',
  },
  'civilservicejobs.service.gov.uk': {
    title: 'h1.search-results-job-box-title',
    company: '.vac_display_field_value',
    description: '.vac_display_field_value',
    location: '.vac_display_field_value',
  },
};

function getSelectorsForSite() {
  const hostname = window.location.hostname;
  for (const [domain, selectors] of Object.entries(SITE_SELECTORS)) {
    if (hostname.includes(domain)) return selectors;
  }
  return null;
}

function extractWithSelectors(selectors) {
  const getText = (selector) => {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : null;
  };

  return {
    title: getText(selectors.title),
    company: getText(selectors.company),
    location: getText(selectors.location),
    description: getText(selectors.description),
  };
}

function extractGeneric() {
  // Generic extraction: look for common job description patterns
  const title = document.querySelector('h1')?.textContent?.trim() ||
    document.title.split(' - ')[0].split(' | ')[0].trim();

  // Try to find the main content area
  const contentSelectors = [
    '[role="main"]',
    'main',
    'article',
    '.job-description',
    '.job-details',
    '#job-description',
    '.posting-requirements',
    '.description',
  ];

  let description = '';
  for (const sel of contentSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim().length > 200) {
      description = el.textContent.trim();
      break;
    }
  }

  // Fallback: get body text
  if (!description || description.length < 200) {
    description = document.body.innerText;
  }

  // Limit length
  if (description.length > 15000) {
    description = description.slice(0, 15000);
  }

  return {
    title,
    company: null,
    location: null,
    description,
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJob') {
    try {
      const siteSelectors = getSelectorsForSite();
      let result;

      if (siteSelectors) {
        result = extractWithSelectors(siteSelectors);
        // If site-specific extraction got a weak description, supplement with generic
        if (!result.description || result.description.length < 100) {
          const generic = extractGeneric();
          result.description = generic.description;
        }
      } else {
        result = extractGeneric();
      }

      sendResponse({
        success: true,
        data: {
          ...result,
          url: window.location.href,
          hostname: window.location.hostname,
        },
      });
    } catch (err) {
      sendResponse({
        success: false,
        error: err.message,
      });
    }
  }
  return true; // Keep message channel open for async response
});
