// Calendly popup (waits for async widget script)
(function () {
  const CALENDLY_URL = 'https://calendly.com/technologymindz/book-a-demo';

  function openCalendly(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (window.Calendly && typeof Calendly.initPopupWidget === 'function') {
      Calendly.initPopupWidget({ url: CALENDLY_URL });
      return;
    }
    let attempts = 0;
    const wait = setInterval(() => {
      attempts++;
      if (window.Calendly && typeof Calendly.initPopupWidget === 'function') {
        clearInterval(wait);
        Calendly.initPopupWidget({ url: CALENDLY_URL });
      } else if (attempts >= 50) {
        clearInterval(wait);
        window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
      }
    }, 100);
  }

  window.openCalendlyDemo = function (event) {
    openCalendly(event);
    return false;
  };

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-calendly]');
    if (!trigger) return;
    openCalendly(e);
  });
})();

// Mobile nav
const t = document.getElementById('navToggle');
const m = document.getElementById('navMobile');
if (t) t.addEventListener('click', () => m.classList.toggle('open'));
m && m.querySelectorAll('a').forEach(a => a.addEventListener('click', () => m.classList.remove('open')));

document.querySelectorAll('.nav-mobile-dropdown-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const wrap = btn.closest('.nav-mobile-dropdown');
    const open = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});

// Active nav link for current page
(function () {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const solutionPages = ["ai-sdr.html", "ai-chatbot.html", "invoice-processing.html"];

  function pageFromHref(href) {
    if (!href || href === "#") return null;
    return href.split("/").pop().split("?")[0].split("#")[0] || "index.html";
  }

  document.querySelectorAll(".nav-links a, .nav-mobile a").forEach((link) => {
    if (link.classList.contains("btn")) return;
    const target = pageFromHref(link.getAttribute("href"));
    if (target && target === currentPage) {
      link.classList.add("active");
    }
  });

  if (solutionPages.includes(currentPage)) {
    document.querySelectorAll(".nav-dropdown-toggle, .nav-mobile-dropdown-toggle").forEach((link) => {
      link.classList.add("active");
    });
  }
})();

// Reveal on scroll
const isSdrPage = document.body.classList.contains('sdr-page') || document.body.classList.contains('solution-page');

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, {
  threshold: isSdrPage ? 0.12 : 0.12,
  rootMargin: isSdrPage ? '0px 0px -4% 0px' : '0px'
});

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// AI SDR — hero animates immediately on first paint
if (isSdrPage) {
  const hero = document.querySelector('.sdr-hero.reveal');
  if (hero) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => hero.classList.add('in'));
    });
  }
}

// Why Syntra carousel
(function () {
  const track = document.getElementById('wsCarousel');
  if (!track) return;
  const cards = track.querySelectorAll('.ws-card');
  const visibleCount = () => {
    if (window.innerWidth <= 560) return 1;
    if (window.innerWidth <= 920) return 2;
    return 3;
  };
  let current = 0;

  function maxIndex() { return cards.length - visibleCount(); }
  function slide() {
    const cardWidth = cards[0].getBoundingClientRect().width + 16;
    track.style.transform = `translateX(-${current * cardWidth}px)`;
  }

  var wsNext = document.getElementById('wsNext');
  var wsPrev = document.getElementById('wsPrev');
  if (wsNext) wsNext.addEventListener('click', () => {
    current = Math.min(current + 1, maxIndex());
    slide();
  });
  if (wsPrev) wsPrev.addEventListener('click', () => {
    current = Math.max(current - 1, 0);
    slide();
  });
  window.addEventListener('resize', () => {
    current = Math.min(current, maxIndex());
    slide();
  });
})();

// Business Impact slider
(function () {
  const track = document.getElementById("caseSliderTrack");
  const dotsWrap = document.getElementById("caseSliderDots");
  const prevBtn = document.getElementById("casePrev");
  const nextBtn = document.getElementById("caseNext");
  if (!track) return;

  const slides = track.querySelectorAll(".case-slide");
  const dots = dotsWrap ? dotsWrap.querySelectorAll(".case-slider-dot") : [];
  let current = 0;
  let timer;

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  prevBtn && prevBtn.addEventListener("click", () => {
    prev();
    startAuto();
  });

  nextBtn && nextBtn.addEventListener("click", () => {
    next();
    startAuto();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goTo(parseInt(dot.dataset.index, 10));
      startAuto();
    });
  });

  window.addEventListener("resize", () => goTo(current));
  goTo(0);
  startAuto();
})();

// Tab toggling (visual only)
document.querySelectorAll('.dash-tabs').forEach(group => {
  group.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      group.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
});

// Why-card tabs with panel switching
document.querySelectorAll('.why-tabs').forEach(group => {
  const card = group.closest('.why-card');
  group.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      group.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const idx = tab.dataset.tab;
      card.querySelectorAll('.why-panel').forEach(p => p.classList.remove('active'));
      card.querySelector(`.why-panel[data-panel="${idx}"]`).classList.add('active');
    });
  });
});

// FAQ Accordion
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      item.querySelector('.faq-q').setAttribute('aria-expanded', 'true');
    }
  });
});

// Analytics Tabs
(function () {
  const tabs = document.querySelectorAll('#atabTabs .atab-tab');
  const panels = document.querySelectorAll('#atabVisual .atab-panel');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.querySelector(`#atabVisual .atab-panel[data-panel="${idx}"]`);
      if (panel) panel.classList.add('active');
    });
  });
})();

// Capabilities scroll-spy
(function () {
  const right = document.getElementById('capsRight');
  const tabs  = document.querySelectorAll('#capsTabs .caps-tab');
  if (!right || !tabs.length) return;

  const cards = right.querySelectorAll('.caps-card');

  // Click tab → scroll that card into view
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = parseInt(tab.dataset.tab);
      cards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setActive(idx);
    });
  });

  function setActive(idx) {
    tabs.forEach(t => t.classList.remove('active'));
    if (tabs[idx]) tabs[idx].classList.add('active');
  }

  // Scroll-spy: watch which card is most visible in viewport
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = parseInt(entry.target.dataset.cap);
        setActive(idx);
      }
    });
  }, { threshold: 0.5 });

  cards.forEach(card => spy.observe(card));
})();

// Number counter animation (About page stats)
(function () {
  const counters = document.querySelectorAll('.about-stat-num[data-count]');
  if (!counters.length) return;

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const step = 16;
    const totalSteps = duration / step;
    let current = 0;

    const timer = setInterval(() => {
      current += target / totalSteps;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current) + suffix;
    }, step);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(el => observer.observe(el));
})();

// AI SDR — setup stepper animation (continuous top-to-bottom fill)
(function () {
  if (!document.body.classList.contains('ai-sdr-page')) return;
  const section = document.querySelector('.sdr-setup-section');
  const target = document.getElementById('sdrSetupStepper') || section;
  if (!section || !target) return;

  const stepperIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      section.classList.toggle('is-stepping', entry.isIntersecting);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  stepperIo.observe(target);
})();


// Contact form validation
(function () {
  const contactForm = document.getElementById("contactForm");
  if (!contactForm) return;

  const NAME_RE = /^[A-Za-z\s'-]+$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const rules = {
    first: {
      label: "First name",
      required: true,
      min: 2,
      max: 50,
      pattern: NAME_RE,
      invalidPattern: "Only letters, spaces, hyphens and apostrophes are allowed.",
      filter: (value) => value.replace(/[^A-Za-z\s'-]/g, "")
    },
    last: {
      label: "Last name",
      required: true,
      min: 2,
      max: 50,
      pattern: NAME_RE,
      invalidPattern: "Only letters, spaces, hyphens and apostrophes are allowed.",
      filter: (value) => value.replace(/[^A-Za-z\s'-]/g, "")
    },
    email: {
      label: "Email",
      required: true,
      max: 100,
      pattern: EMAIL_RE,
      invalidPattern: "Please enter a valid email address.",
      filter: (value) => value.replace(/[^\w.@+-]/g, "")
    },
    subject: {
      label: "Subject",
      required: true,
      min: 3,
      max: 100,
      invalidPattern: "Subject must be at least 3 characters.",
      filter: (value) => value.replace(/[^\w\s.,!?&()'-]/g, "")
    },
    msg: {
      label: "Message",
      required: false,
      max: 1000
    }
  };

  function getFieldWrap(name) {
    return contactForm.querySelector(`[data-field="${name}"]`);
  }

  function setFieldError(name, message) {
    const wrap = getFieldWrap(name);
    if (!wrap) return;
    const errorEl = wrap.querySelector(".field-error");
    if (message) {
      wrap.classList.add("has-error");
      errorEl.textContent = message;
    } else {
      wrap.classList.remove("has-error");
      errorEl.textContent = "";
    }
  }

  function clearAllErrors() {
    Object.keys(rules).forEach((name) => setFieldError(name, ""));
  }

  function validateField(name, value) {
    const rule = rules[name];
    const trimmed = value.trim();

    if (rule.required && !trimmed) {
      return `${rule.label} is required.`;
    }

    if (!rule.required && !trimmed) {
      return "";
    }

    if (rule.min && trimmed.length < rule.min) {
      return `${rule.label} must be at least ${rule.min} characters.`;
    }

    if (rule.max && trimmed.length > rule.max) {
      return `${rule.label} must be at most ${rule.max} characters.`;
    }

    if (rule.pattern && !rule.pattern.test(trimmed)) {
      return rule.invalidPattern;
    }

    return "";
  }

  function validateForm() {
    let firstInvalid = null;
    let valid = true;

    Object.keys(rules).forEach((name) => {
      const input = contactForm.elements[name];
      if (!input) return;
      const error = validateField(name, input.value);
      setFieldError(name, error);
      if (error) {
        valid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  Object.entries(rules).forEach(([name, rule]) => {
    const input = contactForm.elements[name];
    if (!input) return;

    if (rule.filter) {
      input.addEventListener("input", () => {
        const filtered = rule.filter(input.value);
        if (filtered !== input.value) input.value = filtered;
        if (getFieldWrap(name).classList.contains("has-error")) {
          setFieldError(name, validateField(name, input.value));
        }
      });
    }

    input.addEventListener("blur", () => {
      setFieldError(name, validateField(name, input.value));
    });

    input.addEventListener("input", () => {
      if (getFieldWrap(name).classList.contains("has-error")) {
        setFieldError(name, validateField(name, input.value));
      }
    });
  });

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearAllErrors();

    const btn = document.getElementById("sendBtn");
    const responseDiv = document.getElementById("formResponse");
    responseDiv.textContent = "";
    responseDiv.style.color = "";

    if (!validateForm()) {
      responseDiv.textContent = "Please fill the highlighted fields.";
      responseDiv.style.color = "#e53935";
      return;
    }

    btn.disabled = true;
    btn.innerText = "Sending...";

    const formData = new FormData(this);

    try {
      const response = await fetch("contact.php", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.errors) {
        Object.entries(data.errors).forEach(([name, message]) => setFieldError(name, message));
      }

      responseDiv.textContent = data.message || "";

      if (data.status === "success") {
        responseDiv.style.color = "green";
        this.reset();
        clearAllErrors();
      } else {
        responseDiv.style.color = "#e53935";
      }
    } catch (error) {
      responseDiv.textContent = "Something went wrong. Please try again.";
      responseDiv.style.color = "#e53935";
    }

    btn.disabled = false;
    btn.innerText = "Book a Demo →";
  });
})();



// ===== chatbot js ======



// ===== WHY OneAgentiq — scroll + click + stacking tabs =====
(function () {
  function initOaWhy() {
    var section = document.getElementById("oa-why");
    if (!section || section.dataset.oaWhyReady === "1") return;
    section.dataset.oaWhyReady = "1";

    var track = section.querySelector(".oa-why-track");
    var viewport = section.querySelector(".oa-why-steps-viewport");
    var stepsWrap = section.querySelector(".oa-why-steps");
    var steps = Array.prototype.slice.call(section.querySelectorAll(".oa-why-step"));
    var panels = Array.prototype.slice.call(section.querySelectorAll(".oa-why-panel"));
    if (!track || !viewport || !stepsWrap || !steps.length || !panels.length) return;

    var index = 0;
    var lockScroll = false;
    var ticking = false;
    var isMobile = function () {
      return window.matchMedia("(max-width: 900px)").matches;
    };

    /**
     * Keep past tabs stacked & visible at the top.
     * Only nudge the list up if active would sit too low —
     * never scroll past tabs fully out of view.
     */
    function layoutStack(activeIndex) {
      if (isMobile()) {
        stepsWrap.style.transform = "none";
        return;
      }

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var vh = viewport.clientHeight;
          var activeEl = steps[activeIndex];
          if (!activeEl) return;

          var stackTop = activeIndex > 0 ? steps[0].offsetTop : 0;
          var activeTop = activeEl.offsetTop;
          var activeBottom = activeTop + activeEl.offsetHeight;

          // Leave room for bottom blur fade (~88px)
          var safeBottom = vh - 72;
          var y = 0;

          if (activeBottom > safeBottom) {
            y = activeBottom - safeBottom;
          }

          // Never hide the stacked past tabs: keep at least ~8px of stack at top
          var maxY = Math.max(0, activeTop - stackTop - 8);
          if (y > maxY) y = maxY;

          // When starting (step 0), pin to top
          if (activeIndex === 0) y = 0;

          stepsWrap.style.transform = "translate3d(0, " + (-y) + "px, 0)";
        });
      });
    }

    function applyStep(next) {
      index = Math.max(0, Math.min(steps.length - 1, next));
      steps.forEach(function (btn, n) {
        var on = n === index;
        btn.classList.toggle("is-active", on);
        btn.classList.toggle("is-past", n < index);
        btn.classList.toggle("is-future", n > index);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (panel, n) {
        panel.classList.toggle("is-active", n === index);
      });
      layoutStack(index);
    }

    function scrollToStep(i) {
      if (isMobile()) return;
      lockScroll = true;
      var rect = track.getBoundingClientRect();
      var top = window.pageYOffset + rect.top;
      var scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
      var target = top + (i / Math.max(1, steps.length - 1)) * scrollable;
      window.scrollTo({ top: target, behavior: "smooth" });
      window.setTimeout(function () { lockScroll = false; }, 850);
    }

    function setStep(i, fromClick) {
      var next = Math.max(0, Math.min(steps.length - 1, i));
      if (next === index && !fromClick) return;
      applyStep(next);
      if (fromClick) scrollToStep(next);
    }

    function onScroll() {
      if (lockScroll || isMobile()) return;

      var rect = track.getBoundingClientRect();
      var scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
      var progressed = Math.min(scrollable, Math.max(0, -rect.top));
      var ratio = progressed / scrollable;

      var i = Math.min(
        steps.length - 1,
        Math.max(0, Math.round(ratio * (steps.length - 1)))
      );
      setStep(i, false);
    }

    function requestScrollUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        onScroll();
      });
    }

    section.addEventListener("click", function (e) {
      var btn = e.target.closest(".oa-why-step");
      if (!btn || !section.contains(btn)) return;
      e.preventDefault();
      var i = parseInt(btn.getAttribute("data-step"), 10);
      if (isNaN(i)) i = steps.indexOf(btn);
      if (i < 0) return;
      setStep(i, true);
    });

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", function () {
      layoutStack(index);
      requestScrollUpdate();
    });
    applyStep(0);
    onScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOaWhy);
  } else {
    initOaWhy();
  }
})();

// ===== On-demand AI Agents — vertical scroll → horizontal move =====
(function () {
  function initOaAgents() {
    var section = document.querySelector(".oa-agents-section");
    if (!section || section.dataset.oaAgentsReady === "1") return;
    section.dataset.oaAgentsReady = "1";

    var track = section.querySelector(".oa-agents-track");
    var rail = section.querySelector(".oa-agents-rail");
    var row = document.getElementById("oaAgentsRow") || section.querySelector(".oa-agents-row");
    if (!track || !rail || !row) return;

    var ticking = false;

    function isMobile() {
      return window.matchMedia("(max-width: 900px)").matches;
    }

    function maxShift() {
      var cs = window.getComputedStyle(rail);
      var padL = parseFloat(cs.paddingLeft) || 0;
      var padR = parseFloat(cs.paddingRight) || 0;
      var visible = Math.max(1, rail.clientWidth - padL - padR);
      return Math.max(0, row.scrollWidth - visible);
    }

    function onScroll() {
      if (isMobile()) {
        row.style.transform = "none";
        return;
      }

      var rect = track.getBoundingClientRect();
      var scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
      var progressed = Math.min(scrollable, Math.max(0, -rect.top));
      var ratio = progressed / scrollable;
      row.style.transform = "translate3d(" + (-ratio * maxShift()) + "px, 0, 0)";
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        onScroll();
      });
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("load", requestUpdate);
    onScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOaAgents);
  } else {
    initOaAgents();
  }
})();

// Hero video — compact custom controls
(function () {
  var video = document.getElementById("heroVideo");
  var playBtn = document.getElementById("heroVideoPlay");
  var muteBtn = document.getElementById("heroVideoMute");
  var fsBtn = document.getElementById("heroVideoFs");
  var seek = document.getElementById("heroVideoSeek");
  var timeEl = document.getElementById("heroVideoTime");
  if (!video || !playBtn || !muteBtn || !fsBtn || !seek || !timeEl) return;

  function formatTime(seconds) {
    if (!isFinite(seconds)) return "0:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function updateTime() {
    var cur = formatTime(video.currentTime);
    var dur = formatTime(video.duration);
    timeEl.textContent = dur === "0:00" ? cur : cur + " / " + dur;
    if (video.duration) {
      seek.value = String((video.currentTime / video.duration) * 100);
    }
  }

  function setPlayState() {
    var playing = !video.paused;
    var icon = playBtn.querySelector("i");
    playBtn.setAttribute("aria-label", playing ? "Pause video" : "Play video");
    if (icon) icon.className = playing ? "fa-solid fa-pause" : "fa-solid fa-play";
  }

  function setMuteState() {
    var icon = muteBtn.querySelector("i");
    muteBtn.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
    if (icon) icon.className = video.muted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
  }

  playBtn.addEventListener("click", function () {
    if (video.paused) video.play().catch(function () {});
    else video.pause();
    setPlayState();
  });

  muteBtn.addEventListener("click", function () {
    video.muted = !video.muted;
    if (!video.muted) video.volume = 1;
    setMuteState();
  });

  fsBtn.addEventListener("click", function () {
    var wrap = video.closest(".dash-card-video");
    var target = wrap && wrap.requestFullscreen ? wrap : video;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    if (target.requestFullscreen) target.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  });

  seek.addEventListener("input", function () {
    if (!video.duration) return;
    video.currentTime = (Number(seek.value) / 100) * video.duration;
    updateTime();
  });

  video.addEventListener("timeupdate", updateTime);
  video.addEventListener("loadedmetadata", updateTime);
  video.addEventListener("play", setPlayState);
  video.addEventListener("pause", setPlayState);
  video.addEventListener("volumechange", setMuteState);

  document.addEventListener("fullscreenchange", function () {
    var icon = fsBtn.querySelector("i");
    var isFs = !!document.fullscreenElement;
    fsBtn.setAttribute("aria-label", isFs ? "Exit fullscreen" : "Enter fullscreen");
    if (icon) icon.className = isFs ? "fa-solid fa-compress" : "fa-solid fa-expand";
  });

  setPlayState();
  setMuteState();
  updateTime();
})();
