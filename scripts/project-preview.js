import { highlightLuau } from './highlight-luau.js';
import { createProjectLoader } from './project-loader.js';

const dialog = document.querySelector('[data-code-dialog]');
const titleElement = document.querySelector('[data-code-title]');
const closeButton = document.querySelector('[data-dialog-close]');
const fileSelect = document.querySelector('[data-file-select]');
const fileList = document.querySelector('[data-file-list]');
const currentFileLabel = document.querySelector('[data-current-file]');
const dialogStatus = document.querySelector('[data-dialog-status]');
const retryButton = document.querySelector('[data-load-retry]');
const sourceCode = document.querySelector('[data-source-code]');
const sourceViewport = document.querySelector('[data-source-viewport]');
const motionPreference = typeof globalThis.matchMedia === 'function'
  ? globalThis.matchMedia('(prefers-reduced-motion: reduce)')
  : null;
const loader = createProjectLoader();

let activeProject;
let activeFiles = [];
let requestVersion = 0;
let lastTrigger;
let sourceAnimation;

function stopSourceMotion(event) {
  if (!event.matches) return;
  sourceAnimation?.cancel();
  sourceAnimation = null;
}

motionPreference?.addEventListener('change', stopSourceMotion);

function animateSourceChange() {
  sourceAnimation?.cancel();
  sourceAnimation = null;
  if (motionPreference?.matches || typeof sourceViewport.animate !== 'function') return;
  sourceAnimation = sourceViewport.animate(
    [{ opacity: 0.7 }, { opacity: 1 }],
    { duration: 110, easing: 'ease-out' }
  );
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    if (character === '&') return '&amp;';
    if (character === '<') return '&lt;';
    if (character === '>') return '&gt;';
    if (character === '"') return '&quot;';
    return '&#39;';
  });
}

function setStatus(message, canRetry = false) {
  dialogStatus.textContent = message;
  retryButton.hidden = !canRetry;
}

function selectFile(index) {
  const file = activeFiles[index];
  if (!file) return;

  fileList.querySelectorAll('button').forEach((button, fileIndex) => {
    button.setAttribute('aria-pressed', String(fileIndex === index));
  });
  fileSelect.value = String(index);
  const language = file.language === 'luau' ? 'Luau' : 'Markdown';
  const lineCount = file.source ? file.source.split('\n').length : 0;
  currentFileLabel.textContent = `${file.name} · ${language} · ${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`;
  sourceCode.innerHTML = file.language === 'luau'
    ? highlightLuau(file.source)
    : escapeHtml(file.source);
  sourceViewport.scrollTop = 0;
  sourceViewport.scrollLeft = 0;
  setStatus(file.source ? '' : 'This source file is empty.');
  animateSourceChange();
}

function renderFiles(project) {
  activeFiles = project.files;
  fileList.replaceChildren();
  fileSelect.replaceChildren();

  project.files.forEach((file, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = file.name;
    fileSelect.append(option);

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = file.name;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => selectFile(index));
    fileList.append(button);
  });

  selectFile(0);
}

async function loadActiveProject(version) {
  const id = activeProject;
  if (!id) return;
  setStatus('Loading project source.');

  try {
    const project = await loader.load(id);
    if (!dialog.open || version !== requestVersion || id !== activeProject) return;
    titleElement.textContent = project.title;
    renderFiles(project);
  } catch {
    if (!dialog.open || version !== requestVersion || id !== activeProject) return;
    setStatus('Source could not be loaded. Try again.', true);
  }
}

function open(id, trigger) {
  activeProject = id;
  lastTrigger = trigger;
  const version = ++requestVersion;
  titleElement.textContent = 'Code preview';
  currentFileLabel.textContent = '';
  sourceCode.textContent = '';
  fileList.replaceChildren();
  fileSelect.replaceChildren();
  setStatus('Loading project source.');
  if (!dialog.open) {
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  closeButton.focus();
  void loadActiveProject(version);
}

function close() {
  dialog.close();
}

fileSelect.addEventListener('change', () => selectFile(Number(fileSelect.value)));
closeButton.addEventListener('click', close);
retryButton.addEventListener('click', () => loadActiveProject(requestVersion));
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  requestVersion += 1;
  activeProject = null;
  activeFiles = [];
  titleElement.textContent = 'Code preview';
  currentFileLabel.textContent = '';
  sourceCode.textContent = '';
  sourceViewport.scrollTop = 0;
  sourceViewport.scrollLeft = 0;
  sourceAnimation?.cancel();
  sourceAnimation = null;
  fileList.replaceChildren();
  fileSelect.replaceChildren();
  setStatus('Choose a project to view its source.');
  if (lastTrigger?.isConnected) lastTrigger.focus();
  lastTrigger = null;
});

export function getProjectPreview() {
  return { open };
}
