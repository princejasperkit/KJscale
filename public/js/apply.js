// public/js/apply.js
// Handles opening the Apply modal, submitting the form to /api/apply and redirecting to /apply/ref?number=REF
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('applyModal');
  const form = document.getElementById('applyForm');
  const statusEl = document.getElementById('applyStatus');
  const posLabel = document.getElementById('applyModalPosition');
  const posInput = document.getElementById('apply_position');

  if (!modal || !form) {
    // If modal isn't present, nothing to do.
    return;
  }

  function openModal(position) {
    posInput.value = position || '';
    posLabel.textContent = position ? `Position: ${position}` : '';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const first = form.querySelector('input, textarea');
    first && first.focus();
  }
  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Attach to all apply buttons in opportunities listing
  document.querySelectorAll('.opportunity-apply, .apply-now-button, [data-apply-button]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const position = btn.dataset.position || btn.getAttribute('data-position') || btn.getAttribute('data-title') || btn.textContent.trim();
      openModal(position);
    });
  });

  // Close handlers
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Remove homepage form if present (safety)
  const homeCandidates = ['#homepage-apply-form', '.homepage-apply-form', '#applyHome', '.apply-home'];
  homeCandidates.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.remove();
  });

  // Submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.style.display = 'none';
    const submitBtn = document.getElementById('applySubmit');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';

    const body = {
      name: document.getElementById('apply_name').value.trim(),
      email: document.getElementById('apply_email').value.trim(),
      phone: document.getElementById('apply_phone').value.trim(),
      message: document.getElementById('apply_message').value.trim(),
      position: posInput.value
    };

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Submission failed');
      // success
      closeModal();
      const ref = encodeURIComponent(json.reference || json.ref || json.referenceNumber || '');
      window.location.href = `/apply/ref?number=${ref}`;
    } catch (err) {
      statusEl.style.display = 'block';
      statusEl.textContent = 'There was an error sending your application. Please try again.';
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
