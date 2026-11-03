// background.js

let officialDomains = new Set();

// 初始化：加载本地域名库
async function loadDomains() {
  const stored = await chrome.storage.local.get('officialDomains');
  if (stored.officialDomains && stored.officialDomains.length > 0) {
    officialDomains = new Set(stored.officialDomains);
    return;
  }

  // 首次运行，从data文件加载（简化示例：直接内置部分核心域名）
  const defaultDomains = [
    // 政府/教育/组织
    'gov.cn', 'edu.cn', 'org.cn',
    // 知名科技公司
    'apple.com', 'microsoft.com', 'google.com', 'github.com',
    'tencent.com', 'alibaba.com', 'baidu.com', 'jd.com',
    // 其他常见官方站点
    'weibo.com', 'zhihu.com', 'bilibili.com'
  ];

  officialDomains = new Set(defaultDomains);
  await chrome.storage.local.set({ officialDomains: defaultDomains });
}

// 检查域名是否在白名单中（支持子域名匹配）
function isOfficialDomain(hostname) {
  // 精确匹配
  if (officialDomains.has(hostname)) return true;
  // 检查是否为白名单域名的子域名（如 mail.google.com）
  for (const domain of officialDomains) {
    if (hostname.endsWith('.' + domain)) return true;
  }
  return false;
}

// 监听来自内容脚本或弹出页的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkOfficialDomain') {
    const hostname = request.hostname;
    const official = isOfficialDomain(hostname);
    sendResponse({ isOfficial: official });
    return true; // 保持异步响应
  }

  if (request.action === 'updateDomains') {
    // 预留：支持动态更新域名库（例如从远程URL拉取）
    officialDomains = new Set(request.domains);
    chrome.storage.local.set({ officialDomains: request.domains });
    sendResponse({ success: true });
    return true;
  }
});

// 扩展启动时加载
loadDomains();