/* Visionbotix — shared behaviour */
(function () {
  "use strict";

  // sticky nav state
  var nav = document.querySelector(".nav");
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      toggle.classList.toggle("open");
      links.classList.toggle("open");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        toggle.classList.remove("open");
        links.classList.remove("open");
      }
    });
  }

  // scroll-reveal
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("in");
    });
  }

  // contact form -> opens the visitor's mail client with a prefilled message
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("[name=name]").value.trim();
      var email = form.querySelector("[name=email]").value.trim();
      var topicEl = form.querySelector("[name=topic]");
      var topic = topicEl ? topicEl.value : "General";
      var message = form.querySelector("[name=message]").value.trim();
      var subject = "[" + topic + "] Inquiry from " + name;
      var body = message + "\n\n— " + name + " (" + email + ")";
      window.location.href =
        "mailto:info@visionbotix.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
    });
  }

  // current year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
