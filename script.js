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

  document.getElementById('wsNext').addEventListener('click', () => {
    current = Math.min(current + 1, maxIndex());
    slide();
  });
  document.getElementById('wsPrev').addEventListener('click', () => {
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
  if (!section) return;

  const stepperIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      section.classList.toggle('is-stepping', entry.isIntersecting);
    });
  }, { threshold: 0.3 });

  stepperIo.observe(section);
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