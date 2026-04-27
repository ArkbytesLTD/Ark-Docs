/* ═══════════════════════════════════════════════════════════
   ARK DOCS — app.js
   Pure vanilla JS. No frameworks. No build step.
   Faith. Integrity. Service. Stewardship. Humility.
═══════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────
   STATE
────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'arkdocs_v1';
const VERSES = [
  { text: '"Whatever you do, work at it with all your heart, as working for the Lord."', ref: 'Colossians 3:23' },
  { text: '"Commit your work to the Lord, and your plans will be established."', ref: 'Proverbs 16:3' },
  { text: '"The integrity of the upright guides them."', ref: 'Proverbs 11:3' },
  { text: '"Trust in the Lord with all your heart, and do not lean on your own understanding."', ref: 'Proverbs 3:5' },
  { text: '"Do nothing out of selfish ambition or vain conceit. In humility, value others above yourselves."', ref: 'Philippians 2:3' },
  { text: '"Each of you should use whatever gift you have received to serve others."', ref: '1 Peter 4:10' },
];

let state = {
  docs: [],
  activeId: null,
  sidebarOpen: true,
  zoom: 100,
  wcOpen: false,
  findOpen: false,
  spellcheck: true,
  darkMode: false,
  accent: '#B5832A',
};

let saveTimer = null;
let openMenu = null;

/* ──────────────────────────────────────────────────────────
   PERSISTENCE
────────────────────────────────────────────────────────── */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.docs = saved.docs || [];
      state.activeId = saved.activeId || null;
      state.darkMode = saved.darkMode || false;
      state.accent = saved.accent || '#B5832A';
    }
  } catch (e) { /* fresh start */ }

  if (!state.docs.length) {
    state.docs = [
      {
        id: 1,
        title: 'Welcome to Ark Docs',
        content: `<h1>Welcome to Ark Docs</h1>
<p>This is your space to write with purpose. Whether drafting a proposal, a letter, or something that serves others — every word matters here.</p>
<blockquote>Faith shapes everything we do — how we treat our clients, how we write our code, and the purpose behind what we build.</blockquote>
<p>Use the toolbar to format your content. Select any text to reveal the quick-format bubble. Press <strong>Ctrl+S</strong> to save, <strong>Ctrl+H</strong> for Find &amp; Replace.</p>
<h2>Getting Started</h2>
<ul>
  <li>Click <strong>+ New document</strong> in the sidebar to create a new file</li>
  <li>Rename a document by editing the title in the top bar</li>
  <li>Download your work as HTML or plain text from the File menu</li>
  <li>Access keyboard shortcuts from Help → Keyboard Shortcuts</li>
</ul>
<h2>Our Values</h2>
<p>Every document created here is a reflection of who we are. We write with <strong>integrity</strong>, serve with <strong>humility</strong>, and build with <strong>purpose</strong>.</p>`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Mission Statement',
        content: `<h1>Our Mission</h1>
<p>To serve our clients with faith, integrity, and purpose — building software that reflects God's calling on our lives.</p>
<blockquote>Whatever you do, work at it with all your heart, as working for the Lord, not for human masters. — Colossians 3:23</blockquote>
<h2>What We Stand For</h2>
<ul>
  <li>✝ <strong>Faith</strong> — shapes everything we do</li>
  <li>🤝 <strong>Integrity</strong> — honest work, every time</li>
  <li>💡 <strong>Service</strong> — building with others in mind</li>
  <li>🕊 <strong>Stewardship</strong> — handling resources with care</li>
  <li>🤍 <strong>Humility</strong> — staying teachable, giving credit freely</li>
</ul>`,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 3,
        title: 'Q2 Project Plan',
        content: `<h1>Q2 Project Plan</h1>
<p>Milestones and deliverables managed with stewardship and care.</p>
<h2>Milestones</h2>
<ol>
  <li>Finalize design system — Week 1–2</li>
  <li>Engineering sprint kickoff — Week 3</li>
  <li>Internal beta release — Week 6</li>
  <li>Client onboarding — Week 8</li>
</ol>
<h2>Team</h2>
<table>
  <thead><tr><th>Name</th><th>Role</th><th>Focus</th></tr></thead>
  <tbody>
    <tr><td>Jordan</td><td>Lead Developer</td><td>Architecture</td></tr>
    <tr><td>Sarah</td><td>Designer</td><td>UI System</td></tr>
    <tr><td>Marcus</td><td>Project Manager</td><td>Client Liaison</td></tr>
  </tbody>
</table>`,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];
    state.activeId = 1;
  }

  if (!state.activeId || !state.docs.find(d => d.id === state.activeId)) {
    state.activeId = state.docs[0]?.id || null;
  }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      docs: state.docs,
      activeId: state.activeId,
      darkMode: state.darkMode,
      accent: state.accent,
    }));
  } catch (e) { /* storage full or unavailable */ }
}

/* ──────────────────────────────────────────────────────────
   DOM HELPERS
────────────────────────────────────────────────────────── */

const $ = id => document.getElementById(id);
const editor = () => $('editor');

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return diff + ' days ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function setSaveStatus(status) {
  const el = $('save-status');
  if (status === 'saved') {
    el.className = 'status-saved';
    el.innerHTML = '<span class="status-dot"></span> All changes saved';
  } else if (status === 'saving') {
    el.className = 'status-saving';
    el.innerHTML = '<span class="status-dot" style="background:#888"></span> Saving…';
  } else {
    el.className = 'status-unsaved';
    el.innerHTML = '<span class="status-dot" style="background:rgba(255,255,255,0.3)"></span> Unsaved changes';
  }
}

/* ──────────────────────────────────────────────────────────
   DOCUMENT MANAGEMENT
────────────────────────────────────────────────────────── */

function getActiveDoc() {
  return state.docs.find(d => d.id === state.activeId);
}

function renderSidebar() {
  const list = $('doc-list');
  list.innerHTML = '';
  state.docs.forEach(doc => {
    const item = document.createElement('div');
    item.className = 'doc-item' + (doc.id === state.activeId ? ' active' : '');
    item.innerHTML = `
      <span class="doc-icon">📄</span>
      <div class="doc-info">
        <div class="doc-name">${escHtml(doc.title || 'Untitled')}</div>
        <div class="doc-meta">${formatDate(doc.updatedAt)}</div>
      </div>
      <button class="doc-delete" onclick="event.stopPropagation(); deleteDocById(${doc.id})" title="Delete">✕</button>
    `;
    item.addEventListener('click', () => switchDoc(doc.id));
    list.appendChild(item);
  });
}

function switchDoc(id) {
  // Save current content
  const current = getActiveDoc();
  if (current) {
    current.content = editor().innerHTML;
    current.updatedAt = new Date().toISOString();
  }

  state.activeId = id;
  const doc = getActiveDoc();
  if (!doc) return;

  editor().innerHTML = doc.content || '';
  $('doc-title').value = doc.title || 'Untitled';
  $('page-header-title').textContent = doc.title || 'Untitled';
  updateWordCount();
  renderSidebar();
  persistState();
}

function newDoc() {
  // Save current
  const current = getActiveDoc();
  if (current) {
    current.content = editor().innerHTML;
    current.updatedAt = new Date().toISOString();
  }

  const id = Date.now();
  const doc = {
    id,
    title: 'Untitled Document',
    content: '<p></p>',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.docs.unshift(doc);
  state.activeId = id;

  editor().innerHTML = '<p></p>';
  $('doc-title').value = 'Untitled Document';
  $('page-header-title').textContent = 'Untitled Document';
  updateWordCount();
  renderSidebar();
  persistState();

  // Focus editor
  editor().focus();
  const range = document.createRange();
  range.selectNodeContents(editor());
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function duplicateDoc() {
  const src = getActiveDoc();
  if (!src) return;
  const id = Date.now();
  const doc = {
    id,
    title: src.title + ' (copy)',
    content: src.content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const idx = state.docs.findIndex(d => d.id === state.activeId);
  state.docs.splice(idx + 1, 0, doc);
  switchDoc(id);
}

function deleteDoc() {
  deleteDocById(state.activeId);
}

function deleteDocById(id) {
  if (state.docs.length === 1) {
    alert('Cannot delete the only document.');
    return;
  }
  if (!confirm('Delete this document? This cannot be undone.')) return;
  const idx = state.docs.findIndex(d => d.id === id);
  state.docs.splice(idx, 1);
  if (state.activeId === id) {
    state.activeId = state.docs[Math.max(0, idx - 1)]?.id || state.docs[0]?.id;
    const doc = getActiveDoc();
    editor().innerHTML = doc?.content || '';
    $('doc-title').value = doc?.title || 'Untitled';
    $('page-header-title').textContent = doc?.title || 'Untitled';
    updateWordCount();
  }
  renderSidebar();
  persistState();
}

function saveDoc() {
  const doc = getActiveDoc();
  if (doc) {
    doc.content = editor().innerHTML;
    doc.title = $('doc-title').value || 'Untitled';
    doc.updatedAt = new Date().toISOString();
  }
  setSaveStatus('saving');
  setTimeout(() => {
    persistState();
    setSaveStatus('saved');
    renderSidebar();
  }, 400);
}

/* ──────────────────────────────────────────────────────────
   EDITOR CORE
────────────────────────────────────────────────────────── */

function fmt(command) {
  editor().focus();
  document.execCommand(command, false, null);
  updateToolbarState();
}

function applyBlock(tag) {
  editor().focus();
  document.execCommand('formatBlock', false, tag);
  updateToolbarState();
  // Sync style select
  const sel = $('sel-style');
  if (sel && ['p','h1','h2','h3','h4','pre'].includes(tag)) {
    sel.value = tag;
  }
}

function applyFontFamily(font) {
  editor().focus();
  document.execCommand('fontName', false, font);
}

function applyFontSize(size) {
  editor().focus();
  document.execCommand('fontSize', false, '7');
  const nodes = editor().querySelectorAll('font[size="7"]');
  nodes.forEach(n => {
    n.removeAttribute('size');
    n.style.fontSize = size + 'px';
  });
}

function applyColor(hex) {
  editor().focus();
  document.execCommand('foreColor', false, hex);
  $('color-bar-fg').style.background = hex;
}

function applyHighlight(hex) {
  editor().focus();
  document.execCommand('backColor', false, hex);
  $('color-bar-hl').style.background = hex;
}

function clearFormatting() {
  editor().focus();
  document.execCommand('removeFormat', false, null);
  document.execCommand('formatBlock', false, 'p');
}

function insertBlockquote() {
  editor().focus();
  document.execCommand('formatBlock', false, 'blockquote');
}

function insertCodeBlock() {
  editor().focus();
  document.execCommand('formatBlock', false, 'pre');
}

function insertLink() {
  const sel = window.getSelection();
  const url = prompt('Enter URL:', 'https://');
  if (!url) return;
  editor().focus();
  if (sel && sel.toString()) {
    document.execCommand('createLink', false, url);
  } else {
    document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${url}</a>`);
  }
}

function insertImage() {
  const url = prompt('Image URL:', 'https://');
  if (!url) return;
  editor().focus();
  document.execCommand('insertHTML', false,
    `<img src="${url}" alt="Image" style="max-width:100%;border-radius:5px;margin:8px 0;display:block;"/>`
  );
}

function insertHR() {
  editor().focus();
  document.execCommand('insertHTML', false, '<hr/><p></p>');
}

function insertPageBreak() {
  editor().focus();
  document.execCommand('insertHTML', false,
    '<div style="page-break-after:always;border-top:2px dashed rgba(181,131,42,0.3);margin:32px 0;text-align:center;font-size:11px;color:rgba(107,100,86,0.4);padding-top:8px;">— Page break —</div><p></p>'
  );
}

/* ──────────────────────────────────────────────────────────
   TABLE PICKER
────────────────────────────────────────────────────────── */

function insertTable() {
  closeAllMenus();
  openTablePicker();
}

function openTablePicker() {
  $('table-overlay').classList.remove('hidden');
  updateTablePreview();
  $('tbl-rows').addEventListener('input', updateTablePreview);
  $('tbl-cols').addEventListener('input', updateTablePreview);
}

function closeTablePicker() {
  $('table-overlay').classList.add('hidden');
}

function updateTablePreview() {
  const rows = Math.min(20, Math.max(1, parseInt($('tbl-rows').value) || 3));
  const cols = Math.min(10, Math.max(1, parseInt($('tbl-cols').value) || 3));
  let html = '<table><thead><tr>';
  for (let c = 0; c < cols; c++) html += `<th>H${c + 1}</th>`;
  html += '</tr></thead><tbody>';
  for (let r = 0; r < Math.min(rows - 1, 4); r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) html += '<td>·</td>';
    html += '</tr>';
  }
  if (rows - 1 > 4) html += `<tr><td colspan="${cols}" style="text-align:center;color:#9A9088;font-style:italic;">… ${rows - 1 - 4} more rows</td></tr>`;
  html += '</tbody></table>';
  $('table-preview').innerHTML = html;
}

function confirmInsertTable() {
  const rows = Math.min(20, Math.max(1, parseInt($('tbl-rows').value) || 3));
  const cols = Math.min(10, Math.max(1, parseInt($('tbl-cols').value) || 3));
  closeTablePicker();
  editor().focus();

  let html = '<table><thead><tr>';
  for (let c = 0; c < cols; c++) html += `<th>Header ${c + 1}</th>`;
  html += '</tr></thead><tbody>';
  for (let r = 0; r < rows - 1; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) html += `<td>Row ${r + 1}</td>`;
    html += '</tr>';
  }
  html += '</tbody></table><p></p>';
  document.execCommand('insertHTML', false, html);
}

/* ──────────────────────────────────────────────────────────
   WORD COUNT
────────────────────────────────────────────────────────── */

function getStats() {
  const el = editor();
  const text = el.innerText.trim();
  const words     = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const chars     = el.innerText.length;
  const charsNoSp = el.innerText.replace(/\s/g, '').length;
  const paragraphs = el.querySelectorAll('p, h1, h2, h3, h4, blockquote, li').length;
  const readTime  = Math.max(1, Math.round(words / 200));
  return { words, chars, charsNoSp, paragraphs, readTime };
}

function updateWordCount() {
  const s = getStats();
  $('status-words').textContent = s.words.toLocaleString() + ' words';
  $('status-chars').textContent = s.chars.toLocaleString() + ' characters';
  if (state.wcOpen) {
    $('wc-words').textContent  = s.words.toLocaleString();
    $('wc-chars').textContent  = s.chars.toLocaleString();
    $('wc-nospace').textContent = s.charsNoSp.toLocaleString();
    $('wc-para').textContent   = s.paragraphs;
    $('wc-read').textContent   = s.readTime + ' min';
  }
}

function toggleWordCount() {
  closeAllMenus();
  state.wcOpen = !state.wcOpen;
  const panel = $('wc-panel');
  if (state.wcOpen) {
    panel.classList.remove('hidden');
    updateWordCount();
    $('btn-wc').classList.add('active');
  } else {
    panel.classList.add('hidden');
    $('btn-wc').classList.remove('active');
  }
}

/* ──────────────────────────────────────────────────────────
   FIND & REPLACE
────────────────────────────────────────────────────────── */

function openFind() {
  closeAllMenus();
  $('find-panel').classList.remove('hidden');
  state.findOpen = true;
  $('find-input').focus();
}

function closeFind() {
  $('find-panel').classList.add('hidden');
  state.findOpen = false;
  clearHighlights();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightFind() {
  // Just show count for now (full DOM-highlight is complex without breaking contenteditable)
  const term = $('find-input').value;
  if (!term) { $('find-status').textContent = ''; return; }
  const text = editor().innerText;
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const matches = (text.match(re) || []).length;
  $('find-status').textContent = matches ? `${matches} match${matches !== 1 ? 'es' : ''} found` : 'No matches';
}

function clearHighlights() {
  $('find-status').textContent = '';
}

function findNext() {
  const term = $('find-input').value;
  if (!term) return;
  const found = window.find(term, false, false, true, false, true, false);
  if (!found) $('find-status').textContent = 'No more matches';
}

function replaceOne() {
  const find    = $('find-input').value;
  const replace = $('replace-input').value;
  if (!find) return;
  const sel = window.getSelection();
  if (sel && sel.toString().toLowerCase() === find.toLowerCase()) {
    document.execCommand('insertText', false, replace);
  }
  findNext();
}

function replaceAll() {
  const find    = $('find-input').value;
  const replace = $('replace-input').value;
  if (!find) return;
  editor().focus();
  const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const html = editor().innerHTML;
  const count = (html.match(re) || []).length;
  editor().innerHTML = html.replace(re, replace);
  $('find-status').textContent = count ? `Replaced ${count} occurrence${count !== 1 ? 's' : ''}` : 'No matches';
  onEditorInput();
}

/* ──────────────────────────────────────────────────────────
   TOOLBAR STATE
────────────────────────────────────────────────────────── */

function updateToolbarState() {
  const cmds = ['bold', 'italic', 'underline', 'strikeThrough'];
  cmds.forEach(cmd => {
    const btn = $('btn-' + cmd);
    if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
  });
}

/* ──────────────────────────────────────────────────────────
   FORMAT BUBBLE
────────────────────────────────────────────────────────── */

function updateBubble(e) {
  const bubble = $('format-bubble');
  setTimeout(() => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0 && editor().contains(sel.anchorNode)) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const bw = 280;
      let left = rect.left + rect.width / 2 - bw / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
      bubble.style.left = left + 'px';
      bubble.style.top  = (rect.top - 50 + window.scrollY) + 'px';
      bubble.classList.add('visible');
    } else if (!bubble.contains(e.target)) {
      bubble.classList.remove('visible');
    }
  }, 10);
}

/* ──────────────────────────────────────────────────────────
   DROPDOWN MENUS
────────────────────────────────────────────────────────── */

function closeAllMenus() {
  document.querySelectorAll('.dropdown.visible').forEach(d => d.classList.remove('visible'));
  document.querySelectorAll('.menu-item.open').forEach(m => m.classList.remove('open'));
  openMenu = null;
}

function setupMenus() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = item.dataset.menu;
      const dd = $('dd-' + menu);
      if (!dd) return;

      if (dd.classList.contains('visible')) {
        closeAllMenus();
        return;
      }
      closeAllMenus();

      // Position dropdown under menu item
      const rect = item.getBoundingClientRect();
      dd.style.left = rect.left + 'px';
      dd.classList.add('visible');
      item.classList.add('open');
      openMenu = menu;
    });
  });
}

/* ──────────────────────────────────────────────────────────
   SHORTCUTS MODAL
────────────────────────────────────────────────────────── */

function showShortcuts() {
  closeAllMenus();
  $('shortcuts-overlay').classList.remove('hidden');
}

function closeShortcuts() {
  $('shortcuts-overlay').classList.add('hidden');
}

/* ──────────────────────────────────────────────────────────
   ZOOM
────────────────────────────────────────────────────────── */

function setZoom(pct) {
  closeAllMenus();
  state.zoom = pct;
  $('page-shadow').style.transform = `scale(${pct / 100})`;
  $('page-shadow').style.transformOrigin = 'top center';
  $('status-zoom').textContent = pct + '%';
}

/* ──────────────────────────────────────────────────────────
   SPELLCHECK
────────────────────────────────────────────────────────── */

function toggleSpellcheck() {
  closeAllMenus();
  state.spellcheck = !state.spellcheck;
  editor().spellcheck = state.spellcheck;
}

/* ──────────────────────────────────────────────────────────
   SIDEBAR
────────────────────────────────────────────────────────── */

function toggleSidebar() {
  closeAllMenus();
  state.sidebarOpen = !state.sidebarOpen;
  const sb = $('sidebar');
  if (state.sidebarOpen) {
    sb.classList.remove('collapsed');
  } else {
    sb.classList.add('collapsed');
  }
}

/* ──────────────────────────────────────────────────────────
   SHARE / DOWNLOAD
────────────────────────────────────────────────────────── */

function shareDoc() {
  closeAllMenus();
  alert('Sharing is coming soon — built with integrity, shipped when it\'s ready.\n\n"Commit your work to the Lord, and your plans will be established." — Proverbs 16:3');
}

function downloadHTML() {
  closeAllMenus();
  const doc = getActiveDoc();
  if (!doc) return;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${escHtml(doc.title)}</title>
<style>
  body { font-family: 'Georgia', serif; max-width: 720px; margin: 60px auto; padding: 0 24px; line-height: 1.8; color: #1A1814; }
  h1 { color: #1B2B45; } h2 { color: #2D4066; }
  blockquote { border-left: 3px solid #B5832A; padding-left: 16px; margin: 16px 0; color: #6B6456; font-style: italic; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  td, th { border: 1px solid #ccc; padding: 8px 12px; }
  th { background: #F0EAD8; }
  img { max-width: 100%; }
</style>
</head>
<body>
${doc.content}
<hr style="margin-top:60px;border:none;border-top:1px solid #ccc"/>
<p style="text-align:center;font-size:12px;color:#9A9088;font-style:italic;">Created with Ark Docs — Built with integrity. Col. 3:23</p>
</body>
</html>`;
  download(doc.title + '.html', html, 'text/html');
}

function downloadTXT() {
  closeAllMenus();
  const doc = getActiveDoc();
  if (!doc) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = doc.content;
  download(doc.title + '.txt', tmp.innerText, 'text/plain');
}

function download(filename, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ──────────────────────────────────────────────────────────
   EDITOR INPUT HANDLER
────────────────────────────────────────────────────────── */

function onEditorInput() {
  updateWordCount();
  setSaveStatus('unsaved');

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const doc = getActiveDoc();
    if (doc) {
      doc.content = editor().innerHTML;
      doc.updatedAt = new Date().toISOString();
    }
    setSaveStatus('saving');
    setTimeout(() => {
      persistState();
      setSaveStatus('saved');
    }, 350);
  }, 1800);
}

/* ──────────────────────────────────────────────────────────
   KEYBOARD SHORTCUTS
────────────────────────────────────────────────────────── */

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    if (e.key === 'Escape') {
      closeAllMenus();
      closeFind();
      closeShortcuts();
      closeTablePicker();
      closeTemplates();
      return;
    }

    if (!ctrl) return;

    switch (e.key.toLowerCase()) {
      case 's': e.preventDefault(); saveDoc(); break;
      case 'n': e.preventDefault(); newDoc(); break;
      case 'p': e.preventDefault(); window.print(); break;
      case 'h': e.preventDefault(); openFind(); break;
      case 'k': e.preventDefault(); insertLink(); break;
      case '\\': e.preventDefault(); clearFormatting(); break;
      case '/': e.preventDefault(); showShortcuts(); break;
    }

    // Ctrl+Alt+digit for heading styles
    if (e.altKey) {
      const headings = { '1':'h1', '2':'h2', '3':'h3', '4':'h4', '0':'p' };
      if (headings[e.key]) { e.preventDefault(); applyBlock(headings[e.key]); }
    }
  });

  // Tab in editor = indent
  editor().addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  });
}

/* ──────────────────────────────────────────────────────────
   ACCENT COLOR
────────────────────────────────────────────────────────── */

const ACCENT_PRESETS = [
  { hex: '#B5832A', label: 'Gold'     },
  { hex: '#2A6BB5', label: 'Blue'     },
  { hex: '#2A8C4A', label: 'Green'    },
  { hex: '#B5432A', label: 'Red'      },
  { hex: '#7B3DB5', label: 'Purple'   },
  { hex: '#B5672A', label: 'Orange'   },
  { hex: '#2A9EB5', label: 'Teal'     },
  { hex: '#B52A72', label: 'Rose'     },
];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return { r, g, b };
}

// Derive a lighter and mid shade from a base hex
function deriveAccentShades(hex) {
  const { r, g, b } = hexToRgb(hex);
  // mid: blend toward white by ~25%
  const rm = Math.round(r + (255 - r) * 0.25);
  const gm = Math.round(g + (255 - g) * 0.25);
  const bm = Math.round(b + (255 - b) * 0.25);
  // light: blend toward white by ~82%
  const rl = Math.round(r + (255 - r) * 0.82);
  const gl = Math.round(g + (255 - g) * 0.82);
  const bl = Math.round(b + (255 - b) * 0.82);
  // faint: blend toward white by ~93%
  const rf = Math.round(r + (255 - r) * 0.93);
  const gf = Math.round(g + (255 - g) * 0.93);
  const bf = Math.round(b + (255 - b) * 0.93);
  return {
    mid:   `rgb(${rm},${gm},${bm})`,
    light: `rgb(${rl},${gl},${bl})`,
    faint: `rgb(${rf},${gf},${bf})`,
  };
}

function applyAccent(hex) {
  state.accent = hex;
  const { r, g, b } = hexToRgb(hex);
  const { mid, light, faint } = deriveAccentShades(hex);
  const root = document.documentElement;
  root.style.setProperty('--accent',     hex);
  root.style.setProperty('--accent-mid', mid);
  root.style.setProperty('--accent-light', light);
  root.style.setProperty('--accent-faint', faint);
  root.style.setProperty('--accent-r', r);
  root.style.setProperty('--accent-g', g);
  root.style.setProperty('--accent-b', b);
  updateAccentPicker();
  persistState();
}

function buildAccentPicker() {
  const wrap = $('accent-picker');
  wrap.innerHTML = '';
  ACCENT_PRESETS.forEach(({ hex, label }) => {
    const sw = document.createElement('div');
    sw.className = 'accent-swatch' + (state.accent === hex ? ' selected' : '');
    sw.style.background = hex;
    sw.title = label;
    sw.addEventListener('click', () => applyAccent(hex));
    wrap.appendChild(sw);
  });
  // Custom color input
  const lbl = document.createElement('label');
  lbl.className = 'accent-custom-label';
  lbl.title = 'Custom color';
  lbl.innerHTML = `+<input type="color" id="accent-custom-input" value="${state.accent}" />`;
  lbl.querySelector('input').addEventListener('input', e => applyAccent(e.target.value));
  wrap.appendChild(lbl);
}

function updateAccentPicker() {
  document.querySelectorAll('.accent-swatch').forEach(sw => {
    sw.classList.toggle('selected', sw.style.background === hexToRgbStr(state.accent) || sw.style.backgroundColor === state.accent || rgbToHex(sw.style.backgroundColor) === state.accent.toLowerCase());
  });
  const ci = $('accent-custom-input');
  if (ci) ci.value = state.accent;
}

function hexToRgbStr(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbToHex(rgb) {
  const m = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!m) return rgb;
  return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
}

/* ──────────────────────────────────────────────────────────
   DARK MODE
────────────────────────────────────────────────────────── */

function applyDarkMode() {
  if (state.darkMode) {
    document.body.classList.add('dark');
    $('icon-moon').style.display = 'none';
    $('icon-sun').style.display  = 'block';
  } else {
    document.body.classList.remove('dark');
    $('icon-moon').style.display = 'block';
    $('icon-sun').style.display  = 'none';
  }
}

function toggleDarkMode() {
  closeAllMenus();
  state.darkMode = !state.darkMode;
  applyDarkMode();
  persistState();
}

/* ──────────────────────────────────────────────────────────
   TEMPLATES
────────────────────────────────────────────────────────── */

const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Document',
    category: 'Basic',
    preview: '<p style="color:#9A9088;font-style:italic;">Begin writing…</p>',
    content: '<p></p>',
  },
  {
    id: 'business-letter',
    name: 'Business Letter',
    category: 'Business',
    preview: `<p><strong>Ark Software Co.</strong><br/>123 Purpose Lane<br/>Nashville, TN 37201</p><hr/><p>Dear [Recipient],</p><p>I am writing to…</p>`,
    content: `<p><strong>Ark Software Co.</strong><br/>123 Purpose Lane, Nashville, TN 37201<br/>contact@arksoftware.com</p>
<hr/>
<p>[Date]</p>
<p>Dear [Recipient Name],</p>
<p>I am writing to [state the purpose of your letter]. [Body paragraph — explain the situation, request, or information clearly and honestly.]</p>
<p>We believe in doing honest work and communicating with integrity. Please do not hesitate to reach out with any questions or concerns.</p>
<p>Thank you for your time and consideration.</p>
<p>Sincerely,<br/><br/>[Your Name]<br/>[Your Title]<br/>Ark Software Co.</p>`,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    category: 'Business',
    preview: `<h1>Meeting Notes</h1><p><strong>Date:</strong> [Date] &nbsp; <strong>Attendees:</strong> [Names]</p><h2>Agenda</h2><ul><li>Item one</li><li>Item two</li></ul><h2>Action Items</h2>`,
    content: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> [Date] &nbsp;&nbsp; <strong>Time:</strong> [Time] &nbsp;&nbsp; <strong>Location:</strong> [Location / Call link]</p>
<p><strong>Attendees:</strong> [Name 1, Name 2, Name 3]</p>
<p><strong>Facilitator:</strong> [Name] &nbsp;&nbsp; <strong>Note-taker:</strong> [Name]</p>
<hr/>
<h2>Agenda</h2>
<ol>
  <li>[Agenda item 1]</li>
  <li>[Agenda item 2]</li>
  <li>[Agenda item 3]</li>
</ol>
<h2>Discussion</h2>
<h3>Item 1: [Topic]</h3>
<p>[Summary of discussion, key points raised, decisions made.]</p>
<h3>Item 2: [Topic]</h3>
<p>[Summary of discussion.]</p>
<h2>Decisions Made</h2>
<ul>
  <li>[Decision 1]</li>
  <li>[Decision 2]</li>
</ul>
<h2>Action Items</h2>
<table>
  <thead><tr><th>Task</th><th>Owner</th><th>Due Date</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>[Task 1]</td><td>[Name]</td><td>[Date]</td><td>Pending</td></tr>
    <tr><td>[Task 2]</td><td>[Name]</td><td>[Date]</td><td>Pending</td></tr>
  </tbody>
</table>
<h2>Next Meeting</h2>
<p><strong>Date:</strong> [Date] &nbsp;&nbsp; <strong>Agenda:</strong> [Topic]</p>`,
  },
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    category: 'Business',
    preview: `<h1>Project Proposal</h1><h2>Executive Summary</h2><p>This proposal outlines the scope, timeline, and budget for…</p><h2>Objectives</h2>`,
    content: `<h1>Project Proposal</h1>
<p><strong>Prepared by:</strong> [Your Name] &nbsp;&nbsp; <strong>Date:</strong> [Date] &nbsp;&nbsp; <strong>Version:</strong> 1.0</p>
<hr/>
<h2>Executive Summary</h2>
<p>This proposal outlines the scope, objectives, timeline, and budget for [Project Name]. We approach every project as a responsibility — treating our client's resources, time, and trust with care.</p>
<h2>Problem Statement</h2>
<p>[Describe the problem or opportunity this project addresses. Be specific and evidence-based.]</p>
<h2>Proposed Solution</h2>
<p>[Describe your proposed approach. How will it solve the problem? What makes it the right solution?]</p>
<h2>Objectives</h2>
<ul>
  <li>[Objective 1 — specific, measurable]</li>
  <li>[Objective 2]</li>
  <li>[Objective 3]</li>
</ul>
<h2>Scope of Work</h2>
<h3>In Scope</h3>
<ul><li>[Deliverable 1]</li><li>[Deliverable 2]</li></ul>
<h3>Out of Scope</h3>
<ul><li>[Item not included]</li></ul>
<h2>Timeline</h2>
<table>
  <thead><tr><th>Phase</th><th>Description</th><th>Duration</th><th>End Date</th></tr></thead>
  <tbody>
    <tr><td>Phase 1</td><td>Discovery &amp; Planning</td><td>2 weeks</td><td>[Date]</td></tr>
    <tr><td>Phase 2</td><td>Design</td><td>3 weeks</td><td>[Date]</td></tr>
    <tr><td>Phase 3</td><td>Development</td><td>6 weeks</td><td>[Date]</td></tr>
    <tr><td>Phase 4</td><td>Testing &amp; Launch</td><td>2 weeks</td><td>[Date]</td></tr>
  </tbody>
</table>
<h2>Budget</h2>
<table>
  <thead><tr><th>Item</th><th>Cost</th></tr></thead>
  <tbody>
    <tr><td>Design</td><td>$[Amount]</td></tr>
    <tr><td>Development</td><td>$[Amount]</td></tr>
    <tr><td>Project Management</td><td>$[Amount]</td></tr>
    <tr><td><strong>Total</strong></td><td><strong>$[Total]</strong></td></tr>
  </tbody>
</table>
<h2>Team</h2>
<p>[Brief description of who will be working on this project and their roles.]</p>
<h2>Next Steps</h2>
<ol>
  <li>Review and approve this proposal</li>
  <li>Sign project agreement</li>
  <li>Kick-off meeting — [Proposed Date]</li>
</ol>`,
  },
  {
    id: 'invoice',
    name: 'Invoice',
    category: 'Business',
    preview: `<h1>Invoice</h1><p><strong>Invoice #:</strong> 001 &nbsp; <strong>Date:</strong> [Date]</p><table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody><tr><td>Service</td><td>1</td><td>$0</td><td>$0</td></tr></tbody></table>`,
    content: `<h1>Invoice</h1>
<p><strong>From:</strong> Ark Software Co. &nbsp;&nbsp; <strong>Invoice #:</strong> [001] &nbsp;&nbsp; <strong>Date:</strong> [Date] &nbsp;&nbsp; <strong>Due:</strong> [Date]</p>
<hr/>
<p><strong>Bill To:</strong><br/>[Client Name]<br/>[Client Address]<br/>[Client Email]</p>
<h2>Services Rendered</h2>
<table>
  <thead><tr><th>Description</th><th>Qty</th><th>Unit Rate</th><th>Total</th></tr></thead>
  <tbody>
    <tr><td>[Service or deliverable 1]</td><td>1</td><td>$[Rate]</td><td>$[Amount]</td></tr>
    <tr><td>[Service or deliverable 2]</td><td>1</td><td>$[Rate]</td><td>$[Amount]</td></tr>
    <tr><td>[Service or deliverable 3]</td><td>[Hrs]</td><td>$[Rate]/hr</td><td>$[Amount]</td></tr>
  </tbody>
</table>
<table style="margin-top:12px;width:50%;margin-left:auto">
  <tbody>
    <tr><td><strong>Subtotal</strong></td><td>$[Amount]</td></tr>
    <tr><td>Tax ([Rate]%)</td><td>$[Amount]</td></tr>
    <tr><td><strong>Total Due</strong></td><td><strong>$[Amount]</strong></td></tr>
  </tbody>
</table>
<h2>Payment Instructions</h2>
<p><strong>Bank Transfer:</strong> [Bank / Account details]<br/><strong>Due Date:</strong> [Date] &nbsp; <strong>Reference:</strong> Invoice #[001]</p>
<hr/>
<p style="font-style:italic;color:#6B6456;font-size:14px;">Thank you for your business. We are grateful for the opportunity to serve you. — Ark Software Co.</p>`,
  },
  {
    id: 'sermon-outline',
    name: 'Sermon Outline',
    category: 'Faith',
    preview: `<h1>Sermon Title</h1><p><strong>Scripture:</strong> [Reference] &nbsp; <strong>Date:</strong> [Date]</p><blockquote>"[Key verse]"</blockquote><h2>Introduction</h2>`,
    content: `<h1>[Sermon Title]</h1>
<p><strong>Scripture:</strong> [Book Chapter:Verses] &nbsp;&nbsp; <strong>Speaker:</strong> [Name] &nbsp;&nbsp; <strong>Date:</strong> [Date]</p>
<blockquote>"[Main key verse in full]" — [Reference]</blockquote>
<h2>Introduction</h2>
<p>[Opening hook — a story, question, or observation that draws people in. Connect it to the human experience.]</p>
<p><strong>Big Idea:</strong> [One sentence that captures the heart of the message.]</p>
<h2>Point 1: [Title]</h2>
<p><strong>Scripture:</strong> [Reference]</p>
<p>[Explanation of the text — what does it mean in context?]</p>
<p><strong>Illustration:</strong> [Story, example, or analogy that brings it to life.]</p>
<p><strong>Application:</strong> [So what? How does this truth change how we live?]</p>
<h2>Point 2: [Title]</h2>
<p><strong>Scripture:</strong> [Reference]</p>
<p>[Explanation.]</p>
<p><strong>Illustration:</strong> [Story or example.]</p>
<p><strong>Application:</strong> [Practical response.]</p>
<h2>Point 3: [Title]</h2>
<p><strong>Scripture:</strong> [Reference]</p>
<p>[Explanation.]</p>
<p><strong>Application:</strong> [Practical response.]</p>
<h2>Conclusion</h2>
<p>[Bring the big idea home. Restate it with clarity and conviction.]</p>
<p><strong>Call to Action:</strong> [What specific step do you want people to take this week?]</p>
<blockquote>"[Closing verse or benediction]" — [Reference]</blockquote>
<h2>Pastoral Notes</h2>
<p>[Personal reminders, tone notes, prayer points, altar call guidance, etc.]</p>`,
  },
  {
    id: 'devotional',
    name: 'Devotional',
    category: 'Faith',
    preview: `<h1>Daily Devotional</h1><blockquote>"The Lord is my shepherd…" — Psalm 23:1</blockquote><h2>Reflection</h2><p>Today's passage reminds us…</p><h2>Prayer</h2>`,
    content: `<h1>[Devotional Title]</h1>
<p><strong>Date:</strong> [Date] &nbsp;&nbsp; <strong>Scripture Reading:</strong> [Book Chapter:Verses]</p>
<blockquote>"[Key verse in full]" — [Reference]</blockquote>
<h2>Reflection</h2>
<p>[Open with a relatable observation or question that connects to today's passage. Draw the reader into the text.]</p>
<p>[Unpack the passage. What was happening in context? What does this verse mean? What does it reveal about God's character?]</p>
<p>[Connect it to today. How does this ancient truth speak into modern life? Be honest, warm, and personal.]</p>
<h2>Going Deeper</h2>
<ul>
  <li>Where in your life does this truth need to take root today?</li>
  <li>What is one thing you can do differently because of this passage?</li>
  <li>Who in your life needs to hear this encouragement?</li>
</ul>
<h2>Prayer</h2>
<p>Lord, [write a personal, honest prayer that responds to the passage — confession, gratitude, petition, or praise.] Amen.</p>
<h2>Memory Verse</h2>
<blockquote>"[Short verse to memorize]" — [Reference]</blockquote>`,
  },
  {
    id: 'report',
    name: 'Report',
    category: 'Academic',
    preview: `<h1>Report Title</h1><p><strong>Author:</strong> [Name] &nbsp; <strong>Date:</strong> [Date]</p><h2>Abstract</h2><p>This report examines…</p><h2>Introduction</h2>`,
    content: `<h1>[Report Title]</h1>
<p><strong>Author:</strong> [Name] &nbsp;&nbsp; <strong>Date:</strong> [Date] &nbsp;&nbsp; <strong>Version:</strong> 1.0</p>
<hr/>
<h2>Abstract</h2>
<p>[A brief 2–3 sentence summary of the report's purpose, method, key findings, and conclusion.]</p>
<h2>Introduction</h2>
<p>[Background and context. Why does this topic matter? What problem or question does this report address?]</p>
<p><strong>Objective:</strong> [State the specific goal or research question.]</p>
<h2>Methodology</h2>
<p>[How was information gathered or the analysis conducted? Be specific about sources, tools, or processes used.]</p>
<h2>Findings</h2>
<h3>Finding 1: [Title]</h3>
<p>[Detail the first key finding. Use data, examples, or evidence.]</p>
<h3>Finding 2: [Title]</h3>
<p>[Detail the second key finding.]</p>
<h3>Finding 3: [Title]</h3>
<p>[Detail the third key finding.]</p>
<h2>Analysis</h2>
<p>[What do the findings mean? Interpret the data. Identify patterns, causes, or implications.]</p>
<h2>Recommendations</h2>
<ol>
  <li>[Recommendation 1 — actionable and specific]</li>
  <li>[Recommendation 2]</li>
  <li>[Recommendation 3]</li>
</ol>
<h2>Conclusion</h2>
<p>[Summarize the key points and restate why the findings matter. End with a clear final thought.]</p>
<h2>References</h2>
<p>[1] [Author. Title. Publisher, Year.]<br/>[2] [Author. Title. Publisher, Year.]</p>`,
  },
  {
    id: 'weekly-plan',
    name: 'Weekly Planner',
    category: 'Personal',
    preview: `<h1>Week of [Date]</h1><h2>Priorities This Week</h2><ul><li>Priority one</li><li>Priority two</li></ul><table><thead><tr><th>Day</th><th>Tasks</th></tr></thead>`,
    content: `<h1>Week of [Date]</h1>
<blockquote>"Commit your work to the Lord, and your plans will be established." — Proverbs 16:3</blockquote>
<h2>Priorities This Week</h2>
<ul>
  <li>[Most important priority — the one thing that must happen]</li>
  <li>[Second priority]</li>
  <li>[Third priority]</li>
</ul>
<h2>Daily Plan</h2>
<table>
  <thead><tr><th>Day</th><th>Focus / Tasks</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td><strong>Monday</strong></td><td>[Tasks]</td><td></td></tr>
    <tr><td><strong>Tuesday</strong></td><td>[Tasks]</td><td></td></tr>
    <tr><td><strong>Wednesday</strong></td><td>[Tasks]</td><td></td></tr>
    <tr><td><strong>Thursday</strong></td><td>[Tasks]</td><td></td></tr>
    <tr><td><strong>Friday</strong></td><td>[Tasks]</td><td></td></tr>
    <tr><td><strong>Saturday</strong></td><td>[Tasks]</td><td></td></tr>
    <tr><td><strong>Sunday</strong></td><td>Rest &amp; Worship</td><td></td></tr>
  </tbody>
</table>
<h2>Habits &amp; Goals</h2>
<table>
  <thead><tr><th>Habit</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th><th>S</th></tr></thead>
  <tbody>
    <tr><td>Scripture reading</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td>Prayer</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td>[Your habit]</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
  </tbody>
</table>
<h2>End of Week Reflection</h2>
<p><strong>What went well?</strong></p><p></p>
<p><strong>What would I do differently?</strong></p><p></p>
<p><strong>Gratitude:</strong></p><p></p>`,
  },
  {
    id: 'resume',
    name: 'Résumé',
    category: 'Personal',
    preview: `<h1>[Your Name]</h1><p>your@email.com · (555) 000-0000 · LinkedIn</p><hr/><h2>Experience</h2><p><strong>Job Title</strong> — Company Name</p>`,
    content: `<h1>[Your Full Name]</h1>
<p>[your@email.com] &nbsp;·&nbsp; [(555) 000-0000] &nbsp;·&nbsp; [City, State] &nbsp;·&nbsp; [linkedin.com/in/you]</p>
<hr/>
<h2>Summary</h2>
<p>[A 2–3 sentence professional summary. Who are you, what do you do, and what makes you effective? Be honest and specific.]</p>
<h2>Experience</h2>
<p><strong>[Job Title]</strong> &nbsp;—&nbsp; [Company Name] &nbsp;&nbsp; [Start Date] – [End Date]</p>
<ul>
  <li>[Achievement or responsibility — use action verbs and quantify where possible]</li>
  <li>[Achievement or responsibility]</li>
  <li>[Achievement or responsibility]</li>
</ul>
<p><strong>[Job Title]</strong> &nbsp;—&nbsp; [Company Name] &nbsp;&nbsp; [Start Date] – [End Date]</p>
<ul>
  <li>[Achievement]</li>
  <li>[Achievement]</li>
</ul>
<h2>Education</h2>
<p><strong>[Degree, Major]</strong> &nbsp;—&nbsp; [University Name], [Year]</p>
<p>[Relevant coursework, honors, GPA if strong]</p>
<h2>Skills</h2>
<p><strong>Technical:</strong> [Skill 1, Skill 2, Skill 3]</p>
<p><strong>Tools:</strong> [Tool 1, Tool 2, Tool 3]</p>
<p><strong>Languages:</strong> [Language 1, Language 2]</p>
<h2>Certifications &amp; Awards</h2>
<ul>
  <li>[Certification or Award — Issuer, Year]</li>
  <li>[Certification or Award]</li>
</ul>`,
  },
  {
    id: 'team-charter',
    name: 'Team Charter',
    category: 'Business',
    preview: `<h1>Team Charter</h1><h2>Purpose</h2><p>We exist to…</p><h2>Values</h2><ul><li>Integrity</li><li>Service</li></ul>`,
    content: `<h1>Team Charter</h1>
<p><strong>Team Name:</strong> [Name] &nbsp;&nbsp; <strong>Date:</strong> [Date] &nbsp;&nbsp; <strong>Version:</strong> 1.0</p>
<blockquote>"Do nothing out of selfish ambition or vain conceit. In humility value others above yourselves." — Philippians 2:3</blockquote>
<h2>Purpose</h2>
<p>We exist to [describe the team's core mission — what problem you solve, who you serve, and why it matters].</p>
<h2>Our Values</h2>
<ul>
  <li><strong>Integrity</strong> — We do honest work. What we say is what we deliver.</li>
  <li><strong>Service</strong> — We build and communicate with others in mind.</li>
  <li><strong>Humility</strong> — We stay teachable, give credit freely, and keep ego out of our work.</li>
  <li><strong>Stewardship</strong> — We treat time, budget, and trust as sacred responsibilities.</li>
  <li>[Add your own team value]</li>
</ul>
<h2>Team Members</h2>
<table>
  <thead><tr><th>Name</th><th>Role</th><th>Responsibility</th></tr></thead>
  <tbody>
    <tr><td>[Name]</td><td>[Role]</td><td>[Primary responsibility]</td></tr>
    <tr><td>[Name]</td><td>[Role]</td><td>[Primary responsibility]</td></tr>
    <tr><td>[Name]</td><td>[Role]</td><td>[Primary responsibility]</td></tr>
  </tbody>
</table>
<h2>Ways of Working</h2>
<h3>Communication</h3>
<ul>
  <li><strong>Primary channel:</strong> [Slack / Email / etc.]</li>
  <li><strong>Response time:</strong> [Within X hours during business hours]</li>
  <li><strong>Meetings:</strong> [Cadence and format]</li>
</ul>
<h3>Decision Making</h3>
<p>[How does the team make decisions? Consensus? Lead decision-maker? Document your process.]</p>
<h3>Conflict Resolution</h3>
<p>[How will disagreements be handled? Be specific and gracious.]</p>
<h2>Goals</h2>
<ol>
  <li>[Goal 1 — specific and time-bound]</li>
  <li>[Goal 2]</li>
  <li>[Goal 3]</li>
</ol>
<h2>Agreements</h2>
<p>[List any specific commitments the team is making to each other. These are the promises that build trust.]</p>`,
  },
  {
    id: 'prayer-journal',
    name: 'Prayer Journal',
    category: 'Faith',
    preview: `<h1>Prayer Journal</h1><p><strong>Date:</strong> [Date]</p><h2>Thanksgiving</h2><p>Today I am grateful for…</p><h2>Intercession</h2>`,
    content: `<h1>Prayer Journal</h1>
<p><strong>Date:</strong> [Date] &nbsp;&nbsp; <strong>Scripture today:</strong> [Reference]</p>
<hr/>
<h2>Adoration</h2>
<p><em>Who is God to me today? What attribute of His character am I seeing?</em></p>
<p></p>
<h2>Confession</h2>
<p><em>Where have I fallen short? What do I need to bring before Him honestly?</em></p>
<p></p>
<h2>Thanksgiving</h2>
<p><em>What am I grateful for today — big and small?</em></p>
<ul>
  <li></li>
  <li></li>
  <li></li>
</ul>
<h2>Supplication — Personal</h2>
<p><em>What do I need from God today?</em></p>
<p></p>
<h2>Supplication — Others</h2>
<p><em>Who am I interceding for?</em></p>
<table>
  <thead><tr><th>Person</th><th>Request</th><th>Date to follow up</th></tr></thead>
  <tbody>
    <tr><td>[Name]</td><td>[Request]</td><td></td></tr>
    <tr><td>[Name]</td><td>[Request]</td><td></td></tr>
    <tr><td>[Name]</td><td>[Request]</td><td></td></tr>
  </tbody>
</table>
<h2>What I Sensed God Saying</h2>
<p>[Any impressions, scriptures that came to mind, or moments of clarity during prayer time.]</p>
<h2>Memory Verse</h2>
<blockquote>"[Verse]" — [Reference]</blockquote>`,
  },
];

const TEMPLATE_CATEGORIES = ['All', 'Business', 'Faith', 'Academic', 'Personal'];
let activeTplCat = 'All';

function openTemplates() {
  closeAllMenus();
  $('templates-overlay').classList.remove('hidden');
  renderTemplateCats();
  renderTemplateGrid('');
  setTimeout(() => $('template-search').focus(), 100);
}

function closeTemplates() {
  $('templates-overlay').classList.add('hidden');
}

function renderTemplateCats() {
  const wrap = $('template-cats');
  wrap.innerHTML = TEMPLATE_CATEGORIES.map(cat =>
    `<button class="template-cat-btn${cat === activeTplCat ? ' active' : ''}" onclick="setTplCat('${cat}')">${cat}</button>`
  ).join('');
}

function setTplCat(cat) {
  activeTplCat = cat;
  renderTemplateCats();
  renderTemplateGrid($('template-search').value);
}

function filterTemplates(q) {
  renderTemplateGrid(q);
}

function renderTemplateGrid(query) {
  const q = (query || '').toLowerCase().trim();
  const filtered = TEMPLATES.filter(t => {
    const matchCat = activeTplCat === 'All' || t.category === activeTplCat;
    const matchQ   = !q || t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const grid = $('templates-grid');
  if (!filtered.length) {
    grid.innerHTML = '<div class="templates-empty">No templates found. Try a different search or category.</div>';
    return;
  }

  grid.innerHTML = filtered.map(t => `
    <div class="template-card">
      <div class="template-preview">
        <div class="template-preview-inner">${t.preview}</div>
      </div>
      <div class="template-info">
        <div class="template-name">${t.name}</div>
        <div class="template-cat-tag">${t.category}</div>
        <button class="template-use-btn" onclick="useTemplate('${t.id}')">Use this template</button>
      </div>
    </div>
  `).join('');
}

function useTemplate(id) {
  const tpl = TEMPLATES.find(t => t.id === id);
  if (!tpl) return;

  // Save current
  const current = getActiveDoc();
  if (current) {
    current.content = editor().innerHTML;
    current.updatedAt = new Date().toISOString();
  }

  const newId = Date.now();
  const doc = {
    id: newId,
    title: tpl.name,
    content: tpl.content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.docs.unshift(doc);
  state.activeId = newId;

  editor().innerHTML = tpl.content;
  $('doc-title').value = tpl.name;
  $('page-header-title').textContent = tpl.name;
  updateWordCount();
  renderSidebar();
  persistState();
  closeTemplates();

  // Focus start of editor
  editor().focus();
  const range = document.createRange();
  range.selectNodeContents(editor());
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ──────────────────────────────────────────────────────────
   VERSE ROTATOR
────────────────────────────────────────────────────────── */

function rotateVerse() {
  const v = VERSES[Math.floor(Math.random() * VERSES.length)];
  $('verse-text').textContent = v.text;
  $('verse-ref').textContent = v.ref;
}

/* ──────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  loadState();

  // Load active doc into editor
  const doc = getActiveDoc();
  if (doc) {
    editor().innerHTML = doc.content || '';
    $('doc-title').value = doc.title || 'Untitled';
    $('page-header-title').textContent = doc.title || 'Untitled';
  }

  renderSidebar();
  updateWordCount();
  rotateVerse();
  setupMenus();
  setupKeyboardShortcuts();
  applyDarkMode();
  buildAccentPicker();
  applyAccent(state.accent);

  // Verse rotation every 30s
  setInterval(rotateVerse, 30000);

  // Editor events
  editor().addEventListener('input', onEditorInput);
  editor().addEventListener('keyup', updateToolbarState);
  editor().addEventListener('mouseup', (e) => { updateToolbarState(); updateBubble(e); });

  // Doc title sync
  $('doc-title').addEventListener('input', function () {
    const title = this.value;
    $('page-header-title').textContent = title || 'Untitled';
    const doc = getActiveDoc();
    if (doc) { doc.title = title; renderSidebar(); }
  });

  // Close menus on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#menubar')) {
      closeAllMenus();
    }
    if (!$('format-bubble').contains(e.target)) {
      const sel = window.getSelection();
      if (!sel || !sel.toString().trim()) {
        $('format-bubble').classList.remove('visible');
      }
    }
    if (!$('wc-panel').contains(e.target) && e.target !== $('btn-wc')) {
      // Don't auto-close wc panel
    }
  });

  // Placeholder handling
  editor().addEventListener('input', () => {
    editor().dataset.empty = editor().innerText.trim() === '' ? 'true' : 'false';
  });
  editor().dataset.empty = editor().innerText.trim() === '' ? 'true' : 'false';

  setSaveStatus('saved');
});