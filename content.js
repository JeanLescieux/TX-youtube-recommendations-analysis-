// Variables pour stocker les informations de la vidéo
let videoData = {};
let currentVideoId = null;
let watchTimeInterval = null;
let commentCheckInterval = null; // Intervalle pour vérifier les commentaires

// Fonction pour remettre à zéro les données de la vidéo
const resetVideoData = () => {
  videoData = {
    title: null,
    channel: null,
    channelURL: null,
    videoURL: null,
    viewCount: null,
    watchTime: 0,
    commentCount: null
  };
  console.log("Video data reset:", videoData);
};

// Fonction pour mettre à jour les informations de la vidéo
const updateVideoData = () => {
  const videoTitle = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer');
  const viewCount = document.querySelector('ytd-video-primary-info-renderer span.view-count');
  const videoElement = document.querySelector('video');
  const channelElement = document.querySelector('#channel-name a.yt-simple-endpoint.style-scope.yt-formatted-string');

  // Mettre à jour les données sans vérifications répétées
  videoData.title = videoTitle ? videoTitle.innerText : null;
  videoData.viewCount = viewCount ? viewCount.innerText : null;
  videoData.videoURL = window.location.href;
  videoData.channel = channelElement ? channelElement.innerText : null;
  videoData.channelURL = channelElement ? channelElement.href : null;

  console.log("Video data updated:", videoData);

  // Démarrer le suivi du temps de visionnage si l'élément vidéo existe
  if (videoElement) {
    if (watchTimeInterval) {
      clearInterval(watchTimeInterval);
    }

    watchTimeInterval = setInterval(() => {
      videoData.watchTime = Math.round(videoElement.currentTime);
      console.log("Current watch time updated:", videoData.watchTime);
    }, 1000); // Mise à jour chaque seconde

    // Observer l'événement play pour commencer le suivi
    videoElement.addEventListener('play', () => {
      if (watchTimeInterval) {
        clearInterval(watchTimeInterval);
      }
      watchTimeInterval = setInterval(() => {
        videoData.watchTime = Math.round(videoElement.currentTime);
        console.log("Current watch time during playback:", videoData.watchTime);
      }, 1000);
    });
  }

  // Observer les changements du nom de la chaîne
  observeChannelName();
};

// Fonction pour vérifier et mettre à jour le nombre de commentaires
const checkCommentCount = () => {
  const commentElement = document.querySelector('ytd-comments-header-renderer #count .count-text span');
  if (commentElement) {
    const newCommentCount = commentElement.innerText.trim().replace(/\s/g, '');
    if (videoData.commentCount !== newCommentCount) {
      videoData.commentCount = newCommentCount;
      console.log("Comment count updated:", videoData.commentCount);
    } else {
      console.log("No change in comment count:", videoData.commentCount);
    }
  } else {
    console.log("Comment element not found yet.");
  }
};

// Fonction pour envoyer les données de la vidéo
const sendVideoData = () => {
  browser.runtime.sendMessage({
    videoTitle: videoData.title,
    channelName: videoData.channel,
    channelURL: videoData.channelURL,
    videoURL: videoData.videoURL,
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
    resetVideoData();
    setTimeout(() => {
      updateVideoData();
      checkCommentCount();
    }, 1000); // Attendre que la nouvelle vidéo soit complètement chargée
  }
};

// Fonction pour observer les changements de vidéo via l'ID
const observeVideoChanges = () => {
  const videoElement = document.querySelector('ytd-watch-flexy');
  if (videoElement) {
    const observer = new MutationObserver(handleVideoChange);
    observer.observe(videoElement, { attributes: true, attributeFilter: ['video-id'] });

    // Initialiser les données pour la première vidéo
    currentVideoId = videoElement.getAttribute('video-id');
    resetVideoData();
    updateVideoData();
    checkCommentCount();

    // S'assurer que les données sont envoyées lors de la fermeture de la page
    window.addEventListener('beforeunload', sendVideoData);

    // Démarrer le contrôle des commentaires
    commentCheckInterval = setInterval(checkCommentCount, 1000); // Vérifier toutes les secondes
  } else {
    setTimeout(observeVideoChanges, 1000);
  }
};

// Fonction pour observer le changement de nom de la chaîne
const observeChannelName = () => {
  const channelElement = document.querySelector('#channel-name a.yt-simple-endpoint.style-scope.yt-formatted-string');
  if (channelElement) {
    const observer = new MutationObserver(() => {
      videoData.channel = channelElement.innerText;
      videoData.channelURL = channelElement.href;
      console.log("Channel name updated:", videoData.channel);
    });
    observer.observe(channelElement, { childList: true, subtree: true });
  }
};

// Lancer l'observation des changements de vidéo
observeVideoChanges();
