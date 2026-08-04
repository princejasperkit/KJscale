// public/js/remove-home-apply.js
// Defensive script that removes/hides common homepage apply form elements if present
document.addEventListener('DOMContentLoaded', () => {
  const selectors = ['#homepage-apply-form', '.homepage-apply-form', '#applyHome', '.apply-home', '.home-apply'];
  selectors.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) {
      try { el.remove(); } catch(e) { el.style.display = 'none'; }
    }
  });
});
