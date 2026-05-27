const STORAGE_KEY = 'dylan_comeback_v4';

// Load saved state from localStorage
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

// ── CARD TOGGLE ──
function toggleCard(id) {
  const card = document.getElementById('card-' + id);
  card.classList.toggle('open');
}

// ── VIEW SWITCHING ──
document.querySelectorAll('.view-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById('view-' + tab.dataset.view).classList.add('active');

    if (tab.dataset.view === 'done') renderDone();
  });
});

// ── COLLECT ITEM METADATA (for Done view) ──
const itemMeta = {};
document.querySelectorAll('.chk-item').forEach(item => {
  const id = item.dataset.id;
  itemMeta[id] = {
    name:      item.querySelector('.chk-name').textContent,
    type:      item.querySelector('.chk-type').textContent,
    ptsText:   item.querySelector('.pts-badge').textContent,
    ptsClass:  item.querySelector('.pts-badge').className,
    itemType:  item.dataset.type,
    className: item.closest('.class-card').querySelector('.class-info-name').textContent,
  };

  // Apply saved state on load
  if (state[id]) item.classList.add('done');

  // Click handler
  item.addEventListener('click', () => toggleItem(id, item));
});

// ── TOGGLE ITEM ──
function toggleItem(id, el) {
  state[id] = !state[id];
  el.classList.toggle('done', !!state[id]);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateAll();
}

// ── UPDATE PROGRESS BAR & COUNTERS ──
function updateAll() {
  const allItems = document.querySelectorAll('.chk-item');
  const total    = allItems.length;
  const done     = [...allItems].filter(i => state[i.dataset.id]).length;
  const pct      = total ? Math.round((done / total) * 100) : 0;

  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-count').textContent = done + ' / ' + total + ' done';

  // Per-class left counts
  ['coding', 'rel', 'span', 'eng', 'photo'].forEach(cls => {
    const items = document.querySelectorAll(`.chk-item[data-class="${cls}"]`);
    const left  = [...items].filter(i => !state[i.dataset.id]).length;
    const el    = document.getElementById(cls + '-left');
    if (el) el.textContent = left;
  });

  // Urgency section counts
  updateUrgencyCount('count-critical', '#card-coding .chk-item');
  updateUrgencyCount('count-high',     '#card-rel .chk-item, #card-geo .chk-item');
  updateUrgencyCount('count-medium',   '#card-span .chk-item, #card-eng .chk-item');
  updateUrgencyCount('count-low',      '#card-photo .chk-item');
}

function updateUrgencyCount(counterId, selector) {
  const items = document.querySelectorAll(selector);
  const left  = [...items].filter(i => !state[i.dataset.id]).length;
  const el    = document.getElementById(counterId);
  if (el) el.textContent = left + ' left';
}

// ── RENDER DONE VIEW ──
function renderDone() {
  const wrap  = document.getElementById('done-items-wrap');
  const empty = document.getElementById('done-empty');

  const doneIds = Object.keys(state).filter(k => state[k] && itemMeta[k]);
  wrap.innerHTML = '';

  if (!doneIds.length) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  // Group by class name
  const groups = {};
  doneIds.forEach(id => {
    const meta = itemMeta[id];
    if (!groups[meta.className]) groups[meta.className] = [];
    groups[meta.className].push({ id, ...meta });
  });

  // Render each group
  Object.entries(groups).forEach(([className, items]) => {
    const card  = document.createElement('div');
    card.className = 'done-card';

    const label = document.createElement('div');
    label.className   = 'done-card-label';
    label.textContent = className;
    card.appendChild(label);

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'done-item';
      row.innerHTML = `
        <div class="chk-box">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="chk-text">
          <div class="chk-name">${item.name}</div>
          <div class="chk-meta">
            <span class="chk-type">${item.type}</span>
            <span class="pts-badge pts-done">Done ✓</span>
          </div>
        </div>`;

      // Clicking a done item unchecks it
      row.addEventListener('click', () => {
        state[item.id] = false;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        // Uncheck original item in To Do view
        const original = document.querySelector(`.chk-item[data-id="${item.id}"]`);
        if (original) original.classList.remove('done');

        updateAll();
        renderDone();
      });

      card.appendChild(row);
    });

    wrap.appendChild(card);
  });
}

// ── INIT ──
updateAll();
