browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("Message received in background script:", message);

  if (message.videoTitle) {
      browser.storage.local.get({ watchedVideos: [] }).then(function (result) {
          const watchedVideos = result.watchedVideos;
          const videoData = {
              title: message.videoTitle,
              channel: message.channelName,
              views: message.viewCount,
              comments: message.commentCount,
              watchTime: message.currentWatchTime
          };
          watchedVideos.push(videoData);
          console.log("Storing video data:", videoData);  // Log for debugging
          browser.storage.local.set({ watchedVideos });
      });
  }
});
