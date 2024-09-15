browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.videoTitle) {
      browser.storage.local.get({ watchedVideos: [] }).then(function (result) {
        const watchedVideos = result.watchedVideos;
        watchedVideos.push(message.videoTitle);
        browser.storage.local.set({ watchedVideos });
      });
    }
  });
  