// background.js
let sessionID = Date.now().toString();
browser.storage.local.set({ sessionID }).then(() => {
  console.log("Session ID created:", sessionID);
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background script:", message);

  if (message.type === "watchedVideo") {
    // Stocker les informations de la vidéo regardée
    browser.storage.local.get({ watchedVideos: [], sessionID: sessionID }).then((result) => {
      const watchedVideos = result.watchedVideos;
      const videoData = {
        sessionID: result.sessionID,
        type: "watchedVideo",
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
      console.log("Storing watched video data:", videoData);
      browser.storage.local.set({ watchedVideos });
    });

  } else if (message.type === "homePage") {
    // Stocker les recommandations de la page d'accueil
    console.log("Storing homepage recommendations:", homePageRecommendations); // This should appear now
    browser.storage.local.get({ homePageRecommendations: [] }).then((result) => {
      const homePageRecommendations = result.homePageRecommendations;
      homePageRecommendations.push({
        sessionID: sessionID,
        type: "homePage",
        recommendations: message.recommendations,
        timestamp: new Date().toISOString()
      });

      console.log("Storing homepage recommendations:", homePageRecommendations);
      browser.storage.local.set({ homePageRecommendations });
    });
  }
});
