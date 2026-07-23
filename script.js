// Social Rank Agency — shared behavior

document.addEventListener('DOMContentLoaded', () => {
  // mobile nav toggle
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileClose = document.querySelector('.mobile-close');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      mobileNav.classList.add('open');
      mobileClose.classList.add('open');
    });
    mobileClose.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      mobileClose.classList.remove('open');
    });
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      mobileClose.classList.remove('open');
    }));
  }

  // hero mockup tabs — switch between "Live Rankings" and "Source Code" panels
  document.querySelectorAll('.editor-tabs').forEach((tabBar) => {
    const tabs = tabBar.querySelectorAll('.etab');
    const frame = tabBar.closest('.browser-frame');
    if (!frame) return;
    // real letter-by-letter typing effect for the source-code panel
    function typeCodeEditor(editor) {
      if (!editor) return;
      const lines = Array.from(editor.querySelectorAll('.code-lines .cl'));

      // wrap each line's code content once so it can be revealed char by char
      lines.forEach((line) => {
        const cc = line.querySelector('.cc');
        if (cc && !cc.querySelector('.cc-type')) {
          const wrap = document.createElement('span');
          wrap.className = 'cc-type';
          while (cc.firstChild) wrap.appendChild(cc.firstChild);
          cc.appendChild(wrap);
        }
      });

      // stop any typing already in progress on this editor
      if (editor._typeTimer) clearInterval(editor._typeTimer);
      if (editor._typeNextTimeout) clearTimeout(editor._typeNextTimeout);

      // reset to blank state
      lines.forEach((line) => {
        const wrap = line.querySelector('.cc-type');
        if (wrap) {
          wrap.style.width = '0';
          wrap.classList.remove('caret');
        }
      });
      const status = editor.querySelector('.code-status');
      if (status) status.classList.remove('show');

      let li = 0;
      const perChar = 22; // ms per character — feels like real typing
      const lineGap = 110; // pause between lines

      function typeNextLine() {
        if (li >= lines.length) {
          if (status) status.classList.add('show');
          return;
        }
        const wrap = lines[li].querySelector('.cc-type');
        if (!wrap) { li++; typeNextLine(); return; }
        const full = wrap.textContent.length;
        if (full === 0) { li++; editor._typeNextTimeout = setTimeout(typeNextLine, 40); return; }
        wrap.classList.add('caret');
        let ci = 0;
        editor._typeTimer = setInterval(() => {
          ci++;
          wrap.style.width = ci + 'ch';
          if (ci >= full) {
            clearInterval(editor._typeTimer);
            wrap.classList.remove('caret');
            li++;
            editor._typeNextTimeout = setTimeout(typeNextLine, lineGap);
          }
        }, perChar);
      }
      typeNextLine();
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-panel');
        frame.querySelectorAll('.panel').forEach((p) => {
          p.classList.toggle('active', p.classList.contains('panel-' + target));
        });
        if (target === 'code') {
          typeCodeEditor(frame.querySelector('.code-editor'));
        }
      });
    });
  });

  // "How We Build" terminal — real letter-by-letter typing, runs once when section scrolls into view
  (function initDevTerminal() {
    const term = document.querySelector('.dev-terminal');
    const body = term ? term.querySelector('.term-body') : null;
    if (!body) return;

    const lines = Array.from(body.querySelectorAll('p'));

    // wrap the revealable text of each line once (keep icon and the score number as separate elements)
    lines.forEach((line) => {
      if (line.dataset.termWrapped) return;
      line.dataset.termWrapped = '1';
      const icon = line.querySelector('.term-prompt, .term-ok');
      const num = line.querySelector('.term-num');
      const cursor = line.querySelector('.term-cursor');
      const wrap = document.createElement('span');
      wrap.className = 'term-typed';
      Array.from(line.childNodes)
        .filter((n) => n !== icon && n !== num && n !== cursor)
        .forEach((n) => wrap.appendChild(n));
      if (num) line.insertBefore(wrap, num);
      else if (cursor) line.insertBefore(wrap, cursor);
      else line.appendChild(wrap);
    });

    function runTerminal() {
      // reset every line to blank before "running" it again
      lines.forEach((line) => {
        const wrap = line.querySelector('.term-typed');
        if (wrap) { wrap.style.width = '0ch'; wrap.classList.remove('typing'); }
        const num = line.querySelector('.term-num');
        if (num) { num.style.opacity = '0'; num.style.transform = 'scale(.6)'; }
        const cursor = line.querySelector('.term-cursor');
        if (cursor) cursor.style.visibility = 'hidden';
      });

      let li = 0;
      const perChar = 24;   // ms per character — real typing speed
      const lineGap = 200;  // pause before the next line "runs"

      function typeNextLine() {
        if (li >= lines.length) return;
        const line = lines[li];
        const wrap = line.querySelector('.term-typed');
        const num = line.querySelector('.term-num');
        const cursor = line.querySelector('.term-cursor');

        if (!wrap) { li++; setTimeout(typeNextLine, lineGap); return; }

        const full = wrap.textContent.length;
        if (full === 0) {
          if (num) { num.style.opacity = '1'; num.style.transform = 'scale(1)'; }
          li++;
          setTimeout(typeNextLine, lineGap);
          return;
        }

        wrap.classList.add('typing');
        let ci = 0;
        const timer = setInterval(() => {
          ci++;
          wrap.style.width = ci + 'ch';
          if (ci >= full) {
            clearInterval(timer);
            wrap.classList.remove('typing');
            if (num) setTimeout(() => { num.style.opacity = '1'; num.style.transform = 'scale(1)'; }, 120);
            if (cursor) cursor.style.visibility = 'visible';
            li++;
            setTimeout(typeNextLine, lineGap + (num ? 150 : 0));
          }
        }, perChar);
      }
      typeNextLine();
    }

    if ('IntersectionObserver' in window) {
      const to = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runTerminal();
            to.unobserve(entry.target);
          }
        });
      }, { threshold: 0.35 });
      to.observe(term);
    } else {
      runTerminal();
    }
  })();

  // count-up numbers with data-count attribute
  const counters = document.querySelectorAll('[data-count]');
  const runCounter = (el) => {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = (Number.isInteger(target) ? Math.round(value) : value.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => io.observe(el));
  } else {
    counters.forEach(runCounter);
  }

  // reveal-on-scroll for cards/sections
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          ro.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => ro.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // back-to-top button
  const toTop = document.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', () => {
      toTop.classList.toggle('show', window.scrollY > 500);
    });
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // cursor-reactive spotlight glow behind the hero text (desktop, fine pointer only)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const heroEl = document.querySelector('.hero');
  if (heroEl && !reduceMotion && finePointer) {
    heroEl.addEventListener('mousemove', (e) => {
      const rect = heroEl.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      heroEl.style.setProperty('--mx', mx + '%');
      heroEl.style.setProperty('--my', my + '%');
    });
  }

  // subtle interactive tilt on the hero laptop mockup (desktop, fine pointer only)
  const tiltEl = document.querySelector('.laptop-mockup');
  const tiltZone = document.querySelector('.rank-visual');
  if (tiltEl && tiltZone && !reduceMotion && finePointer) {
    tiltZone.addEventListener('mousemove', (e) => {
      const rect = tiltZone.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const rotY = -9 + px * 10;
      const rotX = 3 - py * 8;
      tiltEl.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(-0.6deg)`;
    });
    tiltZone.addEventListener('mouseleave', () => {
      tiltEl.style.transform = 'rotateY(-9deg) rotateX(3deg) rotateZ(-0.6deg)';
    });
  }

  // contact form — no backend, so guide the user to email/WhatsApp
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#name').value.trim();
      const email = form.querySelector('#email').value.trim();
      const service = form.querySelector('#service').value;
      const message = form.querySelector('#message').value.trim();
      const subject = encodeURIComponent(`New enquiry from ${name || 'website'} — ${service}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nService: ${service}\n\nMessage:\n${message}`);
      window.location.href = `mailto:socialrankagency@gmail.com?subject=${subject}&body=${body}`;
      const note = document.getElementById('form-status');
      if (note) note.textContent = 'Opening your email app to send this enquiry…';
    });
  }

  // FAQ category tabs — filter questions by data-cat
  const faqTabs = document.querySelectorAll('.faq-tab');
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqTabs.length && faqItems.length) {
    faqTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('active')) return;
        faqTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.getAttribute('data-cat');
        faqItems.forEach((item) => {
          const show = item.getAttribute('data-cat') === cat;
          item.hidden = !show;
          if (show) item.classList.add('in');
          if (!show) item.removeAttribute('open');
        });
      });
    });
  }
});
