// ── Rate data table ───────────────────────────────────────────────────────
    const RATES = {
      'United States':         { domestic: 2.90, intl: 4.40, fixed: '$0.30',    code: 'US' },
      'Canada':                { domestic: 2.90, intl: 3.70, fixed: 'CA$0.30',  code: 'CA' },
      'European Union':        { domestic: 1.50, intl: 3.25, fixed: '€0.25',    code: 'EU' },
      'United Kingdom':        { domestic: 1.50, intl: 3.25, fixed: '£0.20',    code: 'GB' },
      'Australia':             { domestic: 1.70, intl: 3.50, fixed: 'A$0.30',   code: 'AU' },
      'New Zealand':           { domestic: 2.65, intl: 3.70, fixed: 'NZ$0.30',  code: 'NZ' },
      'Singapore':             { domestic: 3.40, intl: 3.90, fixed: 'S$0.50',   code: 'SG' },
      'Hong Kong':             { domestic: 3.40, intl: 3.90, fixed: 'HK$2.35',  code: 'HK' },
      'Japan':                 { domestic: 3.60, intl: 3.60, fixed: '¥0',       code: 'JP' },
      'United Arab Emirates':  { domestic: 2.90, intl: 3.90, fixed: 'AED 1.00', code: 'AE' },
      'Mexico':                { domestic: 3.60, intl: 4.10, fixed: 'MX$3.00',  code: 'MX' },
      'Norway':                { domestic: 2.40, intl: 3.25, fixed: 'kr 2.00',  code: 'NO' },
      'Switzerland':           { domestic: 2.90, intl: 3.25, fixed: 'CHF 0.30', code: 'CH' },
    };

    // Volume tier → percentage-point discount off both domestic + intl rates
    const DISCOUNTS = {
      'Up to $100k':   0.10,
      '$100k – $500k': 0.30,
      '$500k+':        0.50,
    };

    const countryOptions = Object.keys(RATES);
    const revenueOptions = Object.keys(DISCOUNTS);

    // ── State ─────────────────────────────────────────────────────────────────
    let countryPicked = false;
    let revenuePicked = false;
    let revealed      = false;

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const countryDD   = document.getElementById('countryDropdown');
    const revenueDD   = document.getElementById('revenueDropdown');
    const countryLbl  = document.getElementById('countryLabel');
    const revenueLbl  = document.getElementById('revenueLabel');
    const countryChev = document.getElementById('countryChevron');
    const revenueChev = document.getElementById('revenueChevron');
    const calcBtn     = document.getElementById('calcReveal');
    const calcLock    = document.getElementById('calcLockIcon');
    const calcArrow   = document.getElementById('calcArrowIcon');
    const calcBtnLbl  = document.getElementById('calcBtnLabel');
    const rateEmpty   = document.getElementById('rateEmpty');
    const rateResult  = document.getElementById('rateResult');
    const bottomGrid  = document.getElementById('calcBottomGrid');

    // ── Helpers ───────────────────────────────────────────────────────────────

    // Format a percentage cleanly: 2.80 → "2.8", 2.35 → "2.35", 0.10 → "0.1"
    function fmtPct(n) {
      return parseFloat(n.toFixed(2)).toString();
    }

    // Compute all display values for the current selection
    function computeRate() {
      const r    = RATES[countryLbl.textContent.trim()];
      const disc = DISCOUNTS[revenueLbl.textContent.trim()];
      return {
        code:        r.code,
        fixed:       r.fixed,
        stripedom:   r.domestic,
        stripeintl:  r.intl,
        yourdom:     r.domestic - disc,
        yourintl:    r.intl     - disc,
        discount:    disc,
      };
    }

    // Push computed values into all dynamic UI elements
    function populateUI() {
      const c = computeRate();

      // Main card — big rate display
      document.getElementById('rateBigPct').textContent   = fmtPct(c.yourdom);
      document.getElementById('rateBigFixed').textContent = '+ ' + c.fixed;

      // Main card — comparison stats
      document.getElementById('rateStripeStd').textContent = fmtPct(c.stripedom) + '% + ' + c.fixed;
      document.getElementById('rateSaving').textContent    = fmtPct(c.discount)  + '%';

      // Breakdown table — domestic row
      document.getElementById('tblDomLabel').textContent  = 'Domestic cards (' + c.code + ')';
      document.getElementById('tblDomStripe').textContent = fmtPct(c.stripedom) + '% + ' + c.fixed;
      document.getElementById('tblDomYours').textContent  = fmtPct(c.yourdom)   + '% + ' + c.fixed;

      // Breakdown table — international row
      document.getElementById('tblIntlStripe').textContent = fmtPct(c.stripeintl) + '% + ' + c.fixed;
      document.getElementById('tblIntlYours').textContent  = fmtPct(c.yourintl)   + '% + ' + c.fixed;
    }

    // Style an activated dropdown
    function activateDropdown(trigger, label, chevron) {
      trigger.style.border = '1px solid #e6ff32';
      label.style.color    = '#e6ff32';
      chevron.querySelector('path').setAttribute('stroke', '#e6ff32');
    }

    // Sync button label/style to current state
    function syncButton() {
      const ready = countryPicked && revenuePicked && !revealed;
      const done  = revealed;

      if (done) {
        calcBtn.disabled = false;
        calcBtn.style.cssText = 'background:#e6ff32; border:none; cursor:pointer;';
        calcLock.classList.add('hidden');
        calcArrow.classList.remove('hidden');
        calcBtnLbl.style.color   = 'black';
        calcBtnLbl.textContent   = 'Recalculate';
      } else if (ready) {
        calcBtn.disabled = false;
        calcBtn.style.cssText = 'background:#e6ff32; border:none; cursor:pointer; box-shadow:0 1px 1px rgba(0,0,0,0.05);';
        calcLock.classList.add('hidden');
        calcArrow.classList.remove('hidden');
        calcBtnLbl.style.color   = 'black';
        calcBtnLbl.textContent   = 'Reveal my rate';
      } else {
        calcBtn.disabled = true;
        calcBtn.style.cssText = 'background:#1e1e1e; border:1px solid #2e2e2e; cursor:not-allowed;';
        calcLock.classList.remove('hidden');
        calcArrow.classList.add('hidden');
        calcBtnLbl.style.color   = '#4a4a4a';
        calcBtnLbl.textContent   = (countryPicked || revenuePicked) ? 'Select one more' : 'Select both to unlock';
      }
    }

    // Fade-in animation helper
    function fadeIn(el, display, delay = 0) {
      el.style.display    = display;
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(12px)';
      el.style.transition = 'none';
      el.getBoundingClientRect(); // force reflow
      el.style.transition = `opacity 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}ms`;
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }

    // ── Reveal sequence ───────────────────────────────────────────────────────
    function runReveal() {
      // Calculate and populate before animating
      populateUI();

      revealed = true;
      syncButton();

      // 1. Fade out placeholder
      rateEmpty.style.transition = 'opacity 0.18s ease';
      rateEmpty.style.opacity    = '0';

      // 2. Fade in rate result
      setTimeout(() => {
        rateEmpty.style.display = 'none';
        fadeIn(rateResult, 'flex');
      }, 180);

      // 3. Fade in bottom grid with staggered cards
      setTimeout(() => {
        bottomGrid.style.display    = 'grid';
        bottomGrid.style.opacity    = '0';
        bottomGrid.style.transform  = 'translateY(16px)';
        bottomGrid.style.transition = 'none';
        bottomGrid.getBoundingClientRect();
        bottomGrid.style.transition = 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)';
        bottomGrid.style.opacity    = '1';
        bottomGrid.style.transform  = 'translateY(0)';

        const cards = bottomGrid.querySelectorAll(':scope > div');
        cards.forEach((card, i) => {
          card.style.opacity    = '0';
          card.style.transform  = 'translateY(14px)';
          card.style.transition = `opacity 0.45s cubic-bezier(0.22,1,0.36,1) ${60 + i * 80}ms, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${60 + i * 80}ms`;
          card.getBoundingClientRect();
          card.style.opacity   = '1';
          card.style.transform = 'translateY(0)';
        });

        setTimeout(() => bottomGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
      }, 350);
    }

    // ── Reset for recalculate ─────────────────────────────────────────────────
    function runReset() {
      revealed = false;
      rateResult.style.display  = 'none';
      bottomGrid.style.display  = 'none';
      rateEmpty.style.opacity   = '1';
      rateEmpty.style.display   = 'flex';
      syncButton();
    }

    // ── Generic dropdown builder ──────────────────────────────────────────────
    function buildDropdown(trigger, label, chevron, options, onSelect) {
      let menuEl = null;

      function openMenu() {
        if (menuEl) return;
        menuEl = document.createElement('div');
        menuEl.style.cssText = 'position:absolute;top:calc(100% + 8px);left:0;z-index:200;background:#1a1a1a;border:1px solid rgba(230,255,50,0.25);border-radius:1rem;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,0.65);min-width:100%;';
        const current = label.textContent.trim();
        options.forEach(opt => {
          const row = document.createElement('div');
          row.textContent = opt;
          row.style.cssText = `padding:9px 20px;font-family:var(--font-heading);color:#e6ff32;cursor:pointer;font-size:20px;white-space:nowrap;background:${opt === current ? 'rgba(230,255,50,0.09)' : 'transparent'};`;
          row.addEventListener('mouseenter', () => { row.style.background = 'rgba(230,255,50,0.14)'; });
          row.addEventListener('mouseleave', () => { row.style.background = opt === current ? 'rgba(230,255,50,0.09)' : 'transparent'; });
          row.addEventListener('click', e => {
            e.stopPropagation();
            label.textContent = opt;
            closeMenu();
            onSelect(opt);
          });
          menuEl.appendChild(row);
        });
        trigger.appendChild(menuEl);
      }

      function closeMenu() {
        if (menuEl) { menuEl.remove(); menuEl = null; }
      }

      trigger.addEventListener('click', e => { e.stopPropagation(); menuEl ? closeMenu() : openMenu(); });
      document.addEventListener('click', closeMenu);
    }

    // ── Wire up dropdowns ─────────────────────────────────────────────────────
    buildDropdown(countryDD, countryLbl, countryChev, countryOptions, () => {
      countryPicked = true;
      activateDropdown(countryDD, countryLbl, countryChev);
      if (revealed) runReset();
      syncButton();
    });

    buildDropdown(revenueDD, revenueLbl, revenueChev, revenueOptions, () => {
      revenuePicked = true;
      activateDropdown(revenueDD, revenueLbl, revenueChev);
      if (revealed) runReset();
      syncButton();
    });

    // ── Reveal / recalculate button ───────────────────────────────────────────
    calcBtn.addEventListener('click', () => {
      if (!countryPicked || !revenuePicked) return;
      if (revealed) { runReset(); } else { runReveal(); }
    });