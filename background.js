// Réception des messages envoyés par content.js
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background script:", message);
  
    if (message.videoTitle) {
      // Stockage des informations vidéo dans le local storage
      browser.storage.local.get({ watchedVideos: [] }).then((result) => {
        const watchedVideos = result.watchedVideos;
  
        // Préparer les nouvelles données vidéo
        const videoData = {
          title: message.videoTitle,
          channel: message.channelName,
          views: message.viewCount,
          comments: message.commentCount,
          watchTime: message.currentWatchTime  // Stocker le temps de visionnage
        };
  
        watchedVideos.push(videoData);
        console.log("Storing video data in local storage:", videoData);
  
        browser.storage.local.set({ watchedVideos }, () => {
          console.log("Video data successfully stored.");
        });
      }).catch(err => {
        console.error("Error retrieving local storage:", err);
      });
    } else {
      console.log("No video title received in the background script.");
    }
  });
  