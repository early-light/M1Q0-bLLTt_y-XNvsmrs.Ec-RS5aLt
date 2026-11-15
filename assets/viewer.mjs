import * as pdfjsLib from '../pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../pdf.worker.min.mjs', import.meta.url).href;
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const pageBox = $('page');
const canvas = $('canvas');
const context = canvas.getContext('2d');
const annotations = $('annotations');
const slideText = $('slide-text');
const loading = $('loading');
const errorBox = $('error');
const previous = $('previous');
const next = $('next');
const input = $('page-number');
const count = $('page-count');
const fullScreen = $('fullscreen');
const status = $('status');
let pdf;
let currentPage = 1;
let renderTask;
let renderVersion = 0;
let renderChain = Promise.resolve();
let resizeTimer;
let touchStart;

function pageNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(1, Math.min(pdf.numPages, Math.round(number))) : currentPage;
}

function pageFromHash() {
  return /^#page=\d+$/.test(location.hash) ? Number(location.hash.slice(6)) : 1;
}

function showError(error) {
  if (error?.name === 'RenderingCancelledException') return;
  console.error('PDF viewer:', error);
  loading.hidden = true;
  errorBox.hidden = false;
  stage.dataset.state = 'error';
  stage.setAttribute('aria-busy', 'false');
  status.textContent = 'スライドを表示できませんでした。PDFを直接開いてください。';
}

function goTo(value, updateHash = true) {
  if (!pdf) return;
  currentPage = pageNumber(value);
  input.value = currentPage;
  previous.disabled = currentPage === 1;
  next.disabled = currentPage === pdf.numPages;
  if (updateHash) history.replaceState(null, '', `#page=${currentPage}`);
  const number = currentPage;
  const version = ++renderVersion;
  renderTask?.cancel();
  renderChain = renderChain.catch(showError).then(async () => {
    if (version !== renderVersion) return;
    try { await renderPage(number, version); } catch (error) { showError(error); }
  });
}

async function destinationPage(destination) {
  const target = typeof destination === 'string' ? await pdf.getDestination(destination) : destination;
  if (!target?.length) return null;
  return typeof target[0] === 'number' ? target[0] + 1 : (await pdf.getPageIndex(target[0])) + 1;
}

function addLinks(items, viewport) {
  for (const item of items) {
    if (item.subtype !== 'Link' || !item.rect) continue;
    const link = document.createElement('a');
    if (item.url) {
      let url;
      try { url = new URL(item.url); } catch { continue; }
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.title = url.href;
      link.setAttribute('aria-label', `出典を開く：${url.hostname}（新しいタブ）`);
    } else if (item.dest) {
      link.href = '#';
      link.setAttribute('aria-label', '参照ページへ移動');
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        try { const number = await destinationPage(item.dest); if (number) goTo(number); } catch (error) { console.error(error); }
      });
    } else { continue; }
    const rect = viewport.convertToViewportRectangle(item.rect);
    Object.assign(link.style, {
      left: `${Math.min(rect[0], rect[2])}px`, top: `${Math.min(rect[1], rect[3])}px`,
      width: `${Math.abs(rect[2] - rect[0])}px`, height: `${Math.abs(rect[3] - rect[1])}px`,
    });
    annotations.append(link);
  }
}

async function renderPage(number, version) {
  stage.dataset.state = 'rendering';
  stage.setAttribute('aria-busy', 'true');
  annotations.replaceChildren();
  const page = await pdf.getPage(number);
  if (version !== renderVersion) return;
  const base = page.getViewport({ scale: 1 });
  const style = getComputedStyle(stage);
  const availableWidth = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const availableHeight = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const scale = Math.max(.05, Math.min(availableWidth / base.width, availableHeight / base.height));
  const viewport = page.getViewport({ scale });
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.ceil(viewport.width * ratio);
  canvas.height = Math.ceil(viewport.height * ratio);
  pageBox.style.width = `${viewport.width}px`;
  pageBox.style.height = `${viewport.height}px`;
  const task = page.render({ canvasContext: context, viewport, transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0] });
  renderTask = task;
  try { await task.promise; } finally { if (renderTask === task) renderTask = null; }
  if (version !== renderVersion) return;
  const [links, text] = await Promise.all([page.getAnnotations(), page.getTextContent()]);
  if (version !== renderVersion) return;
  addLinks(links, viewport);
  slideText.textContent = text.items.map((item) => item.str || '').join(' ');
  canvas.dataset.page = number;
  pageBox.setAttribute('aria-label', `スライド ${number} / ${pdf.numPages}`);
  stage.dataset.state = 'ready';
  stage.setAttribute('aria-busy', 'false');
  loading.hidden = true;
  errorBox.hidden = true;
  status.textContent = `${number} / ${pdf.numPages} ページ`;
}

previous.addEventListener('click', () => goTo(currentPage - 1));
next.addEventListener('click', () => goTo(currentPage + 1));
input.addEventListener('change', () => goTo(input.value));
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); goTo(input.value); input.blur(); }
});
input.addEventListener('focus', () => input.select());
window.addEventListener('hashchange', () => goTo(pageFromHash(), false));
window.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input, button, a, [contenteditable="true"]')) return;
  const actions = { ArrowRight: currentPage + 1, ArrowDown: currentPage + 1, PageDown: currentPage + 1, ' ': currentPage + 1, ArrowLeft: currentPage - 1, ArrowUp: currentPage - 1, PageUp: currentPage - 1, Home: 1, End: pdf?.numPages };
  if (Object.hasOwn(actions, event.key)) { event.preventDefault(); goTo(actions[event.key]); }
});
stage.addEventListener('touchstart', (event) => { touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }, { passive: true });
stage.addEventListener('touchend', (event) => {
  if (!touchStart || event.changedTouches.length !== 1) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.2) goTo(currentPage + (dx < 0 ? 1 : -1));
  touchStart = null;
}, { passive: true });
stage.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
function scheduleResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => goTo(currentPage, false), 120); }
window.addEventListener('resize', scheduleResize);
new ResizeObserver(scheduleResize).observe(stage);
fullScreen.hidden = !document.fullscreenEnabled;
fullScreen.addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { status.textContent = '全画面表示を開始できませんでした。通常表示でご覧ください。'; }
});
document.addEventListener('fullscreenchange', () => {
  fullScreen.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
  fullScreen.setAttribute('aria-label', document.fullscreenElement ? '全画面表示を終了' : '全画面表示');
  scheduleResize();
});

try {
  pdf = await pdfjsLib.getDocument(new URL(document.body.dataset.pdf, location.href).href).promise;
  count.textContent = pdf.numPages;
  input.max = pdf.numPages;
  input.disabled = false;
  goTo(pageFromHash());
} catch (error) { showError(error); }
