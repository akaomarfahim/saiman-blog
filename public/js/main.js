document.addEventListener('DOMContentLoaded', function () {
  // --- Reply form toggling (unchanged behavior from v1) ---
  document.querySelectorAll('.toggle-reply').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const targetId = btn.getAttribute('data-target');
      const form = document.getElementById(targetId);
      if (!form) return;
      form.classList.toggle('hidden');
      if (!form.classList.contains('hidden')) {
        const textarea = form.querySelector('textarea');
        if (textarea) textarea.focus();
      }
    });
  });

  // --- Sticky header: adds a "scrolled" class once the page scrolls past
  // a small threshold, so the header can shrink and pick up a blurred
  // background via CSS. ---
  const header = document.getElementById('siteHeader');
  if (header) {
    const onScroll = function () {
      if (window.scrollY > 12) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // --- Scroll-reveal: elements with the .reveal class fade/rise into
  // view as they enter the viewport, instead of only animating on load.
  // Falls back to showing everything immediately if IntersectionObserver
  // isn't available. ---
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 60, 300) + 'ms';
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }
});
