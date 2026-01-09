// 状態管理
const state = {
  recipients: [],
  editingIndex: null
};

// DOM要素
const elements = {
  template: document.getElementById('template'),
  inputName: document.getElementById('input-name'),
  inputMention: document.getElementById('input-mention'),
  btnAdd: document.getElementById('btn-add'),
  csvInput: document.getElementById('csv-input'),
  btnImport: document.getElementById('btn-import'),
  recipientList: document.getElementById('recipient-list'),
  recipientCount: document.getElementById('recipient-count'),
  btnClearAll: document.getElementById('btn-clear-all'),
  results: document.getElementById('results'),
  btnCopyAll: document.getElementById('btn-copy-all'),
  editModal: document.getElementById('edit-modal'),
  editName: document.getElementById('edit-name'),
  editMention: document.getElementById('edit-mention'),
  btnEditCancel: document.getElementById('btn-edit-cancel'),
  btnEditSave: document.getElementById('btn-edit-save'),
  toast: document.getElementById('toast'),
  tabs: document.querySelectorAll('.tab'),
  tabContents: document.querySelectorAll('.tab-content')
};

// 初期化
function init() {
  loadFromStorage();
  setupEventListeners();
  render();
}

// イベントリスナーの設定
function setupEventListeners() {
  // タブ切り替え
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // フォーム入力
  elements.btnAdd.addEventListener('click', addRecipientFromForm);
  elements.inputName.addEventListener('keypress', e => {
    if (e.key === 'Enter') elements.inputMention.focus();
  });
  elements.inputMention.addEventListener('keypress', e => {
    if (e.key === 'Enter') addRecipientFromForm();
  });

  // CSV入力
  elements.btnImport.addEventListener('click', importFromCSV);

  // 宛先リスト
  elements.btnClearAll.addEventListener('click', clearAllRecipients);

  // 全件コピー
  elements.btnCopyAll.addEventListener('click', copyAllMessages);

  // 編集モーダル
  elements.btnEditCancel.addEventListener('click', closeEditModal);
  elements.btnEditSave.addEventListener('click', saveEdit);
  elements.editModal.addEventListener('click', e => {
    if (e.target === elements.editModal) closeEditModal();
  });

  // テンプレート変更時に結果を更新
  elements.template.addEventListener('input', () => {
    saveToStorage();
    renderResults();
  });
}

// タブ切り替え
function switchTab(tabId) {
  elements.tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  elements.tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabId}`);
  });
}

// フォームから宛先を追加
function addRecipientFromForm() {
  const name = elements.inputName.value.trim();
  let mention = elements.inputMention.value.trim();

  if (!name || !mention) {
    showToast('名前とメンションを入力してください');
    return;
  }

  // @がなければ追加
  if (!mention.startsWith('@')) {
    mention = '@' + mention;
  }

  state.recipients.push({ name, mention });
  elements.inputName.value = '';
  elements.inputMention.value = '';
  elements.inputName.focus();

  saveToStorage();
  render();
}

// CSVからインポート
function importFromCSV() {
  const input = elements.csvInput.value.trim();
  if (!input) {
    showToast('データを入力してください');
    return;
  }

  const lines = input.split('\n').filter(line => line.trim());
  let added = 0;

  lines.forEach(line => {
    // カンマまたはタブで分割
    const parts = line.includes('\t') ? line.split('\t') : line.split(',');

    if (parts.length >= 2) {
      const name = parts[0].trim();
      let mention = parts[1].trim();

      if (name && mention) {
        if (!mention.startsWith('@')) {
          mention = '@' + mention;
        }
        state.recipients.push({ name, mention });
        added++;
      }
    }
  });

  if (added > 0) {
    elements.csvInput.value = '';
    saveToStorage();
    render();
    showToast(`${added}件追加しました`);
  } else {
    showToast('有効なデータがありませんでした');
  }
}

// 宛先を削除
function deleteRecipient(index) {
  state.recipients.splice(index, 1);
  saveToStorage();
  render();
}

// 編集モーダルを開く
function openEditModal(index) {
  state.editingIndex = index;
  const recipient = state.recipients[index];
  elements.editName.value = recipient.name;
  elements.editMention.value = recipient.mention;
  elements.editModal.classList.add('active');
  elements.editName.focus();
}

// 編集モーダルを閉じる
function closeEditModal() {
  state.editingIndex = null;
  elements.editModal.classList.remove('active');
}

// 編集を保存
function saveEdit() {
  const name = elements.editName.value.trim();
  let mention = elements.editMention.value.trim();

  if (!name || !mention) {
    showToast('名前とメンションを入力してください');
    return;
  }

  if (!mention.startsWith('@')) {
    mention = '@' + mention;
  }

  state.recipients[state.editingIndex] = { name, mention };
  closeEditModal();
  saveToStorage();
  render();
}

// 全件削除
function clearAllRecipients() {
  if (confirm('すべての宛先を削除しますか？')) {
    state.recipients = [];
    saveToStorage();
    render();
  }
}

// メッセージを生成
function generateMessage(template, recipient) {
  return template
    .replace(/\{\{メンション\}\}/g, recipient.mention)
    .replace(/\{\{名前\}\}/g, recipient.name);
}

// クリップボードにコピー
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('コピーしました！');
  } catch (err) {
    // フォールバック
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('コピーしました！');
  }
}

// 個別メッセージをコピー
function copyMessage(index) {
  const template = elements.template.value;
  const message = generateMessage(template, state.recipients[index]);
  copyToClipboard(message);
}

// 全件コピー
function copyAllMessages() {
  const template = elements.template.value;
  const messages = state.recipients.map(recipient =>
    generateMessage(template, recipient)
  );
  const combined = messages.join('\n\n---\n\n');
  copyToClipboard(combined);
}

// トースト表示
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 2000);
}

// ローカルストレージに保存
function saveToStorage() {
  localStorage.setItem('mreplace_template', elements.template.value);
  localStorage.setItem('mreplace_recipients', JSON.stringify(state.recipients));
}

// ローカルストレージから読み込み
function loadFromStorage() {
  const template = localStorage.getItem('mreplace_template');
  const recipients = localStorage.getItem('mreplace_recipients');

  if (template) {
    elements.template.value = template;
  }

  if (recipients) {
    try {
      state.recipients = JSON.parse(recipients);
    } catch (e) {
      state.recipients = [];
    }
  }
}

// 描画
function render() {
  renderRecipientList();
  renderResults();
}

// 宛先リストの描画
function renderRecipientList() {
  elements.recipientCount.textContent = state.recipients.length;
  elements.btnClearAll.style.display = state.recipients.length > 0 ? 'block' : 'none';

  if (state.recipients.length === 0) {
    elements.recipientList.innerHTML = '<li class="empty-state">宛先がありません</li>';
    return;
  }

  elements.recipientList.innerHTML = state.recipients.map((recipient, index) => `
    <li class="recipient-item">
      <div class="recipient-info">
        <span class="recipient-name">${escapeHtml(recipient.name)}</span>
        <span class="recipient-mention">${escapeHtml(recipient.mention)}</span>
      </div>
      <div class="recipient-actions">
        <button class="btn btn-secondary btn-small" onclick="openEditModal(${index})">編集</button>
        <button class="btn btn-danger btn-small" onclick="deleteRecipient(${index})">削除</button>
      </div>
    </li>
  `).join('');
}

// 結果の描画
function renderResults() {
  const template = elements.template.value;
  elements.btnCopyAll.style.display = state.recipients.length > 0 ? 'block' : 'none';

  if (state.recipients.length === 0 || !template.trim()) {
    elements.results.innerHTML = '<div class="empty-state">テンプレートと宛先を入力すると、ここにメッセージが生成されます</div>';
    return;
  }

  elements.results.innerHTML = state.recipients.map((recipient, index) => {
    const message = generateMessage(template, recipient);
    return `
      <div class="result-item">
        <div class="result-header">
          <span class="result-recipient">${escapeHtml(recipient.name)} (${escapeHtml(recipient.mention)})</span>
          <button class="btn btn-primary btn-small" onclick="copyMessage(${index})">コピー</button>
        </div>
        <div class="result-message">${escapeHtml(message)}</div>
      </div>
    `;
  }).join('');
}

// HTMLエスケープ
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 初期化実行
init();
