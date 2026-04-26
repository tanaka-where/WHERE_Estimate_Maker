const KEYS = ['editorUrl', 'enableDrive', 'driveFolder', 'enableSlack', 'slackWebhook'];

function load() {
  chrome.storage.local.get(KEYS, (cfg) => {
    document.getElementById('editorUrl').value     = cfg.editorUrl || '';
    document.getElementById('enableDrive').checked = !!cfg.enableDrive;
    document.getElementById('driveFolder').value   = cfg.driveFolder || '';
    document.getElementById('enableSlack').checked = !!cfg.enableSlack;
    document.getElementById('slackWebhook').value  = cfg.slackWebhook || '';
  });
}

function save() {
  const cfg = {
    editorUrl:    document.getElementById('editorUrl').value.trim(),
    enableDrive:  document.getElementById('enableDrive').checked,
    driveFolder:  document.getElementById('driveFolder').value.trim(),
    enableSlack:  document.getElementById('enableSlack').checked,
    slackWebhook: document.getElementById('slackWebhook').value.trim()
  };
  // 軽いバリデーション
  const status = document.getElementById('status');
  status.className = 'status';
  if (cfg.enableSlack && !cfg.slackWebhook.startsWith('https://hooks.slack.com/')) {
    status.className = 'status err';
    status.textContent = 'Slack Webhook URL が不正です';
    return;
  }
  if (cfg.editorUrl && !/^https?:\/\//.test(cfg.editorUrl)) {
    status.className = 'status err';
    status.textContent = 'エディタURLは http(s):// から始まる URL を指定してください';
    return;
  }
  chrome.storage.local.set(cfg, () => {
    status.textContent = '保存しました';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  load();
  document.getElementById('save').addEventListener('click', save);
});
