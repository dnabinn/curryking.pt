/* ================================================================
   CURRY KING & GRILL — Main Script
   Features:
     1. Sticky navigation with scroll detection
     2. Mobile menu toggle
     3. Scroll-reveal animations (IntersectionObserver)
     4. Menu category filter
     5. Floating Reserve button visibility
     6. Reservation form validation
     7. Set minimum date to today
================================================================ */

(function () {
    'use strict';

    /* ----------------------------------------------------------
       1. NAVIGATION — add .scrolled class after scrolling 60px
    ---------------------------------------------------------- */
    const nav       = document.getElementById('nav');
    const floatBtn  = document.getElementById('floatBtn');

    function onScroll() {
        const scrolled = window.scrollY > 60;
        nav.classList.toggle('scrolled', scrolled);

        // Show floating button after scrolling past the hero (roughly 80vh)
        const heroHeight = window.innerHeight * 0.8;
        floatBtn.classList.toggle('visible', window.scrollY > heroHeight);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load in case page is already scrolled


    /* ----------------------------------------------------------
       2. MOBILE NAV TOGGLE
    ---------------------------------------------------------- */
    const navToggle = document.getElementById('navToggle');
    const navLinks  = document.getElementById('navLinks');

    navToggle.addEventListener('click', function () {
        const isOpen = navLinks.classList.toggle('open');
        navToggle.classList.toggle('open', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen);
        // Prevent body scroll when drawer is open
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close drawer when a link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navLinks.classList.remove('open');
            navToggle.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });

    // Close drawer on outside click
    document.addEventListener('click', function (e) {
        if (navLinks.classList.contains('open') &&
            !navLinks.contains(e.target) &&
            !navToggle.contains(e.target)) {
            navLinks.classList.remove('open');
            navToggle.classList.remove('open');
            document.body.style.overflow = '';
        }
    });


    /* ----------------------------------------------------------
       3. SCROLL-REVEAL ANIMATIONS
       Elements with class .reveal fade up when they enter viewport
    ---------------------------------------------------------- */
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after reveal so it doesn't re-trigger
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(function (el) {
        revealObserver.observe(el);
    });


    /* ----------------------------------------------------------
       4. MENU CATEGORY FILTER
    ---------------------------------------------------------- */
    const filterBtns = document.querySelectorAll('.menu__filter');
    const menuItems  = document.querySelectorAll('.menu__item');

    filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const filter = btn.getAttribute('data-filter');

            // Update active button state
            filterBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');

            // Show / hide menu items
            menuItems.forEach(function (item) {
                const category = item.getAttribute('data-category');
                const show = filter === 'all' || category === filter;
                item.classList.toggle('hidden', !show);

                // Re-trigger reveal animation for newly shown items
                if (show) {
                    item.classList.remove('visible');
                    // Small delay so CSS transition fires correctly
                    requestAnimationFrame(function () {
                        item.classList.add('visible');
                    });
                }
            });
        });
    });


    /* ----------------------------------------------------------
       5. FLOATING BUTTON — scroll to reservation
    ---------------------------------------------------------- */
    floatBtn.addEventListener('click', function () {
        document.getElementById('reservation').scrollIntoView({ behavior: 'smooth' });
    });


    /* ----------------------------------------------------------
       6. RESERVATION FORM — validation & submission
    ---------------------------------------------------------- */
    const form = document.getElementById('reservationForm');

    // Set minimum date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // Validation rules map: fieldId → { errorId, validate fn }
    const validations = {
        fname: {
            errorId: 'fnameError',
            validate: function (v) { return v.trim().length >= 2; }
        },
        phone: {
            errorId: 'phoneError',
            validate: function (v) { return /^[+\d\s\-().]{7,20}$/.test(v.trim()); }
        },
        guests: {
            errorId: 'guestsError',
            validate: function (v) { return v !== ''; }
        },
        date: {
            errorId: 'dateError',
            validate: function (v) {
                if (!v) return false;
                return new Date(v) >= new Date(new Date().toDateString());
            }
        },
        time: {
            errorId: 'timeError',
            validate: function (v) { return v !== ''; }
        }
    };

    // Helper: show or clear error for a field
    function setError(fieldId, hasError) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(validations[fieldId].errorId);
        if (!field || !errorEl) return;

        // Input or the select inside .select-wrap
        const input = field.tagName === 'SELECT' ? field : field;
        input.classList.toggle('has-error', hasError);
        errorEl.classList.toggle('visible', hasError);
    }

    // Validate all fields, return true if form is valid
    function validateAll() {
        let valid = true;
        Object.keys(validations).forEach(function (fieldId) {
            const field = document.getElementById(fieldId);
            if (!field) return;
            const ok = validations[fieldId].validate(field.value);
            setError(fieldId, !ok);
            if (!ok) valid = false;
        });
        return valid;
    }

    // Live validation — clear error as user types / changes
    Object.keys(validations).forEach(function (fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        const eventType = (field.tagName === 'SELECT' || field.type === 'date') ? 'change' : 'input';
        field.addEventListener(eventType, function () {
            const ok = validations[fieldId].validate(field.value);
            setError(fieldId, !ok);
        });
    });

    // Form submit handler
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!validateAll()) {
            // Scroll to the first error
            const firstError = form.querySelector('.has-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }

        // Success — show toast and reset form
        showToast();
        form.reset();

        // Clear all error states after reset
        Object.keys(validations).forEach(function (fieldId) {
            setError(fieldId, false);
        });
    });


    /* ----------------------------------------------------------
       7. TOAST NOTIFICATION
    ---------------------------------------------------------- */
    const toast = document.getElementById('toast');

    function showToast() {
        toast.classList.add('show');
        setTimeout(function () {
            toast.classList.remove('show');
        }, 4500);
    }


    /* ----------------------------------------------------------
       8. SMOOTH SCROLL for all anchor links (fallback for older
          browsers that don't support CSS scroll-behavior)
    ---------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });


})();
