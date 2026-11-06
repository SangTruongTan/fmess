  // The theme picked in Settings: CSS fMess has checked (see themes.rs), kept
  // last in the page so it wins over Facebook's. A light theme ("mode: light")
  // also gets Facebook's light colours in dark mode, copied from Facebook's
  // own stylesheets.
  const THEME = 'fmess-theme';
  let theme = null;
  // Under every theme. The bar above the message box (replying, a link's
  // preview) has fixed heights made for Facebook's type; a theme's larger
  // type overflowed them, its second line on the line below.
  const UNDER_EVERY_THEME = `
    html[${CHATS}] [data-fmess-ui="composer-bar"],
    html[${CHATS}] [data-fmess-ui="composer-bar"] > div,
    html[${CHATS}] [data-fmess-ui="composer-bar"] > div > div { height: auto !important; }
    html[${CHATS}] [data-fmess-ui="composer-bar"] > div { padding-bottom: 8px !important; }
  `;
  const lightColours = () => {
    let colours = '';
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of rules ?? []) {
        if (!/__fb-light-mode/.test(rule.selectorText || '') || !(rule.style?.length > 100)) continue;
        for (const name of rule.style) if (name.startsWith('--')) colours += `${name}: ${rule.style.getPropertyValue(name)} !important;`;
      }
    }
    return colours ? `.__fb-dark-mode { ${colours} color-scheme: light; }\n` : '';
  };
  // Not in call windows (popups): their screens are Facebook's dark ones, and
  // a theme's colours, made for the chats, left dark text on black there and
  // white on white.
  const applyTheme = (next) => {
    theme = next?.css && !window.opener ? next : null;
    // What the last theme asked for goes now, not at the next hover: its
    // quick reactions, and its buttons are read again.
    for (const group of document.querySelectorAll('.fmess-quick-reactions')) group.remove();
    quickReactions.at = 0;
    windowButtons.at = 0;
    withRoot((root) => {
      let style = document.getElementById(THEME);
      if (!theme) return style?.remove();
      if (!style) {
        style = document.createElement('style');
        style.id = THEME;
      }
      style.textContent = (theme.light ? lightColours() : '') + UNDER_EVERY_THEME + theme.css;
      root.append(style);
    });
  };
  applyTheme(settings.theme);
  // Facebook's stylesheets (and their light colours) arrive with the page.
  window.addEventListener('load', () => theme && applyTheme(theme));

  // The font picked in Settings (#42), for Messenger's text and the message
  // box. Facebook sets its fonts on each element through many variables, so
  // this sets the font on the elements themselves, as the themes do, and
  // :root gives it more weight than a theme's font. Then the system's font,
  // for the letters the font lacks, and the emoji fonts.
  const FONT = 'fmess-font';
  const fontStack = (font) => {
    const families = String(font ?? '')
      .split(',')
      .map((family) => family.trim().replace(/^["']|["']$/g, '').replace(/["\\\n]/g, ''))
      .filter(Boolean);
    if (!families.length) return null;
    return [
      ...families.map((family) => `"${family}"`),
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"',
    ].join(', ');
  };
  const applyFont = (font) => {
    const stack = fontStack(font);
    withRoot((root) => {
      let style = document.getElementById(FONT);
      if (!stack) return style?.remove();
      if (!style) {
        style = document.createElement('style');
        style.id = FONT;
      }
      style.textContent = `
        html:root,
        html:root body,
        html:root :is(div, span, a, p, h1, h2, h3, h4, h5, h6, li, input, textarea, button, label) {
          font-family: ${stack} !important;
        }
      `;
      if (!style.isConnected) root.append(style);
    });
  };
  applyFont(settings.font);

  // Called by fMess after every page load and when its settings change.
  window.__fmessApplySettings = (next) => {
    privacy.blockTyping = Boolean(next.blockTyping);
    language = next.lang;
    setHideAvatars(Boolean(next.hideAvatars));
    setSpellCheck(next.spellCheck !== false);
    if (next.theme?.css !== theme?.css || Boolean(next.theme?.light) !== Boolean(theme?.light)) applyTheme(next.theme);
    applyFont(next.font);
  };
})();
