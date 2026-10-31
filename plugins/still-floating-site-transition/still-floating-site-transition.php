<?php
/**
 * Plugin Name: Still Floating Site Transition
 * Description: 在主站样式加载前确定日夜主题，并衔接入口页的浅色或深色渐变。
 * Version: 1.2.0
 */

if (!defined('ABSPATH')) {
    exit;
}

function still_floating_site_transition_bootstrap() {
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
  root.style.backgroundColor = dark ? '#222522' : '#ebe7df';

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
      transition: opacity 900ms cubic-bezier(.22,1,.36,1),transform 1050ms cubic-bezier(.22,1,.36,1);
    }
    html.sf-portal-arrival:not(.sf-arrival-ready) body > * {
      animation: none !important;
      transition: none !important;
    }
    html.sf-portal-arrival body {
      transform: translateY(22px);
      opacity: .65;
      transition: transform 1050ms cubic-bezier(.22,1,.36,1),opacity 900ms ease-out;
    }
    html.sf-portal-arrival.sf-arrival-ready body {
      transform: translateY(0);
      opacity: 1;
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
      html.sf-portal-arrival body,
      html.sf-theme-transitions body,
      html.sf-theme-transitions .card,
      html.sf-theme-transitions #navbar-main,
      html.sf-theme-transitions #footer { transition-duration: .01ms !important; }
    }
  `;
  document.head.appendChild(style);

  if (fromPortal) root.classList.add('sf-portal-arrival');

  window.addEventListener('load', function () {
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.catch(function () {}).then(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          window.setTimeout(function () {
            root.classList.add('sf-arrival-ready', 'sf-theme-transitions');
            window.setTimeout(function () {
              root.classList.remove('sf-portal-arrival', 'sf-arrival-ready');
            }, 1100);
          }, 120);
        });
      });
    });
  }, { once: true });

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
add_action('wp_head', 'still_floating_site_transition_bootstrap', 0);
