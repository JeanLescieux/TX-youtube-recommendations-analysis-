// background.js
let sessionID = Date.now().toString(); // Unique session ID based on timestamp

// Store the session ID at the beginning
browser.storage.local.set({ sessionID }).then(() => {
    console.log("Session ID created:", sessionID);
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background script:", message);

  if (message.videoTitle) {
    browser.storage.local.get({ watchedVideos: [], sessionID: sessionID }).then((result) => {
      const watchedVideos = result.watchedVideos;
      
      const videoData = {
        sessionID: result.sessionID,
        title: message.videoTitle,
        channel: message.channelName,
        channelURL: message.channelURL,
        videoURL: message.videoURL,
        views: message.viewCount,
        comments: message.commentCount,
        watchTime: message.currentWatchTime,
        recommendations: message.recommendations
      };

      watchedVideos.push(videoData);
      console.log("Storing video data with session ID in local storage:", videoData);

      browser.storage.local.set({ watchedVideos }, () => {
        console.log("Video data with session ID stored successfully.");
      });
    }).catch(err => {
      console.error("Error retrieving local storage:", err);
    });
  } else {
    console.log("No video title received in the background script.");
  }
});

