  // Back from sleep. While the computer sleeps, the page's connections to
  // Facebook can die without the page noticing: after a night's sleep,
  // messages sent in the morning sat at "Sending" until the page was
  // reloaded by hand. So the main window reloads itself after the computer
  // has slept five minutes or more, as Ferdium does (reloadAfterResume), once
  // Facebook answers again. Messages left waiting go out after the reload.
  // Sleep shows as a jump in the clock between two ticks of a timer, since
  // timers don't run while the computer sleeps; a hidden page's timers can
  // run late, but by about a minute (Chromium's), well under five.
  // A message being typed is let be until it's sent: an empty message box.
  if (!window.opener) {
    const WAKE = { tickMs: 15_000, sleptMs: 5 * 60_000, retryMs: 3_000 };
    const wakeNote = (text) => window.__fmessErrors?.push(`wake: ${text}`);
    try {
      const wokeAt = sessionStorage.getItem('fmess.wokeAt');
      if (wokeAt) {
        sessionStorage.removeItem('fmess.wokeAt');
        wakeNote(`reloaded after waking (${Date.now() - Number(wokeAt)} ms)`);
      }
    } catch {}
    let lastTick = Date.now();
    let reloading = false;
    const typing = () => {
      const box = document.activeElement;
      return Boolean(box?.isContentEditable && box.textContent.trim());
    };
    const answering = () =>
      fetch('/favicon.ico', { cache: 'no-store', credentials: 'omit' }).then(
        (response) => response.ok,
        () => false,
      );
    const reloadWhenReady = async () => {
      if (!typing() && navigator.onLine !== false && (await answering())) {
        wakeNote('reloading');
        try {
          sessionStorage.setItem('fmess.wokeAt', String(Date.now()));
        } catch {}
        location.reload();
        return;
      }
      setTimeout(reloadWhenReady, WAKE.retryMs);
    };
    const checkAwake = (now = Date.now()) => {
      const slept = now - lastTick - WAKE.tickMs;
      lastTick = now;
      if (slept < WAKE.sleptMs || reloading) return;
      reloading = true;
      wakeNote(`slept ${Math.round(slept / 1000)} s`);
      reloadWhenReady();
    };
    setInterval(checkAwake, WAKE.tickMs);
    // Probes: a tick as if the computer had slept.
    if (window.__fmessDebug) window.__fmessCheckAwake = checkAwake;
  }

