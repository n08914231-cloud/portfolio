const summaryText = 'Alex Chen: Full-Stack Engineer proficient in TypeScript, React, Node.js, and Cloud Infrastructure. 6+ production web applications deployed with 400+ hours of architectural focus.';

document.querySelector('[data-action="download-cv"]')?.addEventListener('click', (event) => {
  event.preventDefault();
  window.alert('Preparing verified PDF CV compilation bundle...');
});

document.getElementById('copy-summary-btn')?.addEventListener('click', (event) => {
  const button = event.currentTarget;
  const originalContent = button.innerHTML;

  navigator.clipboard.writeText(summaryText).then(() => {
    button.innerHTML = '<span class="material-symbols-outlined text-[16px] text-emerald-400">check</span><span>Copied!</span>';
    window.setTimeout(() => {
      button.innerHTML = originalContent;
    }, 2000);
  });
});

document.getElementById('print-view-btn')?.addEventListener('click', () => {
  window.print();
});