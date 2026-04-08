// ===== Scroll-to-top button =====
const scrollTopBtn = document.getElementById("scrollTop");

function toggleScrollTop() {
  scrollTopBtn.classList.toggle("visible", window.scrollY > 400);
}

window.addEventListener("scroll", toggleScrollTop, { passive: true });
scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
toggleScrollTop();

// ===== Header scroll shadow =====
const header = document.querySelector(".site-header");

function toggleHeaderShadow() {
  header.classList.toggle("scrolled", window.scrollY > 10);
}

window.addEventListener("scroll", toggleHeaderShadow, { passive: true });
toggleHeaderShadow();

// ===== Active nav link tracking =====
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".main-nav a");

function updateActiveNav() {
  const scrollY = window.scrollY + 120;
  let current = "";

  sections.forEach((section) => {
    if (section.offsetTop <= scrollY) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}` ||
        (current === "" && link.getAttribute("href") === "#top") ||
        (current === "top" && link.getAttribute("href") === "#top")) {
      link.classList.add("active");
    }
  });
}

window.addEventListener("scroll", updateActiveNav, { passive: true });
updateActiveNav();

// ===== Mobile menu toggle =====
const mobileToggle = document.getElementById("mobileToggle");
const mainNav = document.getElementById("mainNav");

if (mobileToggle && mainNav) {
  mobileToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    const isOpen = mainNav.classList.contains("open");
    const spans = mobileToggle.querySelectorAll("span");
    if (isOpen) {
      spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
      spans[1].style.opacity = "0";
      spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
    } else {
      spans[0].style.transform = "";
      spans[1].style.opacity = "1";
      spans[2].style.transform = "";
    }
  });

  // Close menu on link click
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      const spans = mobileToggle.querySelectorAll("span");
      spans[0].style.transform = "";
      spans[1].style.opacity = "1";
      spans[2].style.transform = "";
    });
  });
}

// ===== Scroll-triggered fade-in animations =====
function initScrollAnimations() {
  const targets = document.querySelectorAll(
    ".section-header, .about-text, .about-highlights, .highlight-card, " +
    ".modality-card, .stats-card, .split-table-wrap, .code-card, " +
    ".citation-block, .cta-inner, .section-quote blockquote"
  );

  targets.forEach((el) => el.classList.add("fade-up"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

// Add staggered delay to modality cards and highlight cards
function addStaggeredDelay() {
  document.querySelectorAll(".modality-grid .modality-card").forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.12}s`;
  });
  document.querySelectorAll(".about-highlights .highlight-card").forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.1}s`;
  });
}

// ===== Stats counter animation =====
function animateCounters() {
  const statItems = document.querySelectorAll(".stat-item strong");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const finalText = el.textContent;
          const finalNumber = parseInt(finalText.replace(/,/g, ""), 10);

          if (isNaN(finalNumber)) return;

          const duration = 1600;
          const startTime = performance.now();

          function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * finalNumber);
            el.textContent = current.toLocaleString();

            if (progress < 1) {
              requestAnimationFrame(tick);
            } else {
              el.textContent = finalText;
            }
          }

          requestAnimationFrame(tick);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  statItems.forEach((el) => observer.observe(el));
}

// ===== Reviewer access modal =====
function initReviewModal() {
  const modal = document.getElementById("reviewModal");
  const trigger = document.getElementById("reviewAccessTrigger");
  const closeButton = document.getElementById("reviewModalClose");
  const closeTargets = document.querySelectorAll("[data-review-close]");

  if (!modal || !trigger || !closeButton) {
    return;
  }

  const setModalState = (isOpen) => {
    modal.classList.toggle("is-open", isOpen);
    modal.setAttribute("aria-hidden", String(!isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  };

  trigger.addEventListener("click", () => {
    setModalState(true);
  });

  closeButton.addEventListener("click", () => {
    setModalState(false);
  });

  closeTargets.forEach((target) => {
    target.addEventListener("click", () => {
      setModalState(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      setModalState(false);
    }
  });
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  addStaggeredDelay();
  initScrollAnimations();
  animateCounters();
  initReviewModal();
});
