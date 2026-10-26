const copyButton = document.querySelector('[data-copy-discord]');
const discordName = document.querySelector('[data-discord-username]');
const copyStatus = document.querySelector('[data-copy-status]');

void import('./motion.js')
  .then(({ initMotion }) => initMotion())
  .catch(() => {});

if (copyButton && discordName && copyStatus) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(discordName.textContent.trim());
      copyStatus.textContent = 'Discord username copied.';
    } catch {
      copyStatus.textContent = 'Copy failed. Select and copy the username above.';
    }
  });
}

let previewPromise;

document.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-project]');
  if (!button) return;
  const status = button.closest('.work-content')?.querySelector('[data-code-launch-status]');
  if (status) {
    status.hidden = true;
    status.textContent = '';
  }
  button.disabled = true;
  try {
    const modulePromise = previewPromise ??= import('./project-preview.js');
    const { getProjectPreview } = await modulePromise;
    getProjectPreview().open(button.dataset.project, button);
  } catch {
    previewPromise = null;
    if (status) {
      status.hidden = false;
      status.textContent = 'The code preview could not open. Try again.';
    }
  } finally {
    button.disabled = false;
  }
});
