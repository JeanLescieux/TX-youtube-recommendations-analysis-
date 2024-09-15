browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log("Message received in background script:", message);
    if (message.videoTitle) {
      browser.storage.local.get({ watchedVideos: [] }).then(function (result) {
        const watchedVideos = result.watchedVideos;
        watchedVideos.push(message.videoTitle);
        console.log("Storing video title:", message.videoTitle);  // Log pour vérifier si le titre est bien stocké
        browser.storage.local.set({ watchedVideos });
      });
    }
  });
  