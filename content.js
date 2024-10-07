// Variables pour stocker les informations de la vidéo
let videoData = {};
let currentVideoId = null;
let watchTimeInterval = null;
let channelCheckInterval = null;  // Ajout pour la vérification continue du nom de la chaîne

// Fonction pour remettre à zéro les données de la vidéo
const resetVideoData = () => {
  videoData = {
    title: null,
    channel: null,
    viewCount: null,
    watchTime: null,
    commentCount: null
  };
};

// Fonction pour récupérer le nom de la chaîne de manière asynchrone
const checkChannelName = () => {
  if (channelCheckInterval) {
    clearInterval(channelCheckInterval);
  }

  channelCheckInterval = setInterval(() => {
    const channelElement = document.querySelector('#channel-name a.yt-simple-endpoint.style-scope.yt-formatted-string');
    if (channelElement) {
      videoData.channel = channelElement.innerText;
      console.log('Channel Name Loaded:', videoData.channel);
      clearInterval(channelCheckInterval);  // Stop checking once the channel name is loaded
    } else {
      console.log('Waiting for channel name to load...');
    }
  }, 1000);  // Vérifie toutes les secondes
};

// Fonction pour mettre à jour les informations de la vidéo, vérifiant chaque seconde le temps de visionnage
const updateVideoData = () => {
  // Sélectionner uniquement les éléments présents sur la page de visionnage d'une vidéo
  const videoTitle = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer');
  const viewCount = document.querySelector('ytd-video-primary-info-renderer span.view-count');  // Correctif pour le nombre de vues
  const videoElement = document.querySelector('video');

  videoData.title = videoTitle ? videoTitle.innerText : null;
  videoData.viewCount = viewCount ? viewCount.innerText : null;  // Mise à jour correcte du nombre de vues
  
  // Vérification continue du temps de visionnage
  if (videoElement) {
    if (watchTimeInterval) {
      clearInterval(watchTimeInterval);
    }
    watchTimeInterval = setInterval(() => {
      videoData.watchTime = Math.round(videoElement.currentTime);  // Temps mis à jour toutes les secondes
      console.log('Updated watch time:', videoData.watchTime);
    }, 1000); // Mise à jour chaque seconde
  }

  // Vérification continue du nom de la chaîne
  checkChannelName();

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
  console.log(`Sending video data: ${videoData.title}, ${videoData.channel}, ${videoData.viewCount}, ${videoData.commentCount}, ${videoData.watchTime}`);
  browser.runtime.sendMessage({
    videoTitle: videoData.title,
    channelName: videoData.channel,
    viewCount: videoData.viewCount,
    commentCount: videoData.commentCount,  // Null si les commentaires ne sont pas chargés
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

    // Réinitialiser les informations et récupérer les nouvelles données
    currentVideoId = newVideoId;
    resetVideoData();
    updateVideoData();
    checkCommentCount();  // Vérifie les commentaires de manière asynchrone
  }
};

// Fonction pour observer les changements de titre ou d'ID de vidéo
const observeTitleChanges = () => {
  const targetNode = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer');

  if (targetNode) {
    console.log("Title element found, starting observation...");

    const observer = new MutationObserver(handleVideoChange);

    observer.observe(targetNode, { childList: true, subtree: true });

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
