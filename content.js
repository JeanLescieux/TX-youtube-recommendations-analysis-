// Fonction pour obtenir le titre de la vidéo
const getVideoTitle = () => {
  const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
  return titleElement ? titleElement.innerText : null;
};

// Fonction pour obtenir le nom de la chaîne YouTube
const getChannelName = () => {
  const channelElement = document.querySelector('a.yt-simple-endpoint.style-scope.yt-formatted-string');
  return channelElement ? channelElement.innerText : null;
};

// Fonction pour obtenir le nombre de vues
const getViewCount = () => {
  const viewsElement = document.querySelector('.view-count.style-scope.ytd-video-view-count-renderer');
  return viewsElement ? viewsElement.innerText : null;
};

// Fonction pour obtenir le nombre de commentaires
const getCommentCount = () => {
  const commentElement = document.querySelector('#count .style-scope.yt-formatted-string');
  
  if (commentElement) {
      const commentText = commentElement.textContent.trim(); // Get the full text (e.g., "1 commentaire")
      const commentNumber = commentText.split(' ')[0]; // Split and take the first part, which is the number
      return commentNumber;
  } else {
      return null;
  }
};



// Fonction pour obtenir le temps de visionnage actuel de la vidéo
const getCurrentWatchTime = () => {
  const videoElement = document.querySelector('video');
  return videoElement ? Math.round(videoElement.currentTime) : 0;
};

// Fonction pour ignorer les publicités
const isAdPlaying = () => {
  const adIndicator = document.querySelector('.ytp-ad-player-overlay');
  return adIndicator !== null;
};

// Fonction pour envoyer toutes les informations vidéo au script d'arrière-plan
const sendVideoData = () => {
  if (isAdPlaying()) {
      console.log("Advertisement detected, skipping data collection.");
      return; // Skip sending data if an ad is playing
  }

  const videoTitle = getVideoTitle();
  const channelName = getChannelName();
  const viewCount = getViewCount();
  const commentCount = getCommentCount();
  const currentWatchTime = getCurrentWatchTime();  // temps en secondes

  if (videoTitle) {
      console.log(`Sending video data: ${videoTitle}, ${channelName}, ${viewCount}, ${commentCount}, ${currentWatchTime}`);
      browser.runtime.sendMessage({
          videoTitle,
          channelName,
          viewCount,
          commentCount,
          currentWatchTime
      }).then(() => {
          console.log("Video data sent to background script");
      }).catch(err => {
          console.error("Error sending video data:", err);
      });
  }
};

// Modifier la fonction d'observation pour envoyer les données lorsque l'utilisateur quitte la vidéo
const observeTitleChanges = () => {
  const targetNode = document.querySelector('h1.style-scope.ytd-watch-metadata');

  if (targetNode) {
      console.log("Title element found, starting observation...");
      const observer = new MutationObserver(() => {
          sendVideoData();
      });

      observer.observe(targetNode, { childList: true, subtree: true });
      sendVideoData();

      // Track when the user leaves the page
      window.addEventListener('beforeunload', sendVideoData);
  } else {
      console.log("Title element not found, retrying...");
      setTimeout(observeTitleChanges, 1000);
  }
};

// Exécuter la détection au chargement initial
observeTitleChanges();
