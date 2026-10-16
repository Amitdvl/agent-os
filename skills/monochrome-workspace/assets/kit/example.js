// Reference interactions only. Persistence, undo, exports and application adapters belong to the host.
const tabs = [...document.querySelectorAll('.mw-tab')];
function activate(tab) {
  tabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab));
  tab.addEventListener('keydown', event => {
    const position = {ArrowRight:(index+1)%tabs.length,ArrowLeft:(index+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[event.key];
    if (position === undefined) return;
    event.preventDefault(); activate(tabs[position]); tabs[position].focus();
  });
});
const status = document.getElementById('save-status');
const headline = document.getElementById('headline');
const error = document.getElementById('headline-error');
document.getElementById('sample-form').addEventListener('input', () => {status.textContent = 'Preview changes pending';});
function applyPreview(event) {
  event.preventDefault();
  const invalid = !headline.value.trim();
  error.hidden = !invalid;
  headline.setAttribute('aria-invalid', String(invalid));
  if (invalid) {headline.focus(); return;}
  document.getElementById('sample-title').textContent = headline.value;
  const page = document.querySelector('.sample-page');
  page.querySelector('p:last-child').textContent = document.getElementById('description').value;
  page.querySelector('p:last-child').hidden = !document.querySelector('.mw-checkbox').checked;
  page.style.textAlign = document.getElementById('alignment').value;
  status.textContent = 'Preview updated · not saved to disk';
}
document.getElementById('sample-save').addEventListener('click', applyPreview);
document.getElementById('sample-form').addEventListener('submit', applyPreview);
document.querySelectorAll('.mw-row').forEach(row => row.addEventListener('click', () => {
  document.querySelectorAll('.mw-row').forEach(item => item.removeAttribute('aria-current'));
  row.setAttribute('aria-current', 'true');
  document.getElementById('sample-scene').textContent = row.dataset.scene;
}));
