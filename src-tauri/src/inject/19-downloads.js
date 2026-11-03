  // Downloads (the viewer's Download button, files in chats) go straight to
  // the Downloads folder, and nothing on screen said so: fMess reports each
  // one done (downloads.rs) and this shows it at the bottom of the window,
  // with a button that shows the file in its folder.
  const DOWNLOADED = 'fmess-downloaded';
  const downloadedStyle = document.createElement('style');
  downloadedStyle.textContent = `
    #${DOWNLOADED} {
      position: fixed;
      left: 50%;
      bottom: 24px;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: min(480px, calc(100vw - 32px));
      box-sizing: border-box;
      padding: 10px 10px 10px 16px;
      border-radius: 10px;
      background: rgba(28, 30, 33, 0.94);
      color: #fff;
      font: 13px/18px system-ui, -apple-system, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      transform: translate(-50%, 8px);
      opacity: 0;
      transition: opacity 0.15s, transform 0.15s;
      pointer-events: none;
    }
    /* Above the photo viewer's strip of thumbnails. */
    html[data-fmess-media] #${DOWNLOADED} { bottom: 100px; }
    #${DOWNLOADED}.shown { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
    #${DOWNLOADED} > span { flex: 1 1 auto; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    #${DOWNLOADED} > button {
      flex: none;
      padding: 4px 10px;
      border: 0;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.16);
      color: inherit;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    #${DOWNLOADED} > button:hover { background: rgba(255, 255, 255, 0.26); }
  `;
  withRoot((root) => root.append(downloadedStyle));

  let downloadedHide = 0;
  window.__fmessDownloaded = ({ ok, name, id }) => {
    let box = document.getElementById(DOWNLOADED);
    if (!box) {
      box = document.createElement('div');
      box.id = DOWNLOADED;
      box.setAttribute('role', 'status');
      // Kept while the pointer is on it, to reach the button.
      box.addEventListener('mouseenter', () => clearTimeout(downloadedHide));
      box.addEventListener('mouseleave', () => hideDownloadedSoon(2000));
      document.body.append(box);
    }
    const text = document.createElement('span');
    const file = name || say('the file', 'tệp');
    text.textContent = ok ? say(`Downloaded ${file}`, `Đã tải về ${file}`) : say(`Couldn't download ${file}`, `Không tải được ${file}`);
    text.title = text.textContent;
    box.replaceChildren(text);
    if (ok && id != null) {
      const show = document.createElement('button');
      show.type = 'button';
      show.textContent = navigator.platform.startsWith('Mac')
        ? say('Show in Finder', 'Mở trong Finder')
        : say('Show in folder', 'Mở thư mục');
      show.addEventListener('click', () => {
        invoke('show_download', { id }).catch(() => {});
        hideDownloadedSoon(0);
      });
      box.append(show);
    }
    box.getBoundingClientRect(); // so a new box slides in
    box.classList.add('shown');
    hideDownloadedSoon(6000);
  };
  const hideDownloadedSoon = (ms) => {
    clearTimeout(downloadedHide);
    downloadedHide = setTimeout(() => document.getElementById(DOWNLOADED)?.classList.remove('shown'), ms);
  };

  // A photo or video from an encrypted chat downloads from a blob: URL with
  // no file name, which WebKit saves as "Unknown", "Unknown (1)"...: it gets
  // the blob's id instead, as in Chrome (WebKit adds the extension).
  window.addEventListener(
    'click',
    (event) => {
      const link = event.target instanceof Element && event.target.closest('a[download][href^="blob:"]');
      if (link && !link.getAttribute('download')) link.setAttribute('download', link.href.split('/').pop());
    },
    true
  );
