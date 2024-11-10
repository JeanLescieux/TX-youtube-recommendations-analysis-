// Variables pour stocker les informations de la vidéo et de la page d'accueil
let videoData = {};
let currentVideoId = null;
let watchTimeInterval = null;
let commentCheckInterval = null;
let homePageInterval = null;
let hasSentHomeRecommendations = false; // Pour éviter l'envoi multiple des recommandations de la page d'accueil

// Fonction pour réinitialiser les données de la vidéo
const resetVideoData = () => {
  videoData = {
    type: "watchedVideo",
    title: null,
    channel: null,
    channelURL: null,
    videoURL: null,
    viewCount: null,
    watchTime: 0,
    commentCount: null,
    recommendations: []
  };
  console.log("Video data reset:", videoData);
};

// Fonction pour mettre à jour les informations de la vidéo regardée
const updateVideoData = () => {
  const videoTitle = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer');
  const viewCount = document.querySelector('ytd-video-primary-info-renderer span.view-count');
  const videoElement = document.querySelector('video');
  const channelElement = document.querySelector('#channel-name a.yt-simple-endpoint.style-scope.yt-formatted-string');

  videoData.title = videoTitle ? videoTitle.innerText : null;
  videoData.viewCount = viewCount ? viewCount.innerText : null;
  videoData.videoURL = window.location.href;
  videoData.channel = channelElement ? channelElement.innerText : null;
  videoData.channelURL = channelElement ? channelElement.href : null;

  console.log("Video data updated:", videoData);

  if (videoElement) {
    if (watchTimeInterval) {
      clearInterval(watchTimeInterval);
    }
    watchTimeInterval = setInterval(() => {
      videoData.watchTime = Math.round(videoElement.currentTime);
      console.log("Current watch time updated:", videoData.watchTime);
    }, 1000);

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
  updateRecommendations();
};

// Fonction pour récupérer les recommandations
const updateRecommendations = () => {
  const recommendedElements = document.querySelectorAll('ytd-compact-video-renderer');
  videoData.recommendations = [];
  recommendedElements.forEach((element, index) => {
    if (index < 5) { // Limiter aux 5 premières vidéos
      const titleElement = element.querySelector('#video-title');
      const linkElement = element.querySelector('a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer');
      const videoURL = linkElement ? `https://www.youtube.com${linkElement.getAttribute('href')}` : null;

      videoData.recommendations.push({
        title: titleElement ? titleElement.innerText : null,
        videoURL: videoURL
      });
    }
  });
  console.log("Recommendations updated:", videoData.recommendations);
};

// Fonction pour envoyer les données de la vidéo regardée
const sendVideoData = () => {
  browser.runtime.sendMessage({
    type: videoData.type,
    videoTitle: videoData.title,
    channelName: videoData.channel,
    channelURL: videoData.channelURL,
    videoURL: videoData.videoURL,
    viewCount: videoData.viewCount,
    commentCount: videoData.commentCount,
    currentWatchTime: videoData.watchTime,
    recommendations: videoData.recommendations
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
    if (currentVideoId) {
      sendVideoData();
    }
    currentVideoId = newVideoId;
    resetVideoData();
    setTimeout(() => {
      updateVideoData();
      checkCommentCount();
    }, 1000);
  }
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

// Fonction pour récupérer les recommandations de la page d'accueil
const scrapeHomeRecommendations = () => {
  let homeRecommendations = [];
  const recommendedElements = document.querySelectorAll('ytd-rich-item-renderer');
  recommendedElements.forEach((element, index) => {
    if (index < 5) { // Limiter aux 5 premières vidéos
      const titleElement = element.querySelector('#video-title');
      const channelElement = element.querySelector('#text > a');
      const linkElement = element.querySelector('a#thumbnail');

      homeRecommendations.push({
        title: titleElement ? titleElement.innerText : null,
        channel: channelElement ? channelElement.innerText : null,
        videoURL: linkElement ? `${linkElement.getAttribute('href')}` : null
      });
    }
  });
  console.log("Homepage recommendations updated locally:", homeRecommendations);

  // Stocker les recommandations dans le localStorage pour un envoi ultérieur
  browser.storage.local.set({ homePageRecommendations: homeRecommendations });
};

// Fonction pour gérer la collecte des recommandations toutes les secondes sur la page d'accueil
const startHomePageScraping = () => {
  if (homePageInterval) {
    clearInterval(homePageInterval);
  }
  homePageInterval = setInterval(scrapeHomeRecommendations, 1000);
};

// Fonction pour arrêter la collecte des recommandations et envoyer les données lors du changement de page
const stopHomePageScrapingAndSend = () => {
  if (homePageInterval) {
    clearInterval(homePageInterval);
  }
  if (!hasSentHomeRecommendations) { // Vérifier que les données ne sont envoyées qu'une seule fois
    hasSentHomeRecommendations = true; // Marquer l'envoi pour éviter les duplications
    browser.storage.local.get("homePageRecommendations").then((data) => {
      // Envoi des données de la page d'accueil
      browser.runtime.sendMessage({
        type: "homePage",
        recommendations: data.homePageRecommendations
      }).then(() => {
        console.log("Homepage recommendations sent to background script on page exit");
      }).catch(err => {
        console.error("Error sending homepage recommendations:", err);
      });
    });
  }
};

// Fonction pour détecter le type de page et gérer l'envoi unique par visite
const checkPageTypeAndScrape = () => {
  const isHomePage = window.location.pathname === '/' || window.location.pathname === '/feed/trending';

  if (isHomePage) {
    if (hasSentHomeRecommendations) {
      hasSentHomeRecommendations = false; // Réinitialiser uniquement lors d'un retour sur la page d'accueil
    }
    startHomePageScraping();
  } else {
    // Arrêter le scraping et envoyer les données
    stopHomePageScrapingAndSend();
    handleVideoChange();
  }
};

// Fonction pour observer les changements de page
const observePageChanges = () => {
  const observer = new MutationObserver(checkPageTypeAndScrape);
  observer.observe(document.body, { childList: true, subtree: true });
  checkPageTypeAndScrape(); // Vérification initiale lors du chargement de la page
};

// Lancer l'observation des changements de page
observePageChanges();
