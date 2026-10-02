/**
 * app.js — TaskPilot AI Frontend
 */

/* ── State ── */
let currentSource   = 'meeting';
let lastResult      = null;
let taskStates      = {};  // id → {done, expanded}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date
  document.getElementById('today-date').value = new Date().toISOString().split('T')[0];

  // Check health
  checkHealth();

  // Attach all listeners
  attachNavListeners();
  attachSourceListeners();
  attachSampleListeners();
  attachAnalyzeListener();
  attachFilterListeners();

  document.getElementById('export-btn').addEventListener('click', exportJSON);
  document.getElementById('copy-json-btn').addEventListener('click', copyJSON);

  // Char counter
  document.getElementById('input-text').addEventListener('input', function() {
    document.getElementById('char-count').textContent = this.value.length.toLocaleString();
  });
});

/* ── Navigation ── */
function attachNavListeners() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
    });
  });
}

function switchPanel(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
}

/* ── Source Tabs ── */
function attachSourceListeners() {
  document.querySelectorAll('.src-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.src-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSource = btn.dataset.source;
    });
  });
}

/* ── Sample Cards ── */
function attachSampleListeners() {
  document.querySelectorAll('.sample-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      if (!window.SAMPLES || !window.SAMPLES[type]) return;
      document.getElementById('input-text').value = window.SAMPLES[type];
      document.getElementById('char-count').textContent = window.SAMPLES[type].length.toLocaleString();
      // Switch source tab
      currentSource = type;
      document.querySelectorAll('.src-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.source === type)
      );
    });
  });
}

/* ── System Prompt ── */
function buildSystemPrompt(source, today) {
  return `You are an expert project manager and task extractor. Your job is to read ${source} content and extract ALL tasks, action items, blockers, and follow-ups.

Today's date is: ${today}

Return ONLY valid JSON — no markdown, no commentary, no backticks. The exact schema:

{
  "meeting_summary": "2-3 sentence summary of the content",
  "metadata": {
    "source_type": "${source}",
    "participants": ["name1", "name2"],
    "date_detected": "YYYY-MM-DD or null",
    "total_tasks": 0,
    "total_blockers": 0,
    "total_followups": 0
  },
  "tasks": [
    {
      "id": "T001",
      "title": "Short action title",
      "description": "Full context from the text",
      "owner": "Person name or 'Unassigned'",
      "deadline": "YYYY-MM-DD or descriptive string or null",
      "priority": "critical|high|medium|low",
      "status": "pending|in_progress|done",
      "tags": ["backend","frontend","design"]
    }
  ],
  "blockers": [
    {
      "id": "B001",
      "title": "Short blocker title",
      "description": "Full context",
      "affects": "Which task/person this blocks",
      "severity": "critical|high|medium",
      "resolution": "Suggested resolution if mentioned"
    }
  ],
  "followups": [
    {
      "id": "F001",
      "title": "Follow-up or decision item",
      "description": "Full context",
      "owner": "Person responsible",
      "due": "deadline or null",
      "type": "decision|followup|question|dependency"
    }
  ]
}

Rules:
- Extract EVERY task — err on the side of inclusion
- For priority: critical = must happen today/tomorrow; high = this week; medium = soon; low = nice-to-have
- Infer deadlines from context (e.g. "by Friday", "tomorrow", "next week") and convert to YYYY-MM-DD using today's date
- If a person is assigned, use their name exactly as stated
- Tags should be 1-3 relevant keywords per task
- Return ONLY the JSON object — nothing else`;
}

/* ── Analyze ── */
function attachAnalyzeListener() {
  document.getElementById('analyze-btn').addEventListener('click', async () => {
    const text  = document.getElementById('input-text').value.trim();
    const today = document.getElementById('today-date').value;

    if (!text || text.length < 10) {
      showStatus('Please paste at least 10 characters of text.', 'error');
      return;
    }

    const btn = document.getElementById('analyze-btn');
    btn.classList.add('loading');
    btn.innerHTML = '<span class="spinner"></span> Analyzing…';
    showStatus('Sending to AI for analysis…', 'info');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          source: currentSource,
          today,
          systemPrompt: buildSystemPrompt(currentSource, today),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showStatus('Error: ' + (data.message || 'Unknown error'), 'error');
        return;
      }

      lastResult = data;
      taskStates = {};
      renderAll(data);
      showStatus(`✅ Extracted ${data.tasks?.length || 0} tasks, ${data.blockers?.length || 0} blockers, ${data.followups?.length || 0} follow-ups`, 'success');
      switchPanel('dashboard');

    } catch (err) {
      showStatus('Network error: ' + err.message, 'error');
    } finally {
      btn.classList.remove('loading');
      btn.innerHTML = '<span class="btn-icon">🤖</span><span class="btn-text">Extract Tasks with AI</span>';
    }
  });
}

/* ── Render All ── */
function renderAll(data) {
  renderDashboard(data);
  renderTasks(data.tasks || []);
  renderBlockers(data.blockers || []);
  renderFollowups(data.followups || []);
  renderJSON(data);
}

/* ── Dashboard ── */
function renderDashboard(data) {
  const tasks    = data.tasks    || [];
  const blockers = data.blockers || [];
  const followups= data.followups|| [];

  const critical = tasks.filter(t => t.priority === 'critical').length;
  const high     = tasks.filter(t => t.priority === 'high').length;
  const done     = tasks.filter(t => t.status === 'done').length;

  const el = document.getElementById('dashboard-content');
  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-number stat-accent">${tasks.length}</div>
        <div class="stat-label">Total Tasks</div>
      </div>
      <div class="stat-card">
        <div class="stat-number stat-red">${critical}</div>
        <div class="stat-label">Critical</div>
      </div>
      <div class="stat-card">
        <div class="stat-number stat-yellow">${high}</div>
        <div class="stat-label">High Priority</div>
      </div>
      <div class="stat-card">
        <div class="stat-number stat-green">${done}</div>
        <div class="stat-label">Done</div>
      </div>
      <div class="stat-card">
        <div class="stat-number stat-red">${blockers.length}</div>
        <div class="stat-label">Blockers</div>
      </div>
      <div class="stat-card">
        <div class="stat-number stat-accent">${followups.length}</div>
        <div class="stat-label">Follow-ups</div>
      </div>
    </div>
    <div class="summary-card">
      <strong>Summary</strong><br>
      ${data.meeting_summary || 'No summary available.'}
      ${data.metadata?.participants?.length
        ? `<br><br><strong>Participants:</strong> ${data.metadata.participants.join(', ')}`
        : ''}
      ${data.metadata?.date_detected
        ? `<br><strong>Meeting Date:</strong> ${data.metadata.date_detected}`
        : ''}
    </div>`;
}

/* ── Tasks ── */
function priorityClass(p) {
  return { critical: 'p-critical', high: 'p-high', medium: 'p-medium', low: 'p-low' }[p] || 'p-low';
}
function priorityLabel(p) {
  return { critical: '🔴 Critical', high: '🟠 High', medium: '🟡 Medium', low: '🟢 Low' }[p] || p;
}

function taskCardHTML(t) {
  const state = taskStates[t.id] || {};
  const doneClass = state.done ? ' done' : '';
  const extraClass = state.expanded ? ' open' : '';
  return `
    <div class="task-card${doneClass}" id="card-${t.id}">
      <div class="card-top">
        <div class="card-title">${escHTML(t.title)}</div>
        <span class="priority-badge ${priorityClass(t.priority)}">${priorityLabel(t.priority)}</span>
      </div>
      <div class="card-meta">
        ${t.owner    ? `<div class="meta-row"><span class="meta-icon">👤</span>${escHTML(t.owner)}</div>` : ''}
        ${t.deadline ? `<div class="meta-row"><span class="meta-icon">📅</span>${escHTML(t.deadline)}</div>` : ''}
        ${t.tags?.length ? `<div class="meta-row"><span class="meta-icon">🏷</span>${t.tags.map(g => `<span style="background:var(--surface2);padding:1px 6px;border-radius:4px;margin-right:4px;">${escHTML(g)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="card-extra${extraClass}">${escHTML(t.description || '')}</div>
      <div class="card-actions">
        <button class="done-btn" onclick="toggleDone('${t.id}')">${state.done ? '↩ Reopen' : '✓ Done'}</button>
        <button class="expand-btn" onclick="toggleExpand('${t.id}')">${state.expanded ? 'Less ▲' : 'More ▼'}</button>
      </div>
    </div>`;
}

function renderTasks(tasks) {
  const priority = document.getElementById('filter-priority').value;
  const status   = document.getElementById('filter-status').value;
  const sort     = document.getElementById('sort-tasks').value;

  let filtered = tasks.slice();
  if (priority) filtered = filtered.filter(t => t.priority === priority);
  if (status)   filtered = filtered.filter(t => {
    if (status === 'done') return taskStates[t.id]?.done;
    return !taskStates[t.id]?.done && t.status === status;
  });

  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  if (sort === 'priority') filtered.sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
  if (sort === 'deadline') filtered.sort((a, b) => (a.deadline || 'zzz').localeCompare(b.deadline || 'zzz'));
  if (sort === 'owner')    filtered.sort((a, b) => (a.owner || '').localeCompare(b.owner || ''));

  const el = document.getElementById('tasks-content');
  el.innerHTML = filtered.length
    ? filtered.map(taskCardHTML).join('')
    : '<div class="empty-state">No tasks match the current filters</div>';
}

function toggleDone(id) {
  taskStates[id] = taskStates[id] || {};
  taskStates[id].done = !taskStates[id].done;
  if (lastResult) renderTasks(lastResult.tasks || []);
}
function toggleExpand(id) {
  taskStates[id] = taskStates[id] || {};
  taskStates[id].expanded = !taskStates[id].expanded;
  if (lastResult) renderTasks(lastResult.tasks || []);
}

function attachFilterListeners() {
  ['filter-priority', 'filter-status', 'sort-tasks'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      if (lastResult) renderTasks(lastResult.tasks || []);
    });
  });
}

/* ── Blockers ── */
function renderBlockers(blockers) {
  const el = document.getElementById('blockers-content');
  if (!blockers.length) { el.innerHTML = '<div class="empty-state">No blockers found 🎉</div>'; return; }
  el.innerHTML = blockers.map(b => `
    <div class="blocker-card">
      <div class="blocker-title">🚧 ${escHTML(b.title)}</div>
      <div class="blocker-meta">
        ${b.affects   ? `<div>Affects: ${escHTML(b.affects)}</div>` : ''}
        ${b.severity  ? `<div>Severity: ${escHTML(b.severity)}</div>` : ''}
        ${b.description ? `<div style="margin-top:8px;color:var(--text)">${escHTML(b.description)}</div>` : ''}
        ${b.resolution ? `<div style="margin-top:6px;color:var(--green)">💡 ${escHTML(b.resolution)}</div>` : ''}
      </div>
    </div>`).join('');
}

/* ── Follow-ups ── */
function renderFollowups(followups) {
  const el = document.getElementById('followups-content');
  if (!followups.length) { el.innerHTML = '<div class="empty-state">No follow-ups found</div>'; return; }
  el.innerHTML = followups.map(f => `
    <div class="followup-card">
      <div class="followup-title">${typeIcon(f.type)} ${escHTML(f.title)}</div>
      <div class="followup-meta">
        ${f.owner ? `<div>Owner: ${escHTML(f.owner)}</div>` : ''}
        ${f.due   ? `<div>Due: ${escHTML(f.due)}</div>` : ''}
        ${f.description ? `<div style="margin-top:8px;color:var(--text)">${escHTML(f.description)}</div>` : ''}
      </div>
    </div>`).join('');
}
function typeIcon(t) {
  return { decision: '🟦', followup: '🔄', question: '❓', dependency: '🔗' }[t] || '📌';
}

/* ── JSON ── */
function renderJSON(data) {
  document.getElementById('json-content').textContent = JSON.stringify(data, null, 2);
}

/* ── Export ── */
function exportJSON() {
  if (!lastResult) return;
  const blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'taskpilot-export-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
}
function copyJSON() {
  if (!lastResult) return;
  navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2));
  const btn = document.getElementById('copy-json-btn');
  btn.textContent = '✓ Copied!';
  setTimeout(() => btn.textContent = '📋 Copy', 2000);
}

/* ── Health ── */
async function checkHealth() {
  try {
    const res  = await fetch('/api/health');
    const data = await res.json();
    const badge = document.getElementById('provider-badge');
    if (data.keySet) {
      badge.textContent = `✓ ${data.provider.toUpperCase()} ready`;
      badge.style.borderColor = 'var(--green)';
      badge.style.color = 'var(--green)';
    } else {
      badge.textContent = `✗ ${data.provider.toUpperCase()} key missing`;
      badge.style.borderColor = 'var(--red)';
      badge.style.color = 'var(--red)';
    }
  } catch (_) {}
}

/* ── Status ── */
function showStatus(msg, type) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.className = 'status-msg ' + type;
}

/* ── Utils ── */
function escHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
