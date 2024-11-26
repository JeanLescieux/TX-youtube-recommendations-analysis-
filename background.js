// background.js
let sessionID = Date.now().toString();
browser.storage.local.set({ sessionID }).then(() => {
  console.log("Session ID created:", sessionID);
});

browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({
    trackHomePageRec: "enabled",
    trackWatchedVideos: "enabled",
    trackViewingTime: "enabled",
    trackSideRecommendations: "enabled"
  }).then(() => {
      console.log("Permissions initialisées avec les valeurs par défaut.");
  });
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background script:", message);

  if (message.type === "watchedVideo") {
    // Store watched video data with sessionID
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
    // Store homepage recommendations as a single entry with sessionID and timestamp
    browser.storage.local.get({ homePageRecommendations: [], sessionID: sessionID }).then((result) => {
        const homePageRecommendations = result.homePageRecommendations;

        const homePageData = {
            sessionID: result.sessionID,             // Overall session ID for this homepage session
            type: "homePage",
            recommendations: message.recommendations, // Store all five recommendations in one array
            timestamp: new Date().toISOString()      // Add a timestamp
        };

        homePageRecommendations.push(homePageData);
        console.log("Storing homepage recommendations with sessionID as a single array:", homePageData);
        browser.storage.local.set({ homePageRecommendations });
    });
}

});
