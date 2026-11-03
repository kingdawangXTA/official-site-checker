(function () {
  if (window.__officialCheckerInjected) return;
  window.__officialCheckerInjected = true;

  function extractICPLicense() {
    const text = document.body ? document.body.innerText : '';
    const m = text.match(/[京沪粤浙苏鲁冀豫鄂湘川渝滇黔桂琼甘青宁新蒙藏黑吉辽闽赣晋皖]ICP[备证]\d{6,12}号?/i);
    return m ? m[0] : null;
  }

  function hasCrossDomainForm() {
    const origin = window.location.origin;
    for (const form of document.querySelectorAll('form')) {
      const action = form.getAttribute('action');
      if (action && /^https?:/i.test(action) && !action.startsWith(origin)
          && form.querySelector('input[type="password"]')) {
        return true;
      }
    }
    return false;
  }

  function buildSignals() {
    const hostname = window.location.hostname;
    return {
      hostname,
      icpLicense: extractICPLicense(),
      title: document.title || '',
      hasCrossDomainForm: hasCrossDomainForm(),
      protocol: window.location.protocol,
      isIP: /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
    };
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageSignals') {
      sendResponse(buildSignals());
      return true;
    }
  });
})();