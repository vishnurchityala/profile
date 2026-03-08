(function () {
  const MOBILE_BREAKPOINT = 640;
  const navBars = Array.from(document.querySelectorAll('.nav-bar'));

  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  navBars.forEach((navBar, index) => {
    const toggle = navBar.querySelector('.nav-toggle');
    const links = navBar.querySelector('.nav-links');

    if (!toggle || !links) {
      return;
    }

    if (!links.id) {
      links.id = 'site-nav-links-' + index;
      toggle.setAttribute('aria-controls', links.id);
    }

    function closeMenu() {
      navBar.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    function openMenu() {
      navBar.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    function syncMode() {
      if (isMobile()) {
        navBar.classList.add('is-collapsible');
        closeMenu();
      } else {
        navBar.classList.remove('is-collapsible');
        navBar.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    }

    toggle.addEventListener('click', function () {
      if (!navBar.classList.contains('is-open')) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (isMobile()) {
          closeMenu();
        }
      });
    });

    document.addEventListener('click', function (event) {
      if (!isMobile()) {
        return;
      }

      if (!navBar.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });

    window.addEventListener('resize', syncMode);
    syncMode();
  });
}());
