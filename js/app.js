document.addEventListener("DOMContentLoaded", () => {
  const SETTINGS_KEY = "spwd_settings";
  let fslLibraryCache = []; // Cache for FSL videos
  const defaults = {
    largeText: false,
    highContrast: false,
    voice: false,
    reducedMotion: false,
    screenReader: false,
    simpleInterface: false,
    focusRing: false,
    signLanguage: false,
    darkMode: false,
    language: "English",
    signTarget: "FSL",
    signLayout: "pip",
    signTopic: "Smart PWD ID — Republic of the Philippines Digital Accessibility Walkthrough (QR • NFC • Expiration • Accessibility • Mobile)",
    signFormat: "MP4",
    signVideoPath: "C:\\Videos\\smart-pwd-id-landing-walkthrough.mp4",
    signSrtPath: "smart-pwd-id-landing-walkthrough.srt",
    signTimestamps: [
      { t: "00:00", label: "Hero banner — REPUBLIC OF THE PHILIPPINES • DIGITAL ACCESSIBILITY, headline 'Development of a Smart PWD ID System Using QR and NFC for Discount Verification and Website Authentication' + CTAs Open Web Portal / Explore Mobile App", critical: true },
      { t: "00:35", label: "Feature highlights row — ✓ QR Verification, ✓ NFC Ready, ✓ Expiration Check, ✓ Accessibility First + CONNECTED SERVICES cards (▦ QR Verification / ◉ NFC Verification / ◷ Expiration Check / Accessibility)", critical: true },
      { t: "01:50", label: "BENEFITS section — 💊 Pharmacy 20% discount & VAT-exempt, 🍽️ Restaurant eligibility, 🚌 Transportation benefits + 'academic prototype' disclaimer", critical: false },
      { t: "03:10", label: "SMART PWD ID MOBILE section — 6 checkmarks: Digital PWD ID / QR&NFC / Expiration alerts / Benefits wallet / Verification history / Accessibility controls, plus App Store and Google Play Coming Soon", critical: false },
      { t: "04:25", label: "Digital Smart PWD ID card (KEN MIJAY A. ESPIRITU, ACTIVE • 08/12/2031) and mobile phone mockup (Good day Ken, ID ACTIVE, PWD ID 2026 •••• 4821 VALID UNTIL Aug 12, 2031) + ▦ QR Verify / ◉ NFC Tap to verify actions", critical: true }
    ],
    signSafeZone: { top: 8, left: 72, right: 6, bottom: 18 },
    signOutput: { resolution: "1080p", embedded: true }
  };

  function loadSettings() {
    try {
      const settings = Object.assign({}, defaults, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
      settings.language = settings.language === "Filipino" ? "Filipino" : "English";
      return settings;
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  const filipinoSettings = {
    "Accessibility Settings": "Mga Setting ng Accessibility",
    "Personalize your Smart PWD ID experience for full inclusion": "Iangkop ang Smart PWD ID sa iyong mga pangangailangan",
    "Close settings": "Isara ang mga setting",
    "Account": "Account",
    "Vision": "Paningin",
    "Hearing": "Pandinig",
    "Motor & Input": "Paggalaw at Pag-input",
    "Cognitive": "Pag-unawa",
    "Language": "Wika",
    "Choose the website language": "Piliin ang wika ng website",
    "Select language": "Pumili ng wika",
    "Your choice is saved on this device.": "Naka-save sa device na ito ang iyong piniling wika.",
    "Personal Settings": "Mga Personal na Setting",
    "First Name": "Pangalan",
    "Last Name": "Apelyido",
    "Mobile Number": "Numero ng Cellphone",
    "Email Address": "Email Address",
    "Email address cannot be changed.": "Hindi maaaring baguhin ang email address.",
    "Save Changes": "I-save ang mga Pagbabago",
    "Change Password": "Palitan ang Password",
    "Current Password": "Kasalukuyang Password",
    "New Password": "Bagong Password",
    "Confirm New Password": "Kumpirmahin ang Bagong Password",
    "Use at least 6 characters.": "Gumamit ng hindi bababa sa 6 na character.",
    "Update Password": "I-update ang Password",
    "Show": "Ipakita",
    "Hide": "Itago",
    "Show password": "Ipakita ang password",
    "Hide password": "Itago ang password",
    "Large Text": "Malaking Teksto",
    "Increase readable text size across the whole site": "Lakihan ang teksto sa buong website upang madaling mabasa",
    "Toggle large text": "I-on o i-off ang malaking teksto",
    "High Contrast": "Mataas na Contrast",
    "Dark / bold color scheme for better visual clarity": "Gumamit ng mas matingkad na mga kulay para mas malinaw makita",
    "Toggle high contrast": "I-on o i-off ang mataas na contrast",
    "Visible Focus Ring": "Malinaw na Balangkas ng Focus",
    "Always show bright focus outline when tabbing": "Ipakita ang malinaw na balangkas kapag ginagamit ang Tab",
    "Toggle focus ring": "I-on o i-off ang balangkas ng focus",
    "Dark Mode": "Madilim na Tema",
    "Switch the whole interface to a comfortable dark theme": "Gumamit ng madilim na tema na komportable sa mata",
    "Toggle dark mode": "I-on o i-off ang madilim na tema",
    "Reduced Motion": "Bawas na Galaw",
    "Minimize animations, transitions and parallax": "Bawasan ang mga animation, transition at gumagalaw na background",
    "Toggle reduced motion": "I-on o i-off ang pagbawas ng galaw",
    "Sign Language Overlay": "Overlay ng Sign Language",
    "Configure a digital signer overlay for post-production platforms (SignStudio, Adobe Premiere, overlay editors).": "I-configure ang overlay ng digital signer para sa mga platform ng pag-edit ng video (SignStudio, Adobe Premiere, mga overlay editor).",
    "Toggle sign language overlay": "I-on o i-off ang overlay ng sign language",
    "Visual Alerts": "Mga Biswal na Abiso",
    "Replace audio beeps with flashing visual notifications": "Palitan ang mga tunog ng kumikislap na biswal na abiso",
    "Toggle visual alerts": "I-on o i-off ang mga biswal na abiso",
    "Transcript Captions": "Mga Caption",
    "Display text captions for any voice / video content": "Ipakita ang mga caption para sa nilalamang audio o video",
    "Toggle live captions": "I-on o i-off ang mga live caption",
    "Voice Assistance": "Tulong na Boses",
    "Read buttons, links and alerts aloud automatically": "Awtomatikong basahin nang malakas ang mga button, link at abiso",
    "Toggle voice assistance": "I-on o i-off ang tulong na boses",
    "Larger Tap Targets": "Mas Malalaking Button",
    "Increase button sizes for easier tapping / clicking": "Lakihan ang mga button para mas madaling i-tap o i-click",
    "Toggle larger tap targets": "I-on o i-off ang mas malalaking button",
    "Screen Reader Mode": "Mode ng Screen Reader",
    "Add ARIA landmarks, skip link and semantic labels": "Magdagdag ng mga ARIA landmark, skip link at label para sa screen reader",
    "Toggle screen reader mode": "I-on o i-off ang mode ng screen reader",
    "Simple Interface": "Simpleng Interface",
    "Hide decorative visuals, keep only core controls": "Itago ang mga dekorasyon at panatilihin ang mahahalagang kontrol",
    "Toggle simple interface": "I-on o i-off ang simpleng interface",
    "Plain Language": "Payak na Pananalita",
    "Simplify copy and highlight the most important info": "Pasimplehin ang teksto at bigyang-diin ang pinakamahalagang impormasyon",
    "Toggle plain language": "I-on o i-off ang payak na pananalita",
    "Read Aloud \u2014 Page Content": "Basahin nang Malakas ang Pahina",
    "Read all visible headings and paragraphs right now": "Basahin ngayon ang lahat ng nakikitang pamagat at talata",
    "Read page content aloud": "Basahin nang malakas ang nilalaman ng pahina",
    "Reset All to Defaults": "Ibalik ang Lahat sa Default",
    "Tip: Press": "Tip: Pindutin ang",
    "anytime to re-open Accessibility Settings.": "anumang oras upang buksan muli ang mga setting ng accessibility."
  };

  // The same language preference now applies to every portal page and to
  // content added later by API responses, dialogs and notifications.
  function applySettingsLanguage(panel, language) {
    if (window.SmartPWDLanguage) window.SmartPWDLanguage.setLanguage(language);
  }

  const appScript = document.querySelector('script[src$="js/app.js"]');
  const languageScript = document.createElement("script");
  languageScript.src = new URL("language.js", appScript ? appScript.src : new URL("js/app.js", location.href)).href;
  languageScript.onload = () => window.SmartPWDLanguage.start(loadSettings().language, filipinoSettings);
  languageScript.onerror = () => console.error("Could not load website translations. Refresh the page to try again.");
  document.head.appendChild(languageScript);

  // Fetch FSL library from Supabase and cache it
  async function initFSLData() {
    // Clips dropped into public/fsl-videos/ are named after the sentence they
    // translate. They are listed first so a dropped file always wins over any
    // older library row for the same sentence.
    const local = await loadLocalFSLVideos();
    let remote = [];
    if (typeof supabase !== 'undefined' && typeof supabase.from === 'function') {
      // Only fetch what the player needs: sentence and video_url
      const { data, error } = await supabase.from('fsl_library').select('sentence, video_url');
      if (error) console.error('Failed to load FSL library for player:', error);
      else remote = data || [];
    }
    fslLibraryCache = local.concat(remote);
  }

  async function loadLocalFSLVideos() {
    try {
      const res = await fetch('/api/fsl-videos', { cache: 'no-store' });
      if (!res.ok) return [];
      const body = await res.json();
      return Array.isArray(body.videos) ? body.videos : [];
    } catch (e) {
      return [];
    }
  }
  /**
   * Parses the payload of a JWT token without verifying its signature.
   * This is safe for client-side use to read claims like email or role.
   * @param {string} token The JWT token.
   * @returns {object|null} The decoded payload object or null if invalid.
   */
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) { return null; }
  }

  function saveSettings(s) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch (e) {}
  }

  function toggleFSLVideoPlayer(show) {
    // ----- NEW: Control FSL Video Library PiP player + sentence interactivity -----
    (function () {
      const on = !!show;
      try {
        const html = document.documentElement;
        html.classList.toggle("fsl-overlay-disabled", !on);
      } catch (_) {}

      const pipAPI = window.FSLPip;
      const root = document.getElementById("fsl-pip");
      if (root) {
        if (!on) {
          root.classList.add("hidden");
          root.classList.add("fsl-api-disabled");
          const v = root.querySelector("#fsl-pip-video");
          if (v) try { v.pause(); } catch (_) {}
          try { localStorage.setItem("fsl_pip_hidden", "1"); } catch (_) {}
        } else {
          root.classList.remove("hidden");
          root.classList.remove("fsl-api-disabled");
          try { localStorage.removeItem("fsl_pip_hidden"); } catch (_) {}
          if (pipAPI && typeof pipAPI.show === "function") try { pipAPI.show(); } catch (_) {}
        }
      }
      if (pipAPI && typeof pipAPI.setEnabled === "function") {
        try { pipAPI.setEnabled(on, { announce: false }); } catch (_) {}
      } else if (pipAPI) {
        // fallback to show/hide if newer API method not present yet
        try {
          if (on && typeof pipAPI.show === "function") pipAPI.show();
          else if (!on && typeof pipAPI.hide === "function") pipAPI.hide();
        } catch (_) {}
      }
      // Retry once if FSL IIFE hasn't initialized yet (page load order)
      if (!pipAPI && root == null) {
        let retries = 0;
        const tryLater = function () {
          retries++;
          const api = window.FSLPip;
          const rt = document.getElementById("fsl-pip");
          if (api || rt) {
            toggleFSLVideoPlayer(show);
          } else if (retries < 30) {
            setTimeout(tryLater, 60);
          }
        };
        setTimeout(tryLater, 30);
      }
    })();
  }

  function applySettings(s) {
    const cls = document.body.classList;
    cls.toggle("large-text", !!s.largeText);
    cls.toggle("high-contrast", !!s.highContrast);
    cls.toggle("reduced-motion", !!s.reducedMotion);
    cls.toggle("simple-interface", !!s.simpleInterface);
    cls.toggle("focus-ring", !!s.focusRing);
    cls.toggle("screen-reader", !!s.screenReader);
    cls.toggle("dark-mode", !!s.darkMode);
    cls.toggle("large-taps", !!s.largeTaps);
    cls.toggle("visual-alerts", !!s.visualAlerts);
    cls.toggle("captions", !!s.captions);
    cls.toggle("plain-language", !!s.plainLanguage);
    toggleSignLanguageWidget(!!s.signLanguage);
    toggleFSLVideoPlayer(!!s.signLanguage);
    const panel = document.getElementById("settingsPanel");
    if (panel) applySettingsLanguage(panel, s.language);
  }

  function speak(text) {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const translated = window.SmartPWDLanguage ? window.SmartPWDLanguage.translate(text) : text;
      const u = new SpeechSynthesisUtterance(translated);
      u.lang = loadSettings().language === "Filipino" ? "fil-PH" : "en-PH";
      u.rate = 0.95;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    }
  }

  function toggleSignLanguageWidget(show) {
    // Legacy SignBridge + Digital Signer Overlays: REMOVED (per user request).
    // Hearing → Sign Language Overlay switch now controls ONLY the new
    // FSL Video Library PiP + sentence player, wired via toggleFSLVideoPlayer().
    // Clean up any lingering legacy DOM that may have been cached or injected before
    // this version of the script loaded (defensive unmount):
    try {
      ["signLanguageWidget", "signbridge"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { el.style.display = "none"; el.hidden = true; el.remove(); }
      });
    } catch (_) {}
  }

  const settings = loadSettings();
  applySettings(settings);

  // Add skip link for screen-reader mode
  if (!document.getElementById("skipLink")) {
    const skip = document.createElement("a");
    skip.id = "skipLink";
    skip.href = "#main";
    skip.className = "skip-link";
    skip.textContent = "Skip to main content";
    document.body.prepend(skip);
  }
  const main = document.querySelector("main");
  if (main && !main.id) main.id = "main";

  document.body.classList.add("page-enter");

  // Smooth page leave transitions
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const h = a.getAttribute("href");
    if (!h || h.startsWith("#") || h.startsWith("mailto:") || h.startsWith("tel:") || a.target === "_blank") return;
    let u;
    try { u = new URL(h, location.href); } catch { return; }
    if (u.origin !== location.origin || u.pathname === location.pathname) return;
    e.preventDefault();
    document.body.classList.add("page-leave");
    setTimeout(() => location.href = u.href, 220);
  });

  // Coming soon buttons
  document.querySelectorAll("[data-coming]").forEach(b => b.onclick = () => {
    const msg = "Mobile app store listing: coming soon. The website is ready for iOS / Android app integration.";
    alert(msg);
    if (loadSettings().voice) speak(msg);
  });

  // Read interactive elements aloud when voice is on
  document.addEventListener("click", e => {
    if (!loadSettings().voice) return;
    const t = e.target.closest("button, a, [role='button']");
    if (!t) return;
    const label = t.getAttribute("aria-label") || t.textContent.trim().split(/\s+/).slice(0, 8).join(" ");
    if (label && label.length < 200) speak(label);
  });

  // Global password visibility toggle
  document.body.addEventListener("click", function (e) {
    const toggle = e.target.closest("[data-password-toggle]");
    if (!toggle) return;
    const input = document.getElementById(toggle.dataset.passwordToggle);
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.textContent = show ? "Hide" : "Show";
    toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    toggle.setAttribute("aria-pressed", String(show));
    const panel = toggle.closest("#settingsPanel");
    if (panel) applySettingsLanguage(panel, loadSettings().language);
  });

  // Settings trigger
  // Note: This is a global handler. Page-specific handlers for this are redundant.
  document.addEventListener("click", e => {
    if (e.target.closest("[data-access]")) openSettings();
  });

  // Keyboard shortcut: Alt+S opens settings
  document.addEventListener("keydown", e => {
    if (e.altKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      openSettings();
    }
  });

  // Reveal on scroll
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".reveal").forEach(el => {
    revealObserver.observe(el);
  });

  // Initialize FSL data cache
  initFSLData();

  // --- ACCESSIBILITY SETTINGS PANEL ---

  function openSettings() {
    if (document.getElementById("settingsPanel")) return;

    const onDashboard = window.location.pathname.includes('dashboard.html');
    const approvedView = document.getElementById('approved-view');
    const isApprovedUser = onDashboard && approvedView && !approvedView.hidden;

    const backdrop = document.createElement("div");
    backdrop.className = "settings-backdrop";
    backdrop.id = "settingsBackdrop";

    const p = document.createElement("div");
    p.id = "settingsPanel";
    p.className = "settings-panel";
    p.setAttribute("role", "dialog");
    p.setAttribute("aria-modal", "true");
    p.setAttribute("aria-labelledby", "settingsTitle");

    p.innerHTML = `
      <div class="sp-head">
        <div>
          <div class="sp-title" id="settingsTitle">Accessibility Settings</div>
          <div class="sp-sub">Personalize your Smart PWD ID experience for full inclusion</div>
        </div>
        <button class="sp-close" id="settingsClose" aria-label="Close settings">×</button>
      </div>

      <div class="sp-tabs">
        ${isApprovedUser ? '<button class="sp-tab active" data-sptab="account">Account</button>' : ''}
        <button class="sp-tab ${isApprovedUser ? '' : 'active'}" data-sptab="vision">Vision</button>
        <button class="sp-tab" data-sptab="hearing">Hearing</button>
        <button class="sp-tab" data-sptab="motor">Motor &amp; Input</button>
        <button class="sp-tab" data-sptab="cognitive">Cognitive</button>
        <button class="sp-tab" data-sptab="language">Language</button>
      </div>

      <div class="sp-panes">
        ${isApprovedUser ? `
        <div class="sp-pane active" data-spane="account">

          <form id="personal-settings-form" novalidate>
            <h3 class="form-section-heading">Personal Settings</h3>
            <div class="formgrid">
              <div class="form-group">
                <label for="setting-first-name">First Name</label>
                <input type="text" id="setting-first-name" autocomplete="given-name">
              </div>
              <div class="form-group">
                <label for="setting-last-name">Last Name</label>
                <input type="text" id="setting-last-name" autocomplete="family-name">
              </div>
              <div class="form-group">
                <label for="setting-mobile">Mobile Number</label>
                <input type="tel" id="setting-mobile" autocomplete="tel">
              </div>
              <div class="form-group">
                <label for="setting-email">Email Address</label>
                <input type="email" id="setting-email" autocomplete="email" disabled>
                <small class="field-hint">Email address cannot be changed.</small>
              </div>
            </div>
            <div class="form-actions"><button type="submit" class="btn primary">Save Changes</button></div>
          </form>

          <form id="security-settings-form" novalidate>
            <h3 class="form-section-heading">Change Password</h3>
            <div class="form-group">
              <label for="current-password">Current Password</label>
              <div class="password-field">
                <input type="password" id="current-password" autocomplete="current-password" required>
                <button type="button" class="password-toggle" data-password-toggle="current-password" aria-label="Show password">Show</button>
              </div>
            </div>
            <div class="formgrid">
              <div class="form-group">
                <label for="new-password">New Password</label>
                <div class="password-field">
                  <input type="password" id="new-password" autocomplete="new-password" minlength="6" required>
                  <button type="button" class="password-toggle" data-password-toggle="new-password" aria-label="Show password">Show</button>
                </div>
                <small class="field-hint">Use at least 6 characters.</small>
              </div>
              <div class="form-group">
                <label for="confirm-password">Confirm New Password</label>
                <div class="password-field">
                  <input type="password" id="confirm-password" autocomplete="new-password" required>
                  <button type="button" class="password-toggle" data-password-toggle="confirm-password" aria-label="Show password">Show</button>
                </div>
              </div>
            </div>
            <div id="password-change-message" class="login-message" role="alert" aria-live="polite"></div>
            <div class="form-actions"><button type="submit" class="btn primary">Update Password</button></div>
          </form>

        </div>` : ''}

        <div class="sp-pane ${isApprovedUser ? '' : 'active'}" data-spane="vision">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <b>Large Text</b>
                <small>Increase readable text size across the whole site</small>
              </div>
            </div>
            <button class="switch" id="largeToggle" aria-label="Toggle large text"><i></i></button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <b>High Contrast</b>
                <small>Dark / bold color scheme for better visual clarity</small>
              </div>
            </div>
            <button class="switch" id="contrastToggle" aria-label="Toggle high contrast"><i></i></button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <b>Visible Focus Ring</b>
                <small>Always show bright focus outline when tabbing</small>
              </div>
            </div>
            <button class="switch" id="focusToggle" aria-label="Toggle focus ring"><i></i></button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <b>Dark Mode</b>
                <small>Switch the whole interface to a comfortable dark theme</small>
              </div>
            </div>
            <button class="switch" id="darkToggle" aria-label="Toggle dark mode"><i></i></button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <b>Reduced Motion</b>
                <small>Minimize animations, transitions and parallax</small>
              </div>
            </div>
            <button class="switch" id="motionToggle" aria-label="Toggle reduced motion"><i></i></button>
          </div>
        </div>

        <div class="sp-pane" data-spane="hearing">
          <div class="setting-row" style="flex-direction:column; align-items:flex-start; gap:16px; padding-bottom:12px;">
            <div class="setting-info" style="width:100%;">
              <span class="setting-icon">🤟</span>
              <div style="flex:1;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                  <div>
                    <b>Sign Language Overlay</b>
                    <small>Configure a digital signer overlay for post-production platforms (SignStudio, Adobe Premiere, overlay editors).</small>
                  </div>
                  <button class="switch" id="signToggle" aria-label="Toggle sign language overlay"><i></i></button>
                </div>
              </div>
            </div>

            <div id="signConfig" style="width:100%; display:none;"></div>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚡</span>
              <div>
                <b>Visual Alerts</b>
                <small>Replace audio beeps with flashing visual notifications</small>
              </div>
            </div>
            <button class="switch" id="alertToggle" aria-label="Toggle visual alerts"><i></i></button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">💬</span>
              <div>
                <b>Transcript Captions</b>
                <small>Display text captions for any voice / video content</small>
              </div>
            </div>
            <button class="switch" id="captionToggle" aria-label="Toggle live captions"><i></i></button>
          </div>
        </div>

        <div class="sp-pane" data-spane="motor">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <b>Voice Assistance</b>
                <small>Read buttons, links and alerts aloud automatically</small>
              </div>
            </div>
            <button class="switch" id="voiceToggle" aria-label="Toggle voice assistance"><i></i></button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <b>Larger Tap Targets</b>
                <small>Increase button sizes for easier tapping / clicking</small>
              </div>
            </div>
            <button class="switch" id="tapToggle" aria-label="Toggle larger tap targets"><i></i></button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <b>Screen Reader Mode</b>
                <small>Add ARIA landmarks, skip link and semantic labels</small>
              </div>
            </div>
            <button class="switch" id="screenToggle" aria-label="Toggle screen reader mode"><i></i></button>
          </div>
        </div>

        <div class="sp-pane" data-spane="cognitive">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <b>Simple Interface</b>
                <small>Hide decorative visuals, keep only core controls</small>
              </div>
            </div>
            <button class="switch" id="simpleToggle" aria-label="Toggle simple interface"><i></i></button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <b>Plain Language</b>
                <small>Simplify copy and highlight the most important info</small>
              </div>
            </div>
            <button class="switch" id="plainToggle" aria-label="Toggle plain language"><i></i></button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <b>Read Aloud — Page Content</b>
                <small>Read all visible headings and paragraphs right now</small>
              </div>
            </div>
            <button class="switch" id="readToggle" aria-label="Read page content aloud"><i></i></button>
          </div>
        </div>

        <div class="sp-pane" data-spane="language">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-icon">⚙</span>
              <div>
                <label for="langSelect"><b>Language</b></label>
                <small>Choose the website language</small>
              </div>
            </div>
            <select class="setting-select" id="langSelect" aria-label="Select language">
              <option value="English" lang="en">English</option>
              <option value="Filipino" lang="fil">Filipino</option>
            </select>
          </div>
          <p class="sp-sub" id="languageStatus" role="status" aria-live="polite">Your choice is saved on this device.</p>
        </div>
      </div>

      <button class="settings-reset" id="settingsReset">Reset All to Defaults</button>
      <div class="sp-hint-row">
        <small>Tip: Press <kbd>Alt</kbd> + <kbd>S</kbd> anytime to re-open Accessibility Settings.</small>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(p);

    // Handle account settings if user is signed in (works on any page, not just dashboard)
    // NOTE: currentUser() is async, so hydrate the form lazily after resolution.
    (async function hydrateCurrentSignedIn() {
      let currentSignedIn = null;
      try {
        currentSignedIn = (typeof SmartPWDAuth !== "undefined" && SmartPWDAuth.currentUser)
          ? (await SmartPWDAuth.currentUser())
          : null;
      } catch (_) { currentSignedIn = null; }

      // --------------- Personal Settings form (real save, real auth API) ---------------
      const personalForm = document.getElementById("personal-settings-form");
      if (personalForm && currentSignedIn) {
        const firstNameInput = document.getElementById("setting-first-name");
        const lastNameInput  = document.getElementById("setting-last-name");
        const mobileInput    = document.getElementById("setting-mobile");
        const emailInput     = document.getElementById("setting-email");

        if (firstNameInput) firstNameInput.value = currentSignedIn.firstName || "";
        if (lastNameInput)  lastNameInput.value  = currentSignedIn.lastName  || "";
        if (mobileInput)    mobileInput.value    = currentSignedIn.mobile    || "";
        if (emailInput)     emailInput.value     = currentSignedIn.email     || "";

        // Insert a status line once, right before the submit row
        const personalMsg = document.createElement("div");
        personalMsg.className = "login-message";
        personalMsg.id = "personal-settings-message";
        personalMsg.setAttribute("role", "status");
        personalMsg.setAttribute("aria-live", "polite");
        const actionsRow = personalForm.querySelector(".form-actions");
        if (actionsRow && actionsRow.parentNode) {
          actionsRow.parentNode.insertBefore(personalMsg, actionsRow);
        } else {
          personalForm.appendChild(personalMsg);
        }

        personalForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const patch = {
            firstName: (firstNameInput ? firstNameInput.value : "").trim(),
            lastName:  (lastNameInput  ? lastNameInput.value  : "").trim(),
            mobile:    (mobileInput    ? mobileInput.value    : "").trim()
          };
          if (!patch.firstName || !patch.lastName) {
            personalMsg.className = "login-message error";
            personalMsg.textContent = "First name and last name are required.";
            return;
          }
          let ok = false;
          try {
            ok = !!(await SmartPWDAuth.updateCurrentUser(patch));
          } catch (_) { ok = false; }
          if (!ok) {
            personalMsg.className = "login-message error";
            personalMsg.textContent = "Could not save changes. Please sign in again.";
            return;
          }
          // Refresh the UI so the new name appears immediately on dashboard
          let u = null;
          try { u = await SmartPWDAuth.currentUser(); } catch (_) { u = null; }
          if (u) {
            const fullName = (u.firstName || "") + " " + (u.lastName || "");
            document.querySelectorAll(".sidebar .profile b").forEach(n => { n.textContent = fullName.trim(); });
            const welcome = document.querySelector("#approved-view h1, .dashhead h1");
            if (welcome && u.firstName) welcome.textContent = "Good day, " + u.firstName + ".";
            const idName = document.querySelector("#approved-view .digital-info b");
            if (idName) idName.textContent = fullName.trim().toUpperCase();
          }

          personalMsg.className = "login-message success";
          personalMsg.textContent = "Changes saved.";
        });
      }

      // --------------- Password Change form (real — rewrites user's stored password hash) ---------------
      const securityForm = document.getElementById("security-settings-form");
      if (securityForm && currentSignedIn) {
        const msg = document.getElementById("password-change-message") || (() => {
          const m = document.createElement("div");
          m.id = "password-change-message";
          m.className = "login-message";
          m.setAttribute("role", "status");
          m.setAttribute("aria-live", "polite");
          const actionsRow = securityForm.querySelector(".form-actions");
          if (actionsRow && actionsRow.parentNode) actionsRow.parentNode.insertBefore(m, actionsRow);
          else securityForm.appendChild(m);
          return m;
        })();

        securityForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const curPassInp     = document.getElementById("current-password");
          const newPassInp     = document.getElementById("new-password");
          const confirmPassInp = document.getElementById("confirm-password");
          msg.className = "login-message";
          msg.textContent = "";

          const curPw     = curPassInp ? curPassInp.value : "";
          const newPw     = newPassInp ? newPassInp.value : "";
          const confirmPw = confirmPassInp ? confirmPassInp.value : "";

          // Re-login with the provided current password to confirm ownership
          let attempt = { ok: false, message: "Authentication unavailable." };
          try {
            attempt = (await SmartPWDAuth.loginUser(currentSignedIn.email, curPw)) || attempt;
          } catch (_) {}
          if (!attempt.ok) {
            msg.className = "login-message error";
            msg.textContent = "Your current password is not correct.";
            if (curPassInp) { curPassInp.value = ""; curPassInp.focus(); }
            return;
          }
          if (newPw.length < 6) {
            msg.className = "login-message error";
            msg.textContent = "New password must be at least 6 characters long.";
            if (newPassInp) newPassInp.focus();
            return;
          }
          if (newPw !== confirmPw) {
            msg.className = "login-message error";
            msg.textContent = "New passwords do not match.";
            if (confirmPassInp) { confirmPassInp.value = ""; confirmPassInp.focus(); }
            return;
          }

          // Prefer Supabase auth.updateUser for real password changes;
          // fall back to legacy localStorage hash so the saved flow never breaks.
          let worked = false;
          try {
            const sb = (typeof window.supabase !== "undefined") ? window.supabase : null;
            if (sb && sb.auth && typeof sb.auth.updateUser === "function") {
              const updateRes = await sb.auth.updateUser({ password: newPw });
              worked = !(updateRes && updateRes.error);
            }
          } catch (_) { worked = false; }
          if (!worked) {
            try {
              const USERS_KEY   = "spwd_users";
              const SESSION_KEY = "spwd_session";
              const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
              const idx = users.findIndex(u => u.email === currentSignedIn.email);
              if (idx === -1) throw new Error("no legacy user");
              const FNV1A_32 = (s) => { let h = 0x811c9dc5; for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8,'0'); };
              const hash = "f" + FNV1A_32(newPw) + "-" + btoa(unescape(encodeURIComponent(newPw))).slice(0, 16);
              users[idx].password = hash;
              localStorage.setItem(USERS_KEY, JSON.stringify(users));
              const sessionUser = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
              if (sessionUser && localStorage.getItem(SESSION_KEY) !== sessionUser) localStorage.setItem(SESSION_KEY, sessionUser);
              worked = true;
            } catch (_) { worked = false; }
          }

          if (!worked) {
            msg.className = "login-message error";
            msg.textContent = "Could not update password. Please sign in again.";
            return;
          }

          msg.className = "login-message success";
          msg.textContent = "Password updated successfully.";
          if (curPassInp)     curPassInp.value     = "";
          if (newPassInp)     newPassInp.value     = "";
          if (confirmPassInp) confirmPassInp.value = "";
        });
      }
    })();

    // Close controls
    const close = () => { p.remove(); backdrop.remove(); };
    document.getElementById("settingsClose").onclick = close;
    backdrop.onclick = close;
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });

    // Inner tabs (Account / Vision / Hearing / Motor / Cognitive)
    function showPane(name) {
      p.querySelectorAll(".sp-tab").forEach(x => x.classList.toggle("active", x.dataset.sptab === name));
      p.querySelectorAll(".sp-pane").forEach(x => {
        const match = x.dataset.spane === name;
        x.classList.toggle("active", match);
        x.style.display = match ? "" : "none";
      });
    }
    p.querySelectorAll(".sp-tab").forEach(t => t.addEventListener("click", () => showPane(t.dataset.sptab)));
    // Ensure the initially-marked active tab's pane is actually visible
    const firstActiveTab = p.querySelector(".sp-tab.active");
    if (firstActiveTab) showPane(firstActiveTab.dataset.sptab);
    else {
      const anyTab = p.querySelector(".sp-tab");
      if (anyTab) showPane(anyTab.dataset.sptab);
    }

    const s = loadSettings();
    const setSwitch = (id, on) => {
      const x = document.getElementById(id);
      if (x && on) x.classList.add("on");
    };

    setSwitch("largeToggle", s.largeText);
    setSwitch("contrastToggle", s.highContrast);
    setSwitch("voiceToggle", s.voice);
    setSwitch("motionToggle", s.reducedMotion);
    setSwitch("focusToggle", s.focusRing);
    setSwitch("screenToggle", s.screenReader);
    setSwitch("simpleToggle", s.simpleInterface);
    setSwitch("signToggle", s.signLanguage);
    setSwitch("darkToggle", s.darkMode);
    setSwitch("tapToggle", s.largeTaps);
    setSwitch("alertToggle", s.visualAlerts);
    setSwitch("captionToggle", s.captions);
    setSwitch("plainToggle", s.plainLanguage);


    const ls = document.getElementById("langSelect");
    if (ls) ls.value = s.language;

    const t = (id, key, fn) => {
      const x = document.getElementById(id);
      if (!x) return;
      x.onclick = () => {
        x.classList.toggle("on");
        const cur = loadSettings();
        cur[key] = x.classList.contains("on");
        saveSettings(cur);
        applySettings(cur);
        if (fn) fn(cur[key]);
      };
    };

    t("largeToggle", "largeText", on => {
      if (loadSettings().voice) speak(on ? "Large text enabled." : "Large text disabled.");
    });
    t("contrastToggle", "highContrast", on => {
      if (loadSettings().voice) speak(on ? "High contrast enabled." : "High contrast disabled.");
    });
    t("motionToggle", "reducedMotion", on => {
      if (loadSettings().voice) speak(on ? "Reduced motion enabled." : "Reduced motion disabled.");
    });
    t("darkToggle", "darkMode", on => {
      if (loadSettings().voice) speak(on ? "Dark mode enabled." : "Dark mode disabled.");
    });
    t("focusToggle", "focusRing", on => {
      if (loadSettings().voice) speak(on ? "Visible focus ring enabled." : "Focus ring disabled.");
    });
    t("screenToggle", "screenReader", on => {
      if (loadSettings().voice) speak(on ? "Screen reader mode enabled." : "Screen reader mode disabled.");
    });
    t("simpleToggle", "simpleInterface", on => {
      if (loadSettings().voice) speak(on ? "Simple interface enabled." : "Standard interface restored.");
    });
    t("signToggle", "signLanguage", on => {
      const cfg = document.getElementById("signConfig");
      if (cfg) cfg.style.display = on ? "block" : "none";
      // Legacy SignBridge + ASL Digital Signer overlays were removed.
      // Only the new FSL Video Library PiP (sentence-matching player) is controlled
      // via this Hearing → Sign Language Overlay toggle now, already applied by
      // applySettings -> toggleFSLVideoPlayer above.
      if (loadSettings().voice) speak(on ? "FSL video player enabled. Click, hover, or tap any sentence to play its translation." : "FSL video player disabled.");
    });
    t("voiceToggle", "voice", on => {
      if (on && window.speechSynthesis) speak("Voice assistance enabled. Buttons and links will be read aloud.");
    });
    t("tapToggle", "largeTaps", on => {
      document.body.classList.toggle("large-taps", on);
      if (loadSettings().voice) speak(on ? "Larger tap targets enabled." : "Tap targets restored to normal.");
    });
    t("alertToggle", "visualAlerts", on => {
      document.body.classList.toggle("visual-alerts", on);
      if (loadSettings().voice) speak(on ? "Visual alerts enabled." : "Visual alerts disabled.");
    });
    t("captionToggle", "captions", on => {
      document.body.classList.toggle("captions", on);
      if (loadSettings().voice) speak(on ? "Live captions enabled." : "Live captions disabled.");
    });
    t("plainToggle", "plainLanguage", on => {
      document.body.classList.toggle("plain-language", on);
      if (loadSettings().voice) speak(on ? "Plain language enabled." : "Plain language disabled.");
    });

    // Read aloud current page
    const readToggle = document.getElementById("readToggle");
    if (readToggle) {
      readToggle.onclick = () => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          return;
        }
        const parts = [];
        document.querySelectorAll("main h1, main h2, main h3, main p, main li").forEach(n => {
          const t = n.textContent.trim();
          if (t && t.length < 300) parts.push(t);
        });
        speak(parts.join(". "));
      };
    }

    ls?.addEventListener("change", () => {
      const cur = loadSettings();
      cur.language = ls.value === "Filipino" ? "Filipino" : "English";
      saveSettings(cur);
      applySettingsLanguage(p, cur.language);
      if (cur.voice) speak(`Language changed to ${cur.language}.`);
    });

    document.getElementById("settingsReset").onclick = () => {
      saveSettings(Object.assign({}, defaults));
      applySettings(defaults);
      p.querySelectorAll(".switch").forEach(x => x.classList.remove("on"));
      document.body.classList.remove("large-text", "high-contrast", "reduced-motion", "simple-interface", "focus-ring", "screen-reader", "large-taps", "visual-alerts", "captions", "plain-language");
      if (ls) ls.value = "English";
      if (loadSettings().voice) speak("All settings reset to defaults.");
    };

    applySettingsLanguage(p, s.language);
    if (loadSettings().voice) speak("Accessibility settings panel is now open.");
  }

  /* ============================================================
     Old SignBridge / legacy ASL Digital Signer widgets: REMOVED.
     The user-requested replacement is the new "FSL Video Library"
     admin page + FSL PiP sentence player below.
     ============================================================ */

  /* ============================================================
     FSL VIDEO PIP PLAYER + SENTENCE INTERACTION + LIBRARY CSS
     Floating FSL player for the FSL Video Library (fsl-library.html).
     ============================================================ */
  (function () {
    try {

      const SEL_SENTENCE = "h1, h2, h3, p, li, .text-line";
      const SENTENCE_CLASS = "fsl-sentence";
      const HIGHLIGHT_CLASS = "fsl-sentence-active";
      const PLAY_ICON_CLASS = "fsl-play-icon";

      // --------- DB helpers ---------
      function readAll() {
        return fslLibraryCache || [];
      }
      function normSentence(s) {
        return String(s || "")
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase()
          .replace(/[.,;:!?“”‘’"`~\-_()\[\]{}<>\\/@#$%^&*+=|。！？]/g, "");
      }
      function findVideoBySentence(rawText) {
        const all = readAll();
        // Entries flagged is_default come from a file named "_something.mp4" in
        // public/fsl-videos/ and play for any sentence without a clip of its own.
        const picked = all.filter(function (r) { return !r.is_default; });
        const fallback = all.find(function (r) { return r.is_default; }) || null;
        const norm = normSentence(rawText);
        if (!norm) return fallback;
        // 1) exact match
        let hit = picked.find(function (r) { return normSentence(r.sentence) === norm; });
        if (hit) return hit;
        // 2) contained match: sentence in library fully within raw (handles multi-sentence selections)
        hit = picked.find(function (r) {
          const n = normSentence(r.sentence);
          return n && (norm.indexOf(n) >= 0 || n.indexOf(norm) >= 0);
        });
        return hit || fallback;
      }

      // --------- 1) Inject CSS ---------
      const CSS2 = `
/* ===== FSL PIP PLAYER — VERTICAL MINI · 1:1 SQUARE-LIKE LIQUID GLASS ===== */
.fsl-pip-root {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 99998;
  width: min(270px, 72vw);
  max-height: calc(100vh - 24px);
  border-radius: 22px;
  background:
    radial-gradient(120% 90% at 10% 6%, rgba(255,255,255,0.55), transparent 55%),
    radial-gradient(120% 120% at 95% 95%, rgba(9,192,255,0.35), transparent 60%),
    linear-gradient(165deg, rgba(255,255,255,0.18), rgba(9,192,255,0.10) 45%, rgba(6,84,138,0.26));
  backdrop-filter: blur(28px) saturate(200%) contrast(105%);
  -webkit-backdrop-filter: blur(28px) saturate(200%) contrast(105%);
  border: 1px solid rgba(255,255,255,0.55);
  box-shadow:
    0 20px 56px rgba(6, 51, 92, 0.36),
    0 8px 22px rgba(9, 192, 255, 0.26),
    0 0 0 1px rgba(255,255,255,0.12) inset,
    0 1px 0 rgba(255,255,255,0.75) inset,
    0 -4px 20px rgba(9,192,255,0.10) inset,
    0 0 44px rgba(9,192,255,0.12);
  color: #fff;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  transition: transform .22s cubic-bezier(.2,.8,.2,1), opacity .2s ease, box-shadow .3s ease;
  isolation: isolate;
}
.fsl-pip-root::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 22%, transparent 48%);
  pointer-events: none;
  z-index: 0;
}
.fsl-pip-root::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 8%;
  right: 8%;
  height: 1.5px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
  border-radius: 50%;
  filter: blur(0.2px);
  pointer-events: none;
  z-index: 1;
  opacity: 0.75;
}
.fsl-pip-root > * { position: relative; z-index: 2; }
.fsl-pip-root * { box-sizing: border-box; }
.fsl-pip-root:focus, .fsl-pip-root :focus { outline: none; }
.fsl-pip-root:focus-visible { box-shadow: 0 0 0 3px rgba(9, 192, 255, .65), 0 20px 56px rgba(6, 51, 92, 0.36); }
.fsl-pip-drag { cursor: grab; }
.fsl-pip-root.dragging { cursor: grabbing; transform: scale(1.03); filter: saturate(115%); }
.fsl-pip-root.minimized {
  width: auto;
  min-width: 130px;
  max-width: 54vw;
  border-radius: 999px;
}
.fsl-pip-root.minimized .fsl-pip-body,
.fsl-pip-root.minimized .fsl-pip-controls,
.fsl-pip-root.minimized .fsl-pip-caption,
.fsl-pip-root.minimized .fsl-pip-header { display: none !important; }
.fsl-pip-root:not(.minimized) .fsl-pip-min-pill { display: none !important; }
.fsl-pip-root.fullscreen {
  right: 2vw !important;
  left: auto !important;
  top: 2vh !important;
  bottom: auto !important;
  width: min(520px, 46vw) !important;
  height: auto !important;
  max-height: none !important;
}
.fsl-pip-root.fullscreen .fsl-pip-body {
  flex: 0 0 auto;
  aspect-ratio: 1 / 1;
  width: calc(100% - 24px);
  height: auto !important;
  max-height: none !important;
  margin: 12px;
}
.fsl-pip-root.hidden { display: none !important; }

.fsl-pip-header {
  display: block;
  height: 6px;
  background: linear-gradient(180deg, rgba(255,255,255,0.12), transparent 70%);
  border-bottom: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  flex-shrink: 0;
  cursor: grab;
}
.fsl-pip-header:active { cursor: grabbing; }
.fsl-pip-buttons { display: none !important; }
.fsl-pip-btn {
  all: unset;
  cursor: pointer;
  width: 26px; height: 26px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background:
    radial-gradient(120% 120% at 30% 15%, rgba(255,255,255,0.35), transparent 55%),
    linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
  border: 1px solid rgba(255,255,255,0.28);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.45),
    0 2px 5px rgba(6, 51, 92, 0.18);
  color: #fff;
  font-size: 12px; font-weight: 800;
  transition: background .15s ease, transform .1s ease, box-shadow .2s ease;
}
.fsl-pip-btn:hover {
  background:
    radial-gradient(120% 120% at 30% 15%, rgba(255,255,255,0.5), transparent 55%),
    linear-gradient(160deg, rgba(255,255,255,0.32), rgba(255,255,255,0.12));
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.6),
    0 3px 8px rgba(6, 51, 92, 0.25);
}
.fsl-pip-btn:active { transform: scale(.96); }
.fsl-pip-btn.close {
  background:
    radial-gradient(120% 120% at 30% 15%, rgba(255,200,200,0.5), transparent 55%),
    linear-gradient(160deg, rgba(255, 83, 83, .45), rgba(200, 30, 30, .35));
  border-color: rgba(255,180,180,0.4);
}
.fsl-pip-btn.close:hover {
  background:
    radial-gradient(120% 120% at 30% 15%, rgba(255,220,220,0.65), transparent 55%),
    linear-gradient(160deg, rgba(255, 83, 83, .7), rgba(220, 40, 40, .55));
}

.fsl-pip-min-pill {
  padding: 8px 12px 8px 8px;
  display: flex; align-items: center; gap: 7px;
  cursor: pointer;
  font-weight: 800; font-size: 11px;
  white-space: nowrap;
  background:
    radial-gradient(120% 100% at 12% 10%, rgba(255,255,255,0.5), transparent 60%),
    linear-gradient(135deg, rgba(9, 192, 255, .32), rgba(6, 84, 138, .55));
  border: 1px solid rgba(255,255,255,0.35);
}
.fsl-pip-min-pill b { font-size: 11.5px; }
.fsl-pip-min-pill::before {
  content: "🤟";
  width: 24px; height: 24px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 13px;
  background: radial-gradient(120% 120% at 30% 20%, rgba(255,255,255,0.7), rgba(255,255,255,0.15) 50%),
              linear-gradient(160deg, rgba(9,192,255,0.4), rgba(6,84,138,0.5));
  border: 1px solid rgba(255,255,255,0.5);
  flex-shrink: 0;
}

.fsl-pip-body {
  position: relative;
  background: radial-gradient(120% 100% at 50% 0%, rgba(9,192,255,0.10), transparent 55%), #000;
  aspect-ratio: 1 / 1;
  margin: 9px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 10px 24px rgba(0,0,0,0.45),
    0 0 0 1px rgba(255,255,255,0.12),
    inset 0 1px 0 rgba(255,255,255,0.12),
    inset 0 0 30px rgba(0,0,0,0.45);
  flex-shrink: 0;
}
.fsl-pip-video {
  width: 100%; height: 100%;
  object-fit: cover;
  object-position: center 45%;
  background: #000;
  display: block;
}
.fsl-pip-poster {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  flex-direction: column;
  gap: 10px;
  padding: 18px 16px;
  text-align: center;
  background:
    radial-gradient(140% 70% at 50% 0%, rgba(9,192,255,.35), transparent 55%),
    radial-gradient(150% 120% at 100% 100%, rgba(6,84,138,.38), transparent 55%),
    linear-gradient(180deg, rgba(8,28,50,0.93) 0%, rgba(4,17,31,0.985) 100%);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.fsl-pip-poster::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 22%);
  pointer-events: none;
}
.fsl-pip-poster b { font-size: 13px; font-weight: 900; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.4); line-height: 1.3; }
.fsl-pip-poster small { font-size: 10.5px; color: rgba(255,255,255,.85); max-width: 34ch; line-height: 1.55; }

.fsl-pip-controls {
  padding: 0 9px 7px;
  display: flex; flex-direction: column; gap: 5px;
  flex-shrink: 0;
}
.fsl-pip-row {
  display: flex; align-items: center; gap: 6px;
  flex-wrap: wrap;
}
.fsl-pip-row.play-row { gap: 7px; }
.fsl-pip-play {
  all: unset;
  cursor: pointer;
  width: 32px; height: 32px;
  border-radius: 999px;
  background:
    radial-gradient(120% 120% at 32% 22%, #ffffff 0%, #eef7ff 45%, #d6ebff 75%, #bfe0ff 100%);
  color: #06548a;
  border: 1px solid rgba(255,255,255,0.9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,1),
    inset 0 -3px 9px rgba(9,192,255,0.20),
    0 4px 12px rgba(0,0,0,.28),
    0 0 0 1px rgba(9,192,255,.25);
  font-weight: 900;
  transition: transform .1s ease, box-shadow .2s ease;
}
.fsl-pip-play:hover {
  transform: translateY(-1px) scale(1.04);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,1),
    inset 0 -3px 9px rgba(9,192,255,0.28),
    0 6px 16px rgba(0,0,0,.33),
    0 0 0 1px rgba(9,192,255,.40),
    0 0 14px rgba(9,192,255,0.35);
}
.fsl-pip-scrub {
  -webkit-appearance: none; appearance: none;
  flex: 1 1 auto;
  min-width: 0;
  height: 6px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(9,192,255,0.95) var(--pct, 0%), rgba(9,192,255,0.45) var(--pct, 0%) 60%, rgba(255,255,255,.22) 60%);
  outline: none;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 2px rgba(0,0,0,0.25);
}
.fsl-pip-scrub::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 13px; height: 13px; border-radius: 50%;
  background: radial-gradient(120% 120% at 32% 22%, #fff 0%, #d6ebff 70%, #bfe0ff 100%);
  border: 1.5px solid #06548a;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,.30), 0 0 10px rgba(9,192,255,0.5), inset 0 1px 0 rgba(255,255,255,0.9);
}
.fsl-pip-scrub::-moz-range-thumb {
  width: 13px; height: 13px; border-radius: 50%;
  background: radial-gradient(120% 120% at 32% 22%, #fff 0%, #d6ebff 70%, #bfe0ff 100%);
  border: 1.5px solid #06548a;
  cursor: pointer;
}
.fsl-pip-time {
  font-variant-numeric: tabular-nums;
  font-size: 9.5px;
  font-weight: 700;
  color: rgba(255,255,255,.95);
  width: 100%;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  order: -1;
  line-height: 1;
  padding-bottom: 1px;
}
.fsl-pip-caption {
  margin: 0 9px 9px;
  padding: 8px 10px;
  border-radius: 12px;
  background:
    radial-gradient(120% 120% at 15% 15%, rgba(255,255,255,0.12), transparent 60%),
    linear-gradient(160deg, rgba(0,0,0,0.34), rgba(0,0,0,0.48));
  border: 1px solid rgba(255,255,255,0.14);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.18),
    0 3px 10px rgba(0,0,0,0.25);
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.4;
  color: #fff;
  word-break: break-word;
  text-shadow: 0 1px 2px rgba(0,0,0,0.35);
  flex-shrink: 0;
}

/* ===== FSL SENTENCE HIGHLIGHT + PLAY ICON ===== */
.fsl-sentence-active,
.fsl-sentence {
  cursor: pointer;
  position: relative;
  border-radius: 6px;
  transition: background-color .15s ease, box-shadow .15s ease;
}
.fsl-sentence-active {
  background: rgba(9, 192, 255, 0.18) !important;
  box-shadow: 0 0 0 2px rgba(9, 192, 255, .45);
  color: #06548a;
}
.fsl-play-icon {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 99980;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06548a, #09c0ff);
  color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 8px 18px rgba(6, 51, 92, .28), 0 0 0 3px rgba(255,255,255, .85);
  cursor: pointer;
  border: 0;
  line-height: 1;
  padding: 0;
  animation: fsl-play-pop .22s cubic-bezier(.2,1.4,.4,1) both;
}
@keyframes fsl-play-pop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
li.fsl-sentence-active, li.fsl-sentence { position: relative; }
/* ===== FSL TOAST NOTIFICATION ===== */
.fsl-toast {
  position: fixed;
  left: 50%;
  top: 20px;
  transform: translate(-50%, -120%);
  z-index: 999999;
  background: linear-gradient(135deg, rgba(6, 84, 138, .96), rgba(9, 192, 255, .88));
  color: #fff;
  padding: 12px 18px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 20px 40px rgba(6, 51, 92, .28);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.22);
  max-width: min(560px, 92vw);
  transition: transform .35s cubic-bezier(.2,.9,.3,1.2), opacity .25s ease;
  opacity: 0;
  pointer-events: none;
}
.fsl-toast.show { transform: translate(-50%, 0); opacity: 1; }
.fsl-toast .fsl-toast-body { display: flex; align-items: flex-start; gap: 10px; }
.fsl-toast-icon {
  width: 24px; height: 24px; flex-shrink: 0;
  border-radius: 50%;
  background: rgba(255,255,255,.2);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 900;
}
.fsl-toast-text { flex: 1; line-height: 1.45; }
.fsl-toast-text small { opacity: .85; font-weight: 600; display: block; margin-top: 2px; }

/* ===== FSL LIBRARY FORM / TABLE (adminfsl-library.html) ===== */
.fsl-form {
  display: flex; flex-direction: column; gap: 16px;
  padding: 4px 2px;
}
.fsl-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.fsl-field {
  display: flex; flex-direction: column; gap: 6px;
}
.fsl-field label {
  display: flex; flex-direction: column; gap: 4px;
  font-size: 12px;
  font-weight: 800;
  color: #06548a;
  letter-spacing: .03em;
  text-transform: uppercase;
}
.fsl-hint { font-size: 11.5px; color: #4a6782; font-weight: 600; }
.fsl-hint code {
  background: #eef6ff; padding: 1px 6px; border-radius: 6px; font-size: 11px;
  color: #06548a; border: 1px solid rgba(9,192,255,.3);
}
.fsl-input, .fsl-select {
  width: 100%;
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(9, 192, 255, .32);
  background: #fff;
  color: #092a44;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  transition: border-color .15s ease, box-shadow .15s ease;
  box-sizing: border-box;
}
.fsl-input { min-height: 46px; }
.fsl-input:focus, .fsl-select:focus {
  outline: none;
  border-color: #09c0ff;
  box-shadow: 0 0 0 3px rgba(9, 192, 255, .18);
  background: #fbfeff;
}
.fsl-select {
  appearance: none;
  padding-right: 38px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2309c0ff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
.fsl-upload-label {
  display: flex !important; flex-direction: row !important; align-items: center !important; gap: 12px !important;
  padding: 18px 16px;
  border-radius: 14px;
  border: 2px dashed rgba(9, 192, 255, .45);
  background: linear-gradient(180deg, #fff 0%, #f4faff 100%);
  cursor: pointer;
  transition: all .15s ease;
}
.fsl-upload-label:hover,
.fsl-upload-label.dragover {
  border-color: #09c0ff;
  background: #f0faff;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(9,192,255,.12);
}
#fsl-video-label { display: flex; flex-direction: column; gap: 2px; text-transform: none !important; letter-spacing: 0 !important; }
#fsl-video-label b { color: #06548a; font-size: 13.5px; font-weight: 800; }
#fsl-video-label small { color: #4a6782; font-size: 12px; font-weight: 600; }
.fsl-preview-video {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0,0,0,.2);
}
.fsl-preview-video video { width: 100%; height: 100%; object-fit: contain; display: block; }
.fsl-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  padding-top: 4px;
}
.fsl-filter-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}
.fsl-search {
  position: relative;
  display: flex; align-items: center;
}
.fsl-search input[type=search] {
  width: 100%;
  min-height: 42px;
  padding: 10px 14px 10px 38px;
  border-radius: 12px;
  border: 1.5px solid rgba(9, 192, 255, .32);
  background: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
}
.fsl-search-icon {
  position: absolute; left: 12px;
  font-size: 14px;
  opacity: .7;
  pointer-events: none;
}
.fsl-count {
  font-size: 12px;
  font-weight: 700;
  color: #06548a;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(9,192,255,.12);
  white-space: nowrap;
}
.fsl-quick {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin-top: 4px;
}
.chip {
  all: unset;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(9, 192, 255, .12);
  color: #06548a;
  font-size: 12px;
  font-weight: 700;
  transition: all .12s ease;
}
.chip:hover { background: rgba(9,192,255,.24); transform: translateY(-1px); }
.chip.active {
  background: linear-gradient(135deg, #06548a, #09c0ff);
  color: #fff;
  box-shadow: 0 6px 14px rgba(9, 192, 255, .25);
}
.chip.outline {
  background: transparent;
  border: 1.5px dashed rgba(9, 192, 255, .45);
}
.chip.green { background: rgba(6,194,122,.12); color: #0a7a4d; }
.chip.green.active { background: linear-gradient(135deg, #0a7a4d, #06c27a); color: #fff; }
.chip.red { background: rgba(255, 83, 83, .12); color: #a12626; }
.chip.red.active { background: linear-gradient(135deg, #a12626, #ff5353); color: #fff; }
.chip.blue { background: rgba(6, 84, 138, .12); color: #06548a; }
.chip.blue.active { background: linear-gradient(135deg, #06548a, #09c0ff); color: #fff; }
.fsl-table-wrap {
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(9, 192, 255, .2);
  background: #fff;
}
.fsl-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}
.fsl-table thead th {
  text-align: left;
  padding: 12px 16px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #06548a;
  font-weight: 800;
  background: linear-gradient(180deg, #f0faff, #e6f4ff);
  border-bottom: 1.5px solid rgba(9, 192, 255, .22);
  white-space: nowrap;
}
.fsl-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(9, 192, 255, .1);
  vertical-align: middle;
  color: #092a44;
}
.fsl-table tbody tr:hover td { background: rgba(9, 192, 255, .04); }
.fsl-table tbody tr:last-child td { border-bottom: 0; }
.fsl-thumb {
  width: 112px;
  min-width: 112px;
}
.fsl-thumb-video {
  width: 112px; height: 64px;
  object-fit: cover;
  border-radius: 10px;
  background: #000;
  border: 1.5px solid rgba(9,192,255,.3);
  cursor: pointer;
  display: block;
}
.fsl-no-vid {
  display: inline-flex; align-items: center; justify-content: center;
  width: 112px; height: 64px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e0f3ff, #ccefff);
  color: #06548a;
  font-size: 22px;
  margin-bottom: 4px;
}
.fsl-sent-text { font-weight: 700; color: #092a44; line-height: 1.4; word-break: break-word; }
.fsl-meta { display: block; margin-top: 4px; font-size: 11px; color: #4a6782; font-weight: 600; }
.fsl-date { white-space: nowrap; font-variant-numeric: tabular-nums; color: #4a6782; font-size: 12px; }
.fsl-actions-th { width: auto; }
.fsl-actions {
  display: flex; gap: 6px;
  padding-top: 0;
  flex-wrap: wrap;
}
.fsl-empty {
  padding: 56px 24px;
  text-align: center;
  color: #4a6782;
}
.fsl-empty-icon {
  display: inline-flex;
  width: 72px; height: 72px;
  margin: 0 auto 12px;
  border-radius: 50%;
  align-items: center; justify-content: center;
  background: linear-gradient(135deg, #e0f3ff, #ccefff);
  color: #06548a;
  font-size: 30px;
}
.fsl-empty b { display: block; font-size: 16px; color: #092a44; margin-bottom: 4px; }
.fsl-empty small { font-size: 13px; }
.fsl-form .btn.sm { padding: 8px 12px; font-size: 12px; min-height: 36px; }
.btn.ghost.danger { color: #a12626 !important; border-color: rgba(255, 83, 83, .4) !important; }
.btn.ghost.danger:hover { background: rgba(255, 83, 83, .12) !important; }
.fsl-field.fsl-preview { grid-column: 1 / -1; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); border: 0; }

@media (max-width: 720px) {
  .fsl-grid { grid-template-columns: 1fr; }
  .fsl-filter-row { grid-template-columns: 1fr; }
  .fsl-filter-row .fsl-count { justify-self: start; }
  .fsl-actions { flex-direction: column-reverse; }
  .fsl-actions .btn { width: 100%; justify-content: center; }
  .fsl-table-wrap { -webkit-overflow-scrolling: touch; }
  .fsl-pip-root { right: 10px; bottom: 10px; width: min(340px, 94vw); }
}
@media (max-width: 420px) {
  .fsl-pip-root { width: 94vw; }
}
`;
      const styleId2 = "fsl-pip-css";
      if (!document.getElementById(styleId2)) {
        const st2 = document.createElement("style");
        st2.id = styleId2;
        st2.textContent = CSS2;
        (document.head || document.documentElement).appendChild(st2);
      }

      // --------- 2) Inject PiP DOM ---------
      const STORAGE = {
        POS: "fsl_pip_pos",
        MIN: "fsl_pip_min",
        VOL: "fsl_pip_vol",
        SPEED: "fsl_pip_speed",
        HIDDEN: "fsl_pip_hidden"
      };

      const pip = document.createElement("aside");
      pip.id = "fsl-pip";
      pip.className = "fsl-pip-root hidden";
      pip.setAttribute("role", "region");
      pip.setAttribute("aria-label", "FSL Video Picture-in-Picture player");
      pip.setAttribute("tabindex", "-1");
      pip.innerHTML = `
        <div class="fsl-pip-min-pill" id="fsl-pip-min-pill" role="button" tabindex="0" aria-label="Expand FSL player">
          <b id="fsl-pip-min-title">FSL Player</b>
        </div>
        <div class="fsl-pip-header fsl-pip-drag" data-drag="1" role="banner" aria-label="Drag to move FSL player"></div>
        <div class="fsl-pip-body">
          <div class="fsl-pip-poster" id="fsl-pip-poster">
            <b>🎞️ FSL translation will play here</b>
            <small>Hover, click or tap any sentence on the page. If a matching FSL video exists in the library, it plays automatically.</small>
          </div>
          <video class="fsl-pip-video" id="fsl-pip-video" playsinline preload="metadata" aria-label="Filipino Sign Language video"></video>
        </div>
        <div class="fsl-pip-controls">
          <div class="fsl-pip-row play-row">
            <button class="fsl-pip-play" id="fsl-pip-play" type="button" aria-label="Play">▶</button>
            <input class="fsl-pip-scrub" id="fsl-pip-scrub" type="range" min="0" max="1000" step="1" value="0" aria-label="Timeline scrubber">
            <span class="fsl-pip-time" id="fsl-pip-time">00:00 / 00:00</span>
          </div>
        </div>
        <div class="fsl-pip-caption" id="fsl-pip-caption" role="status" aria-live="polite" aria-atomic="true">
          No sentence selected.
        </div>
      `;
      (document.body || document.documentElement).appendChild(pip);

      // Refs
      const $ = (sel) => pip.querySelector(sel);
      const v = $("#fsl-pip-video");
      const poster = $("#fsl-pip-poster");
      const caption = $("#fsl-pip-caption");
      const meta = $("#fsl-pip-meta");
      const statEl = $("#fsl-pip-stat");
      const playBtn = $("#fsl-pip-play");
      const scrub = $("#fsl-pip-scrub");
      const tmEl = $("#fsl-pip-time");
      const fs1 = $("#fsl-pip-fs");
      const minBtn = $("#fsl-pip-min");
      const closeBtn = $("#fsl-pip-close");
      const minPill = $("#fsl-pip-min-pill");
      const header = pip.querySelector(".fsl-pip-header[data-drag=\"1\"]");

      // Restore saved position
      try {
        const savedMin = localStorage.getItem(STORAGE.MIN) === "1";
        if (savedMin) pip.classList.add("minimized");
        const savedHidden = localStorage.getItem(STORAGE.HIDDEN) === "1";
        if (savedHidden) pip.classList.add("hidden");
        const pos = JSON.parse(localStorage.getItem(STORAGE.POS) || "null");
        if (pos && typeof pos.left === "number") {
          pip.style.right = "auto"; pip.style.bottom = "auto";
          pip.style.left = Math.max(4, pos.left) + "px";
          pip.style.top = Math.max(4, pos.top) + "px";
        }
      } catch (_) {}

      // Helpers
      const fmt = (sec) => {
        if (!isFinite(sec) || sec < 0) sec = 0;
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      };
      const updateTime = () => {
        const cur = v.currentTime || 0;
        const dur = (isFinite(v.duration) && v.duration > 0) ? v.duration : 0;
        tmEl.textContent = fmt(cur) + " / " + fmt(dur);
        const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
        scrub.value = String(Math.round(pct * 10));
        scrub.style.setProperty("--pct", pct.toFixed(1) + "%");
      };
      const setPlayIcon = () => {
        playBtn.textContent = (v.paused ? "▶" : "❚❚");
        playBtn.setAttribute("aria-label", v.paused ? "Play" : "Pause");
      };
      const initDefaults = () => {
        try {
          const savedVol = parseFloat(localStorage.getItem(STORAGE.VOL) || "1");
          v.volume = Math.max(0, Math.min(1, savedVol));
          v.muted = v.volume === 0;
        } catch (_) {}
        try {
          const savedSpeed = parseFloat(localStorage.getItem(STORAGE.SPEED) || "1");
          v.playbackRate = Math.max(0.25, Math.min(4, savedSpeed));
        } catch (_) {}
      };
      initDefaults();
      updateTime();

      // Control wires
      const showPip = () => {
        pip.classList.remove("hidden");
        localStorage.setItem(STORAGE.HIDDEN, "0");
      };
      const setMin = (val) => {
        pip.classList.toggle("minimized", !!val);
        localStorage.setItem(STORAGE.MIN, val ? "1" : "0");
        if (!val) showPip();
      };
      if (minBtn) minBtn.addEventListener("click", () => setMin(!pip.classList.contains("minimized")));
      if (minPill) {
        minPill.addEventListener("click", () => setMin(false));
        minPill.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setMin(false); }
        });
      }
      if (closeBtn) closeBtn.addEventListener("click", () => {
        try { v.pause(); } catch (_) {}
        pip.classList.add("hidden");
        localStorage.setItem(STORAGE.HIDDEN, "1");
      });
      const toggleFs = () => {
        const on = pip.classList.toggle("fullscreen");
        if (fs1) {
          fs1.setAttribute("aria-label", on ? "Exit fullscreen" : "Fullscreen");
          fs1.textContent = on ? "✕" : "▢";
        }
      };
      if (fs1) fs1.addEventListener("click", toggleFs);
      playBtn.addEventListener("click", () => {
        if (!v.src) return;
        if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
        else v.pause();
        setPlayIcon();
      });
      v.addEventListener("play", setPlayIcon);
      v.addEventListener("pause", setPlayIcon);
      v.addEventListener("ended", setPlayIcon);
      v.addEventListener("timeupdate", updateTime);
      v.addEventListener("loadedmetadata", updateTime);
      v.addEventListener("error", () => { caption.textContent = "⚠️ Unable to play this FSL video."; });
      scrub.addEventListener("input", () => {
        const pct = parseFloat(scrub.value || "0") / 10;
        scrub.style.setProperty("--pct", pct.toFixed(1) + "%");
        if (v.src && isFinite(v.duration) && v.duration > 0) {
          v.currentTime = (pct / 100) * v.duration;
        }
      });

      // Drag handler
      (function () {
        let dragging = false, sx, sy, origLeft, origTop, moved = false;
        const getPos = () => {
          const r = pip.getBoundingClientRect();
          const left = pip.style.left && pip.style.left !== "auto" ? parseFloat(pip.style.left) : r.left;
          const top = pip.style.top && pip.style.top !== "auto" ? parseFloat(pip.style.top) : r.top;
          return { left, top, w: r.width, h: r.height };
        };
        const onDown = (e) => {
          const t = e.target;
          if (!t.closest(".fsl-pip-header[data-drag=\"1\"]")) return;
          if (t.closest("button, input, select, a, [role=\"button\"]")) return;
          if (pip.classList.contains("minimized")) return;
          e.preventDefault();
          dragging = true; moved = false;
          pip.classList.add("dragging");
          const p = getPos();
          origLeft = p.left; origTop = p.top;
          const pt = (e.touches && e.touches[0]) ? e.touches[0] : e;
          sx = pt.clientX - origLeft; sy = pt.clientY - origTop;
          document.addEventListener("mousemove", onMove, { passive: false });
          document.addEventListener("mouseup", onUp, { passive: false });
          document.addEventListener("touchmove", onMove, { passive: false });
          document.addEventListener("touchend", onUp, { passive: false });
        };
        const onMove = (e) => {
          if (!dragging) return;
          const pt = (e.touches && e.touches[0]) ? e.touches[0] : e;
          e.preventDefault();
          moved = true;
          const maxL = Math.max(0, window.innerWidth - 120);
          const maxT = Math.max(0, window.innerHeight - 60);
          let left = pt.clientX - sx;
          let top = pt.clientY - sy;
          left = Math.max(4, Math.min(maxL, left));
          top = Math.max(4, Math.min(maxT, top));
          pip.style.right = "auto"; pip.style.bottom = "auto";
          pip.style.left = left + "px";
          pip.style.top = top + "px";
        };
        const onUp = () => {
          if (!dragging) return;
          dragging = false;
          pip.classList.remove("dragging");
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          document.removeEventListener("touchmove", onMove);
          document.removeEventListener("touchend", onUp);
          const r = pip.getBoundingClientRect();
          localStorage.setItem(STORAGE.POS, JSON.stringify({ left: r.left, top: r.top }));
        };
        pip.addEventListener("mousedown", onDown, { passive: false });
        pip.addEventListener("touchstart", onDown, { passive: false });
      })();

      // Keyboard shortcuts
      document.addEventListener("keydown", (e) => {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT")) return;
        if (e.key === "Escape") {
          if (!pip.classList.contains("hidden") && !pip.classList.contains("minimized")) setMin(true);
        }
      });

      // --------- 3) Inject toast ---------
      const toast = document.createElement("div");
      toast.id = "fsl-toast";
      toast.className = "fsl-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.innerHTML = `<div class="fsl-toast-body"><span class="fsl-toast-icon" id="fsl-toast-icon">🤟</span><div class="fsl-toast-text"><b id="fsl-toast-title"></b><small id="fsl-toast-desc"></small></div></div>`;
      (document.body || document.documentElement).appendChild(toast);
      const toastTimer = { id: 0 };
      const toastTitleEl = document.getElementById("fsl-toast-title");
      const toastDescEl = document.getElementById("fsl-toast-desc");
      const toastIconEl = document.getElementById("fsl-toast-icon");
      function showToast(title, desc, icon, duration) {
        if (toastTitleEl) toastTitleEl.textContent = title || "";
        if (toastDescEl) toastDescEl.textContent = desc || "";
        if (toastIconEl) toastIconEl.textContent = icon || "ℹ️";
        toast.classList.add("show");
        clearTimeout(toastTimer.id);
        toastTimer.id = setTimeout(function () { toast.classList.remove("show"); }, duration || 3200);
      }

      // --------- 4) Play FSL video for a sentence ---------
      let currentActiveEl = null;
      let lastPlayId = 0;
      function clearActive() {
        if (currentActiveEl) {
          currentActiveEl.classList.remove(HIGHLIGHT_CLASS);
          const pi = currentActiveEl.querySelector("." + PLAY_ICON_CLASS);
          if (pi) pi.remove();
          currentActiveEl = null;
        }
      }
      function showNotFound(sentence) {
        showToast("🤟 No FSL translation available.",
          `"${sentence.slice(0, 90)}${sentence.length > 90 ? "…" : ""}" — ask your site admin to record this sentence in the FSL Video Library.`,
          "ℹ️", 4200);
        caption.textContent = "No FSL translation available for this sentence.";
        if (statEl) statEl.textContent = "Not found";
        if (meta) meta.textContent = "Hover a sentence with a recorded video to play.";
      }
      async function playFSLForSentence(sentence, el) {
        clearActive();
        const myId = ++lastPlayId;
        if (!sentence || !sentence.trim()) return;
        const hit = findVideoBySentence(sentence);
        // Highlight + play icon
        if (el) {
          el.classList.add(HIGHLIGHT_CLASS);
          currentActiveEl = el;
          try {
            const pic = el.ownerDocument.createElement("button");
            pic.type = "button";
            pic.className = PLAY_ICON_CLASS;
            pic.setAttribute("aria-label", "Play FSL video for this sentence");
            pic.textContent = "▶";
            // Place play icon relative to element bounding rect top-right (works for inline elements):
            // Use getBoundingClientRect + fixed position so it's not clipped by overflow:hidden parents.
            const r = el.getBoundingClientRect();
            pic.style.position = "fixed";
            pic.style.top = Math.max(4, r.top - 8 + window.scrollY) + "px";
            // If el has relative positioning ancestor, prepending at body is safer; so re-append at body with absolute
            (document.body).appendChild(pic);
            // Use absolute relative to doc
            pic.style.position = "absolute";
            pic.style.top = (window.scrollY + r.top - 14) + "px";
            pic.style.left = (window.scrollX + r.right - 14) + "px";
            pic.addEventListener("click", (ev) => { ev.stopPropagation(); playFSLForSentence(sentence, el); });
            setTimeout(() => { if (pic.parentNode) pic.remove(); }, 6000);
          } catch(_) {}
        }
        if (!hit) {
          showNotFound(sentence.trim());
          return;
        }
        if (!hit.video_url) {
          showToast("⚠️ FSL entry exists but has no video uploaded yet.");
          return;
        }
        showPip();
        setMin(false);
        // A fallback clip still announces the sentence the visitor hovered.
        caption.textContent = hit.is_default ? sentence.trim() : hit.sentence;
        if (statEl) statEl.textContent = "Playing…";
        try {
          v.pause();
          v.removeAttribute("src");
          v.src = hit.video_url; // Directly use the public URL from Supabase Storage
          poster.style.display = "none";
          v.style.display = "block";
          v.load();
          const onMeta = () => {
            v.removeEventListener("loadedmetadata", onMeta);
            if (myId !== lastPlayId) return;
            updateTime();
            if (statEl) statEl.textContent = "Playing";
            try {
              const p = v.play();
              if (p && p.catch) p.catch(() => {
                // Autoplay block: show user gesture needed
                if (statEl) statEl.textContent = "Click ▶ to play";
              });
            } catch (_) {}
          };
          v.addEventListener("loadedmetadata", onMeta);
          // Fallback
          setTimeout(() => {
            if (myId === lastPlayId && v.readyState < 1 && statEl) statEl.textContent = "Ready — press play";
          }, 2500);
        } catch (e) {
          if (statEl) statEl.textContent = "Error";
          showToast("⚠️ Error loading FSL video.", String(e && e.message ? e.message : e).slice(0, 180), "⚠️", 5000);
        }
      }

      // --------- 5) Sentence interactivity wiring ---------
      const SELS = "h1, h2, h3, p, li, .text-line";
      const processed = new WeakSet();
      function fslIsEnabled() {
        if (!enabled) return false;
        try { if (document.documentElement.classList.contains("fsl-overlay-disabled")) return false; } catch (_) {}
        // The setting is now loaded from localStorage via loadSettings() at the top level of app.js
        if (!loadSettings().signLanguage) return false;
        return true;
      }
      function markElement(el) {
        if (processed.has(el)) return;
        if (el.closest("#fsl-pip, #signbridge, #settings-backdrop, .settings-panel, .modal, #login-message, #fsl-toast")) return;
        if (el.closest("header.top, aside.sidebar")) return;
        const text = (window.SmartPWDLanguage ? window.SmartPWDLanguage.sourceText(el) : (el.textContent || "")).trim();
        if (text.replace(/\s+/g, "").length < 6) return;
        processed.add(el);
        el.classList.add(SENTENCE_CLASS);
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
        if (!el.getAttribute("role") || el.getAttribute("role") === "listitem") {
          // Keep li role if li but don't overwrite existing button semantics if user's original — instead add data attr
        }
        el.setAttribute("data-fsl-sentence", text.slice(0, 200));
        el.setAttribute("title", "Click or hover to play FSL translation");
      }
      function scanAll() {
        try {
          const els = document.querySelectorAll(SELS);
          els.forEach(markElement);
        } catch (_) {}
      }
      scanAll();
      try {
        const mo = new MutationObserver(() => { try { scanAll(); } catch (_) {} });
        mo.observe(document.body || document.documentElement, { subtree: true, childList: true });
      } catch (_) {}
      window.addEventListener("load", scanAll);

      function getSentenceEl(t) {
        if (!t) return null;
        var el = (t.nodeType === 1) ? t : (t.parentElement || null);
        if (!el || typeof el.closest !== "function") return null;
        return el.closest("." + SENTENCE_CLASS);
      }
      // Click (tap+click): primary trigger
      let lastHoverSentence = "";
      document.addEventListener("click", (e) => {
        if (!fslIsEnabled()) return;
        const el = getSentenceEl(e.target);
        if (!el) return;
        const txt = (el.getAttribute("data-fsl-sentence") || el.textContent || "").trim();
        if (!txt) return;
        playFSLForSentence(txt, el);
      });
      // Hover: highlight + try to auto-play after small debounce
      let hoverTimer = 0;
      document.addEventListener("mouseenter", (e) => {
        if (!fslIsEnabled()) return;
        const el = getSentenceEl(e.target);
        if (!el) return;
        const txt = (el.getAttribute("data-fsl-sentence") || el.textContent || "").trim();
        if (!txt) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          if (!fslIsEnabled()) return;
          if (txt !== lastHoverSentence) {
            lastHoverSentence = txt;
            playFSLForSentence(txt, el);
          }
        }, 380);
      }, true);
      document.addEventListener("mouseleave", (e) => {
        const el = getSentenceEl(e.target);
        if (!el) return;
        clearTimeout(hoverTimer);
      }, true);
      // Touch: treat as click + trigger immediately
      document.addEventListener("touchstart", (e) => {
        if (!fslIsEnabled()) return;
        const el = getSentenceEl(e.target);
        if (!el) return;
        const txt = (el.getAttribute("data-fsl-sentence") || el.textContent || "").trim();
        if (!txt) return;
        playFSLForSentence(txt, el);
      }, { passive: true });
      // Keyboard: Enter / Space on focused sentence
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        if (!fslIsEnabled()) return;
        const el = getSentenceEl(e.target);
        if (!el) return;
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT" || e.target.tagName === "BUTTON" || e.target.closest("button"))) return;
        e.preventDefault();
        const txt = (el.getAttribute("data-fsl-sentence") || el.textContent || "").trim();
        if (txt) playFSLForSentence(txt, el);
      });
      // Click outside clears highlight
      document.addEventListener("mousedown", (e) => {
        if (!fslIsEnabled()) { clearActive(); return; }
        if (!currentActiveEl) return;
        if (e.target === currentActiveEl || currentActiveEl.contains(e.target)) return;
        if (e.target.closest("#fsl-pip") || e.target.classList && e.target.classList && e.target.classList.contains(PLAY_ICON_CLASS)) return;
        clearActive();
      }, true);

      // --------- 6) Global API ---------
      let enabled = true;
      function setEnabled(on, opts) {
        enabled = !!on;
        try { document.documentElement.classList.toggle("fsl-overlay-disabled", !enabled); } catch (_) {}
        if (!enabled) {
          clearActive();
          try { v && v.pause && v.pause(); } catch (_) {}
          pip.classList.add("hidden");
          pip.classList.add("fsl-api-disabled");
          try { localStorage.setItem(STORAGE.HIDDEN, "1"); } catch (_) {}
          if (opts && opts.announce !== false) {
            try { showToast("FSL Video Player turned OFF.", "Use Hearing → Sign Language Overlay to turn it back on.", "🤟", 2600); } catch (_) {}
          }
        } else {
          pip.classList.remove("hidden");
          pip.classList.remove("fsl-api-disabled");
          try { localStorage.removeItem(STORAGE.HIDDEN); } catch (_) {}
          if (opts && opts.announce !== false) {
            try { showToast("FSL Video Player turned ON.", "Click, hover, or tap any sentence on the page to play its FSL translation.", "🤟", 3200); } catch (_) {}
          }
        }
        return enabled;
      }
      window.FSLPip = {
        setEnabled: setEnabled,
        play: function () { if (!enabled) return false; return playFSLForSentence.apply(null, arguments); },
        show: function () { if (!enabled) return false; return showPip.apply(null, arguments); },
        hide: function () { try { pip.classList.add("hidden"); localStorage.setItem(STORAGE.HIDDEN, "1"); } catch (_) {} },
        isEnabled: function () { return enabled && !document.documentElement.classList.contains("fsl-overlay-disabled"); },
        getRoot: function () { return pip; },
        findVideoBySentence: findVideoBySentence
      };

      // ---- Honor persisted Hearing → Sign Language Overlay setting on page load ----
      if (loadSettings().signLanguage === false) { setEnabled(false, { announce: false }); }
      // Also, if user had manually closed the PiP last session (and setting still ON overall), respect the hidden flag
      try {
        if (enabled && localStorage.getItem(STORAGE.HIDDEN) === "1") {
          pip.classList.add("hidden");
        }
      } catch(_) {}

    } catch (err) {
      try { console.error("[FSL PiP init failed:", err); } catch (_) {}
    }
  })();

  /* ==================================================================
     NAVBAR AUTH (Pill-nav avatar + hover dropdown with Dashboard/Logout)
     ================================================================== */
  (function navAuthInit() {
    let globalDocClickBound = false;

    function initialsFor(firstName, lastName, email) {
      const f = (firstName || "").trim().charAt(0);
      const l = (lastName  || "").trim().charAt(0);
      if (f || l) return (f + l).toUpperCase();
      const u = ((email || "").split("@")[0] || "").trim().charAt(0);
      return u ? u.toUpperCase() : "U";
    }
    function closeAllMenus(exceptWrap) {
      document.querySelectorAll(".nav-avatar-wrap").forEach(function (w) {
        if (exceptWrap && w === exceptWrap) return;
        var m = w.querySelector(".nav-avatar-menu");
        var b = w.querySelector(".nav-avatar");
        if (m) m.classList.remove("open");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    }
    function bindGlobalCloseOnce() {
      if (globalDocClickBound) return;
      globalDocClickBound = true;
      document.addEventListener("click", function (e) {
        var wraps = document.querySelectorAll(".nav-avatar-wrap");
        wraps.forEach(function (w) {
          if (w.contains(e.target)) return;
          var m = w.querySelector(".nav-avatar-menu");
          var b = w.querySelector(".nav-avatar");
          if (m && m.classList.contains("open")) {
            m.classList.remove("open");
            if (b) b.setAttribute("aria-expanded", "false");
          }
        });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        var wraps = document.querySelectorAll(".nav-avatar-wrap");
        wraps.forEach(function (w) {
          var m = w.querySelector(".nav-avatar-menu");
          var b = w.querySelector(".nav-avatar");
          if (!m || !m.classList.contains("open")) return;
          m.classList.remove("open");
          if (b) {
            b.setAttribute("aria-expanded", "false");
            try { b.focus(); } catch (_) {}
          }
        });
      });
    }
    function renderLoggedInMenu(user, slot) {
      if (!slot || !user) return;
      const fname = user.firstName || "";
      const lname = user.lastName  || "";
      const full  = ((fname + " " + lname).trim()) || (user.email || "");
      const initials = initialsFor(fname, lname, user.email);
      const roleLabel =
        user.role === "admin"    ? "System Administrator"
        : user.role === "verifier" ? "Authorized Verifier"
        : "PWD Cardholder";
      const dashboardHref =
        user.role === "admin"    ? "admin.html"
        : user.role === "verifier" ? "verifier.html"
        : "dashboard.html";
      slot.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "nav-avatar-wrap";
      wrap.innerHTML =
        '<button type="button" class="nav-avatar" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">' +
          '<span class="nav-avatar-initials" aria-hidden="true">' + initials + '</span>' +
          '<span class="nav-avatar-chevron" aria-hidden="true">▾</span>' +
        '</button>' +
        '<div class="nav-avatar-menu" role="menu" aria-label="Account actions">' +
          '<div class="nav-avatar-head">' +
            '<strong class="nav-avatar-name"></strong>' +
            '<small class="nav-avatar-role"></small>' +
          '</div>' +
          '<a class="nav-avatar-item" data-nav-action="dashboard" role="menuitem" href="' + dashboardHref + '">' +
            '<span aria-hidden="true">🗂</span> Dashboard' +
          '</a>' +
          '<button type="button" class="nav-avatar-item" data-nav-action="logout" role="menuitem">' +
            '<span aria-hidden="true">⎋</span> Logout' +
          '</button>' +
        '</div>';
      slot.appendChild(wrap);
      const nameEl = wrap.querySelector(".nav-avatar-name");
      const roleEl = wrap.querySelector(".nav-avatar-role");
      if (nameEl) nameEl.textContent = full;
      if (roleEl) roleEl.textContent = roleLabel;
      const avatarBtn = wrap.querySelector(".nav-avatar");
      const menu = wrap.querySelector(".nav-avatar-menu");
      const logoutBtn = wrap.querySelector('[data-nav-action="logout"]');
      if (avatarBtn) {
        avatarBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var isOpen = menu.classList.contains("open");
          closeAllMenus(isOpen ? null : wrap);
          menu.classList.toggle("open", !isOpen);
          avatarBtn.setAttribute("aria-expanded", String(!isOpen));
        });
      }
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async function (e) {
          e.preventDefault();
          e.stopPropagation();
          try {
            if (window.SmartPWDAuth && typeof window.SmartPWDAuth.logoutUser === "function") {
              await window.SmartPWDAuth.logoutUser();
            } else if (window.supabase && supabase.auth && typeof supabase.auth.signOut === "function") {
              await supabase.auth.signOut();
            }
          } catch (_) {
            try { localStorage.clear(); sessionStorage.clear(); } catch(_) {}
          }
          try {
            const loc = (window.location && window.location.pathname || "/").toLowerCase();
            if (loc.indexOf("dashboard") !== -1 || loc.indexOf("admin") !== -1 || loc.indexOf("verifier") !== -1) {
              window.location.href = "login.html";
            } else {
              window.location.reload();
            }
          } catch(_) { window.location.href = "index.html"; }
        });
      }
      bindGlobalCloseOnce();
    }
    function renderLoggedOutMenu(slot) {
      if (!slot) return;
      slot.innerHTML = "";
      const a = document.createElement("a");
      a.href = "login.html";
      a.className = "nav-login-btn";
      a.textContent = "Login";
      slot.appendChild(a);
    }
    let authListenerAttached = false;
    async function boot() {
      const slot = document.getElementById("navAuthSlot");
      if (!slot) return;
      slot.classList.add("nav-auth-slot-ready");
      let user = null;
      try {
        if (window.SmartPWDAuth && typeof SmartPWDAuth.currentUser === "function") {
          user = await SmartPWDAuth.currentUser();
        }
      } catch (_) { user = null; }
      if (!user) {
        try {
          const sb = window.supabase;
          if (sb && sb.auth && typeof sb.auth.getSession === "function") {
            const sessRes = (await sb.auth.getSession()) || {};
            const sess = (sessRes && sessRes.data && sessRes.data.session) || null;
            if (sess && sess.user) {
              const u = sess.user;
              const md = (u.user_metadata || {});
              user = {
                uid: u.id,
                email: u.email,
                firstName: md.first_name || md.firstName || "",
                lastName:  md.last_name  || md.lastName  || "",
                mobile:    md.mobile     || md.phone     || "",
                accountType: md.account_type || md.accountType || "pwd",
                role: md.role || "pwd"
              };
            }
          }
        } catch (_) { user = null; }
      }
      if (user && user.uid) renderLoggedInMenu(user, slot);
      else                   renderLoggedOutMenu(slot);
      if (!authListenerAttached) {
        try {
          if (window.supabase && supabase.auth && typeof supabase.auth.onAuthStateChange === "function") {
            authListenerAttached = true;
            supabase.auth.onAuthStateChange(function () {
              setTimeout(function () { try { boot(); } catch (_) {} }, 100);
            });
          }
        } catch (_) {}
      }
    }
    setTimeout(boot, 0);
  })();
});
