function evaluateSignals(signals) {
  const reasons = [];

  if (signals.isOfficialByDomain) {
    return { level: 'official', label: '✅ 官方站点', reasons: ['域名命中官方白名单'] };
  }

  let score = 0;
  if (signals.icpLicense) { score += 30; reasons.push(`检测到 ICP 备案号：${signals.icpLicense}`); }
  if (signals.protocol === 'https:') { score += 10; reasons.push('使用 HTTPS 加密连接'); }
  else { score -= 20; reasons.push('⚠️ 未使用 HTTPS 加密'); }
  if (signals.isIP) { score -= 30; reasons.push('⚠️ 使用原始 IP 地址访问'); }
  if (signals.hasCrossDomainForm) { score -= 30; reasons.push('⚠️ 登录表单跨域提交'); }

  if (score >= 40) return { level: 'likely-official', label: '🟢 疑似官方站点', reasons };
  if (score >= 10) return { level: 'neutral', label: '🟡 无法确定', reasons };
  return { level: 'suspicious', label: '🔴 非官方或可疑', reasons };
}

document.addEventListener('DOMContentLoaded', async () => {
  const badge = document.getElementById('verdict-badge');
  const detailsDiv = document.getElementById('details');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !/^https?:/i.test(tab.url)) {
      badge.textContent = '⛔ 当前页面不支持分析';
      badge.className = 'neutral';
      detailsDiv.innerHTML = '<p>浏览器内部页面无法检测。</p>';
      return;
    }

    let signals;
    try {
      signals = await chrome.tabs.sendMessage(tab.id, { action: 'getPageSignals' });
    } catch (e) {
      // 扩展刚安装、页面未刷新时，content script 可能还没注入，手动补一次
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      signals = await chrome.tabs.sendMessage(tab.id, { action: 'getPageSignals' });
    }

    const wl = await chrome.runtime.sendMessage({
      action: 'checkOfficialDomain', hostname: signals.hostname
    });
    signals.isOfficialByDomain = !!(wl && wl.isOfficial);

    const verdict = evaluateSignals(signals);
    badge.textContent = verdict.label;
    badge.className = verdict.level;
    detailsDiv.innerHTML =
      `<p><strong>域名：</strong>${signals.hostname}</p>` +
      `<ul>${verdict.reasons.map(r => `<li>${r}</li>`).join('')}</ul>`;
  } catch (err) {
    badge.textContent = '分析失败';
    badge.className = 'suspicious';
    detailsDiv.innerHTML = `<p>${err.message}</p>`;
  }
});