// Variables pour stocker les informations de la vidéo
let videoData = {};
let currentVideoId = null;
let watchTimeInterval = null;
let channelObserver = null;  // MutationObserver pour le nom de la chaîne

// Fonction pour remettre à zéro les données de la vidéo, y compris le nom de la chaîne
const resetVideoData = () => {
  videoData = {
    title: null,
    channel: null, // Réinitialiser à chaque nouvelle vidéo
    channelURL: null, // Ajout pour récupérer le href de la chaîne
    videoURL: null,   // Ajout pour récupérer l'URL de la vidéo
    viewCount: null,
    watchTime: null,
    commentCount: null
  };
};

// Fonction pour observer le nom de la chaîne avec un MutationObserver et récupérer le href
const observeChannelName = () => {
  const channelElement = document.querySelector('#channel-name a.yt-simple-endpoint.style-scope.yt-formatted-string');
  
  if (channelElement) {
    if (channelObserver) {
      channelObserver.disconnect();  // Déconnecter tout observateur précédent
    }

    // Mettre à jour le nom de la chaîne et le href (URL)
    videoData.channel = channelElement.innerText;
    videoData.channelURL = channelElement.href;
    console.log(`Channel Name Loaded: ${videoData.channel}, Channel URL: ${videoData.channelURL}`);
    
    channelObserver = new MutationObserver(() => {
      const newChannelElement = document.querySelector('#channel-name a.yt-simple-endpoint.style-scope.yt-formatted-string');
      if (newChannelElement) {
        videoData.channel = newChannelElement.innerText;
        videoData.channelURL = newChannelElement.href;
        console.log(`Channel Name Updated via MutationObserver: ${videoData.channel}, Channel URL: ${videoData.channelURL}`);
      }
    });

    // Démarrer l'observation des changements dans l'élément de la chaîne
    channelObserver.observe(channelElement, { childList: true, subtree: true });
  } else {
    console.log('Channel element not found, retrying...');
  }
};

// Fonction pour mettre à jour les informations de la vidéo, vérifiant chaque seconde le temps de visionnage
const updateVideoData = () => {
  const videoTitle = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer');
  const viewCount = document.querySelector('ytd-video-primary-info-renderer span.view-count');
  const videoElement = document.querySelector('video');

  videoData.title = videoTitle ? videoTitle.innerText : null;
  videoData.viewCount = viewCount ? viewCount.innerText : null;
  videoData.videoURL = window.location.href;  // Récupérer l'URL de la vidéo actuelle

  // Vérification continue du temps de visionnage
  if (videoElement) {
    if (watchTimeInterval) {
      clearInterval(watchTimeInterval);
    }
    watchTimeInterval = setInterval(() => {
      videoData.watchTime = Math.round(videoElement.currentTime);
      console.log('Updated watch time:', videoData.watchTime);
    }, 1000); // Mise à jour chaque seconde
  }

  // Observer les changements du nom de la chaîne
  observeChannelName();

  console.log('Video data updated:', videoData);
};

// Fonction pour vérifier et mettre à jour le nombre de commentaires
const checkCommentCount = () => {
  const intervalId = setInterval(() => {
    const commentElement = document.querySelector('ytd-comments-header-renderer #count .count-text span');
    if (commentElement) {
      videoData.commentCount = commentElement.innerText.trim().replace(/\s/g, '');
      console.log('Comment Count Loaded:', videoData.commentCount);
      clearInterval(intervalId);  // Stop checking once comments are loaded
    } else {
      console.log('Waiting for comments section to load...');
    }
  }, 1000);  // Vérifie toutes les secondes
};

// Fonction pour envoyer les données de la vidéo
const sendVideoData = () => {
  console.log(`Sending video data: ${videoData.title}, ${videoData.channel}, ${videoData.channelURL}, ${videoData.videoURL}, ${videoData.viewCount}, ${videoData.commentCount}, ${videoData.watchTime}`);
  browser.runtime.sendMessage({
    videoTitle: videoData.title,
    channelName: videoData.channel,
    channelURL: videoData.channelURL, // Envoyer le href de la chaîne
    videoURL: videoData.videoURL,     // Envoyer l'URL de la vidéo
    viewCount: videoData.viewCount,
    commentCount: videoData.commentCount,
    currentWatchTime: videoData.watchTime
  }).then(() => {
    console.log("Video data sent to background script");
  }).catch(err => {
    console.error("Error sending video data:", err);
  });
};

// Fonction pour gérer le changement de vidéo
const handleVideoChange = () => {
  const newVideoId = document.querySelector('ytd-watch-flexy').getAttribute('video-id');
  
  if (newVideoId !== currentVideoId) {
    // Envoyer les données de la vidéo précédente avant de passer à la nouvelle
    if (currentVideoId) {
      sendVideoData();
    }

    // Réinitialiser les informations à chaque changement de vidéo
    currentVideoId = newVideoId;
    resetVideoData(); // Remettre à zéro toutes les données

    setTimeout(() => {
      updateVideoData();
      checkCommentCount(); // Vérifie les commentaires de manière asynchrone
    }, 1000); // Attendre que la nouvelle vidéo soit complètement chargée
  }
};

// Fonction pour observer les changements de titre ou d'ID de vidéo
const observeTitleChanges = () => {
  const titleNode = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer');

  if (titleNode) {
    console.log("Title element found, starting observation...");

    const observer = new MutationObserver(handleVideoChange);

    observer.observe(titleNode, { childList: true, subtree: true });

    // Charger les données pour la vidéo initiale
    currentVideoId = document.querySelector('ytd-watch-flexy').getAttribute('video-id');
    resetVideoData();
    updateVideoData();
    checkCommentCount();

    // S'assure que les données sont envoyées lorsque l'utilisateur quitte la page
    window.addEventListener('beforeunload', sendVideoData);
  } else {
    console.log("Title element not found, retrying...");
    setTimeout(observeTitleChanges, 1000);
  }
};

// Lancer l'observation des changements de vidéo
observeTitleChanges();
