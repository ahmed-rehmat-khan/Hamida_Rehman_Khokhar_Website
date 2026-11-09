(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.getElementById('siteNav');
  const navMenu = document.getElementById('navMenu');

  // Navbar state
  const setNavState = () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 24);
  };
  setNavState();
  window.addEventListener('scroll', setNavState, { passive: true });

  // Smooth anchor scrolling with nav offset
  const navOffset = () => (nav ? nav.offsetHeight + 8 : 72);
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.pageYOffset - navOffset();
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  // Close mobile menu on link click
  if (navMenu) {
    navMenu.querySelectorAll('a.nav-link, a.nav-cta').forEach((link) => {
      link.addEventListener('click', () => {
        const toggler = document.querySelector('.navbar-toggler');
        if (toggler && window.getComputedStyle(toggler).display !== 'none' && window.bootstrap) {
          const instance = bootstrap.Collapse.getInstance(navMenu) || new bootstrap.Collapse(navMenu, { toggle: false });
          instance.hide();
        }
      });
    });
  }

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -30px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Counter animation for metrics
  const counters = document.querySelectorAll('.count[data-target]');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.target || '0', 10);
    if (!target || prefersReduced) { el.textContent = target; return; }
    const duration = 1200;
    const start = performance.now();
    const from = 0;
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.floor(from + (target - from) * eased);
      el.textContent = target >= 1000 ? val.toLocaleString() : val;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target >= 1000 ? target.toLocaleString() : target;
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const cObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cObs.observe(c));
  } else {
    counters.forEach((c) => (c.textContent = c.dataset.target));
  }

  // Tasteful 3D tilt
  const canTilt = !prefersReduced && window.matchMedia('(pointer: fine)').matches;
  if (canTilt) {
    const tiltEls = document.querySelectorAll('.tilt-card, .tilt-card-sm');
    tiltEls.forEach((el) => {
      const max = el.classList.contains('tilt-card') ? 7 : 5;
      const lift = el.classList.contains('tilt-card') ? 4 : 2;
      let raf = null;
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * -max;
        const ry = (px - 0.5) * max;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-${lift}px)`;
        });
      };
      const onLeave = () => {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)';
      };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      el.addEventListener('blur', onLeave);
    });
  }

  // Subtle hero parallax
  const heroImg = document.querySelector('.hero-bg-image[data-parallax]');
  if (heroImg && !prefersReduced) {
    const speed = parseFloat(heroImg.dataset.parallax || '0.12');
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY * speed;
        heroImg.style.transform = `translateY(${y}px)`;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Active nav highlighting (scroll-spy)
  const spyLinks = Array.from(document.querySelectorAll('.spy-link'));
  const spySections = Array.from(document.querySelectorAll('.spy-section'));
  if (spyLinks.length && spySections.length && 'IntersectionObserver' in window) {
    const byId = new Map(spyLinks.map((a) => [a.getAttribute('href'), a]));
    const spyObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const href = `#${entry.target.id}`;
        spyLinks.forEach((a) => a.classList.toggle('active', a === byId.get(href)));
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0.01 });
    spySections.forEach((s) => spyObs.observe(s));
  }

  // Lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;
  const openLightbox = (img) => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || 'Preview image';
    if (lightboxCaption) lightboxCaption.textContent = img.alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lightboxImg) lightboxImg.src = '';
  };
  if (lightbox) {
    document.querySelectorAll('.lightbox-trigger').forEach((img) => {
      img.addEventListener('click', () => openLightbox(img));
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(img); }
      });
    });
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox(); });
  }

  // Form submit via FormSubmit (AJAX) with fallback
  const form = document.getElementById('contactForm');
  if (form) {
    const status = document.getElementById('formStatus');
    const btn = document.getElementById('submitBtn');
    const label = btn ? btn.querySelector('.btn-label') : null;
    const loading = btn ? btn.querySelector('.btn-loading') : null;

    const setLoading = (on) => {
      if (!btn) return;
      btn.disabled = on;
      if (label) label.classList.toggle('d-none', on);
      if (loading) loading.classList.toggle('d-none', !on);
    };
    const setStatus = (msg, type) => {
      if (!status) return;
      status.textContent = msg;
      status.className = `form-status ${type || ''}`.trim();
    };

    form.addEventListener('submit', async (e) => {
      // Try AJAX to FormSubmit; fall back to native submit on failure.
      e.preventDefault();
      setStatus('', '');
      setLoading(true);
      try {
        const endpoint = form.getAttribute('action');
        const fd = new FormData(form);
        const res = await fetch(endpoint, {
          method: 'POST',
          body: fd,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          form.reset();
          setStatus('Thank you — your message has been sent successfully.', 'success');
        } else {
          setStatus('Submitting securely…', 'success');
          form.submit();
          return;
        }
      } catch (err) {
        setStatus('Submitting securely…', 'success');
        form.submit();
        return;
      } finally {
        setLoading(false);
      }
    });
  }
})();
