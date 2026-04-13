// @ts-check

/** @type {ReturnType<typeof acquireVsCodeApi>} */
const vscode = acquireVsCodeApi();

/** @type {import('../src/types').SkillInfo[]} */
let skills = [];

/** @type {string[]} */
let directories = [];

/** @type {string} */
let currentPlatform = 'claude-code';

/** @type {string|null} */
let selectedSkillId = null;

/** @type {Set<string>} */
let checkedIds = new Set();

// --- DOM refs ---
const dirList = /** @type {HTMLDivElement} */ (document.getElementById('dir-list'));
const skillList = /** @type {HTMLDivElement} */ (document.getElementById('skill-list'));
const filterInput = /** @type {HTMLInputElement} */ (document.getElementById('filter-input'));
const descriptionBox = /** @type {HTMLDivElement} */ (document.getElementById('skill-description'));
const btnAddDir = /** @type {HTMLButtonElement} */ (document.getElementById('btn-add-dir'));
const btnCancel = /** @type {HTMLButtonElement} */ (document.getElementById('btn-cancel'));
const btnApply = /** @type {HTMLButtonElement} */ (document.getElementById('btn-apply'));
const platformRadios = /** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll('input[name="platform"]'));

// --- Event listeners ---
btnAddDir.addEventListener('click', () => {
  vscode.postMessage({ command: 'addDirectory' });
});

btnCancel.addEventListener('click', () => {
  // Reset to server state
  checkedIds = new Set(skills.filter(s => s.isInstalled).map(s => s.id));
  renderSkills();
});

btnApply.addEventListener('click', () => {
  vscode.postMessage({ command: 'apply', skillIds: Array.from(checkedIds) });
});

filterInput.addEventListener('input', () => {
  renderSkills();
});

platformRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    currentPlatform = radio.value;
    vscode.postMessage({ command: 'changePlatform', platform: currentPlatform });
  });
});

// --- Message handler ---
window.addEventListener('message', (event) => {
  const msg = event.data;
  switch (msg.command) {
    case 'update':
      skills = msg.skills;
      directories = msg.directories;
      currentPlatform = msg.platform;

      // Initialize checked state from installed status
      checkedIds = new Set(skills.filter(s => s.isInstalled).map(s => s.id));

      // Update platform radio
      platformRadios.forEach(r => {
        r.checked = r.value === currentPlatform;
      });

      renderDirectories();
      renderSkills();
      break;

    case 'applyResult':
      // Refresh will be triggered by extension after apply
      break;
  }
});

// --- Render functions ---
function renderDirectories() {
  if (directories.length === 0) {
    dirList.innerHTML = '<div class="empty-state">No directories configured. Click "+ Add Directory" to start.</div>';
    return;
  }

  dirList.innerHTML = directories.map(dir => `
    <div class="dir-item">
      <span class="dir-path" title="${escapeHtml(dir)}">${escapeHtml(dir)}</span>
      <button class="btn-remove" data-dir="${escapeAttr(dir)}" title="Remove directory">&times;</button>
    </div>
  `).join('');

  // Attach remove handlers
  dirList.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dir = /** @type {HTMLElement} */ (e.currentTarget).dataset.dir;
      vscode.postMessage({ command: 'removeDirectory', directory: dir });
    });
  });
}

function renderSkills() {
  const filter = filterInput.value.toLowerCase().trim();

  const filtered = skills.filter(s =>
    !filter ||
    s.name.toLowerCase().includes(filter) ||
    s.description.toLowerCase().includes(filter)
  );

  if (filtered.length === 0) {
    skillList.innerHTML = skills.length === 0
      ? '<div class="empty-state">No skills found. Add a directory containing skill files.</div>'
      : '<div class="empty-state">No skills match the filter.</div>';
    return;
  }

  skillList.innerHTML = filtered.map(skill => {
    const checked = checkedIds.has(skill.id) ? 'checked' : '';
    const selected = skill.id === selectedSkillId ? 'selected' : '';
    const sourceLabel = getSourceLabel(skill.sourceDir);

    return `
      <div class="skill-item ${selected}" data-id="${escapeAttr(skill.id)}">
        <input type="checkbox" ${checked} data-id="${escapeAttr(skill.id)}" />
        <span class="skill-name">${escapeHtml(skill.name)}</span>
        <span class="skill-desc">${escapeHtml(truncate(skill.description, 60))}</span>
        <span class="skill-source">${escapeHtml(sourceLabel)}</span>
      </div>
    `;
  }).join('');

  // Attach click handlers
  skillList.querySelectorAll('.skill-item').forEach(item => {
    const id = /** @type {HTMLElement} */ (item).dataset.id;

    // Click on row -> select for description
    item.addEventListener('click', (e) => {
      // Don't trigger on checkbox click
      if (/** @type {HTMLElement} */ (e.target).tagName === 'INPUT') return;

      selectedSkillId = id || null;
      renderSkills();
      showDescription(id || null);
    });

    // Checkbox change
    const checkbox = /** @type {HTMLInputElement} */ (item.querySelector('input[type="checkbox"]'));
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        checkedIds.add(id || '');
      } else {
        checkedIds.delete(id || '');
      }
    });
  });

  // Update description if something is selected
  if (selectedSkillId) {
    showDescription(selectedSkillId);
  }
}

/**
 * @param {string|null} skillId
 */
function showDescription(skillId) {
  if (!skillId) {
    descriptionBox.textContent = 'Select a skill to see its description.';
    return;
  }

  const skill = skills.find(s => s.id === skillId);
  if (!skill) {
    descriptionBox.textContent = 'Skill not found.';
    return;
  }

  const lines = [
    `Name: ${skill.name}`,
    `Description: ${skill.description}`,
    `Source: ${skill.sourceDir}`,
    `Format: ${skill.format}`,
    `Status: ${skill.isInstalled ? 'Installed' : 'Not installed'}`,
    '',
    '--- Content ---',
    '',
    skill.body || '(no content)',
  ];

  descriptionBox.textContent = lines.join('\n');
}

// --- Helpers ---
/**
 * @param {string} dir
 * @returns {string}
 */
function getSourceLabel(dir) {
  const parts = dir.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || dir;
}

/**
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} str
 * @returns {string}
 */
function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// --- Init ---
vscode.postMessage({ command: 'ready' });
