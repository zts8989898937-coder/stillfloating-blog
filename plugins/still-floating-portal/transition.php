<?php
if (!defined('ABSPATH')) {
    exit;
}

function sf_portal_theme_bootstrap() {
    ?>
<script id="still-floating-theme-bootstrap">
(function () {
  var root = document.documentElement;
  var params = new URLSearchParams(window.location.search);
  var fromPortal = params.get('from') === 'portal';
  var requestedTheme = params.get('theme');
  var saved = null;

  try { saved = window.sessionStorage.getItem('Argon_Enable_Dark_Mode'); } catch (error) {}

  var dark;
  if (fromPortal && (requestedTheme === 'dark' || requestedTheme === 'light')) {
    dark = requestedTheme === 'dark';
    try { window.sessionStorage.setItem('Argon_Enable_Dark_Mode', String(dark)); } catch (error) {}
  } else if (saved === 'true' || saved === 'false') {
    dark = saved === 'true';
  } else {
    var hour = new Date().getHours();
    dark = hour < 7 || hour >= 22;
  }

  root.classList.toggle('darkmode', dark);
  // Keep the root transparent so Argon's negative-z wallpaper remains visible.

  var style = document.createElement('style');
  style.textContent = `
    html.sf-portal-arrival::after {
      content: "";
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      opacity: 1;
      transform: translateY(0) scale(1);
      transition: opacity 350ms cubic-bezier(.22,1,.36,1),transform 520ms cubic-bezier(.22,1,.36,1);
    }
    html.sf-portal-arrival:not(.sf-arrival-ready) body > * {
      animation: none !important;
      transition: none !important;
    }
    /*
     * Do not animate transform/opacity on <body>: Argon renders the page wallpaper as
     * #content:before (position:fixed, z-index:-2). A transformed body re-anchors that
     * fixed element (the wallpaper jumps by the translate distance) and body opacity
     * multiplies with the wallpaper's own opacity, which washes it out mid-transition.
     * Instead only the page content moves; the wallpaper stays put and fully opaque.
     */
    html.sf-portal-arrival #banner,
    html.sf-portal-arrival #content > * {
      transform: translateY(18px);
      transition: transform 1050ms cubic-bezier(.22,1,.36,1);
    }
    html.sf-portal-arrival.sf-arrival-ready #banner,
    html.sf-portal-arrival.sf-arrival-ready #content > * {
      transform: translateY(0);
    }
    html.sf-portal-arrival::before {
      content: "STILL FLOATING / ENTERING";
      position: fixed;
      left: 50%;
      top: 50%;
      z-index: 10001;
      pointer-events: none;
      color: rgba(228,229,220,.72);
      font: 500 10px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;
      letter-spacing: .22em;
      white-space: nowrap;
      opacity: 1;
      transform: translate(-50%,-50%);
      transition: opacity 360ms ease-out;
    }
    html.sf-portal-arrival:not(.darkmode)::before { color: rgba(48,53,54,.62); }
    html.sf-portal-arrival.sf-arrival-ready::before { opacity: 0; }
    html.sf-portal-arrival:not(.darkmode)::after {
      background: radial-gradient(ellipse at 72% 38%,rgba(255,255,255,.58),transparent 52%),linear-gradient(135deg,#ebe7df 0%,#f3efe8 52%,#fbf9f5 100%);
    }
    html.sf-portal-arrival.darkmode::after {
      background: radial-gradient(ellipse at 72% 38%,rgba(113,135,158,.24),transparent 48%),linear-gradient(135deg,#222522 0%,#292d29 52%,#2d302d 100%);
    }
    html.sf-portal-arrival.sf-arrival-ready::after { opacity: 0; transform: translateY(-4%) scale(1.04); }
    html.sf-theme-transitions body,
    html.sf-theme-transitions .card,
    html.sf-theme-transitions #navbar-main,
    html.sf-theme-transitions #footer {
      transition: background-color 420ms ease,color 420ms ease,border-color 420ms ease;
    }
    @media (prefers-reduced-motion: reduce) {
      html.sf-portal-arrival::after,
      html.sf-portal-arrival::before,
      html.sf-portal-arrival #banner,
      html.sf-portal-arrival #content > *,
      html.sf-theme-transitions body,
      html.sf-theme-transitions .card,
      html.sf-theme-transitions #navbar-main,
      html.sf-theme-transitions #footer { transition-duration: .01ms !important; }
    }
  `;
  document.head.appendChild(style);

  if (fromPortal) root.classList.add('sf-portal-arrival');

  /*
   * Reveal as soon as the DOM is ready instead of waiting for window.load:
   * on image-heavy pages load can take seconds, and the arrival panel would keep
   * covering the wallpaper for that whole time (the "wallpaper missing on entry" flash).
   * Web fonts get a short grace period only, so they cannot delay the reveal either.
   */
  function sfStartArrival() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        window.setTimeout(function () {
          root.classList.add('sf-arrival-ready', 'sf-theme-transitions');
          window.setTimeout(function () {
            root.classList.remove('sf-portal-arrival', 'sf-arrival-ready');
          }, 1100);
        }, 60);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sfStartArrival, { once: true });
  } else {
    sfStartArrival();
  }

  if (fromPortal) {
    params.delete('from');
    params.delete('theme');
    var query = params.toString();
    var cleanURL = window.location.pathname + (query ? '?' + query : '') + window.location.hash;
    window.history.replaceState(null, '', cleanURL);
  }
})();
</script>
    <?php
}
