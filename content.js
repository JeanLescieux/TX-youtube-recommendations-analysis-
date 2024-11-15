// Variables for video and homepage data tracking
let videoData = {};
let currentVideoId = null;
let watchTimeInterval = null;
let commentCheckInterval = null;
let homePageInterval = null;
let currentHomeRecommendations = []; // Store latest homepage recommendations
let hasSentHomeRecommendations = false; // Ensure data is sent only once on page exit
let uniqueVideoID = null; // ID unique pour la session de visionnage

// Fonction pour générer un ID unique (timestamp)
const generateUniqueVideoID = () => {
    return Date.now();
};

// Function to reset video data
const resetVideoData = () => {
    uniqueVideoID = generateUniqueVideoID();
    videoData = {
        id: uniqueVideoID,
        type: "Video",
        title: null,
        channel: null,
        channelURL: null,
        videoURL: null,
        viewCount: null,
        watchTime: 0,
        commentCount: null,
        recommendedFrom: []
    };
    console.log("Video data reset:", videoData);
};

// Function to update video data
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
    }
    updateRecommendations();
};

// Fonction pour recueillir les recommandations sous le même format que la vidéo
const updateRecommendations = () => {
    const recommendedElements = document.querySelectorAll('ytd-compact-video-renderer');
    currentHomeRecommendations = [];  // On vide les anciennes recommandations

    const recommendedFromInfo = {
        id: uniqueVideoID,
        title: videoData.title,
        videoURL: videoData.videoURL
    };

    recommendedElements.forEach((element, index) => {
        if (index < 5) { // Limiter à 15 recommandations
            const titleElement = element.querySelector('#video-title');
            const linkElement = element.querySelector('a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer');
            const videoURL = linkElement ? `https://www.youtube.com${linkElement.getAttribute('href')}` : null;
            
            const recommendation = {
                id: uniqueVideoID,
                type: "Video",  // Remplacer "watchedVideo" par "Video" pour chaque recommandation
                title: titleElement ? titleElement.innerText : null,
                videoURL: videoURL,
                channel: null,  // Pas d'autres données disponibles pour les recommandations
                channelURL: null,
                viewCount: null,
                watchTime: null,
                commentCount: null,
                recommendedFrom: [recommendedFromInfo]
            };

            currentHomeRecommendations.push(recommendation);
        }
    });

    console.log("Recommendations updated:", currentHomeRecommendations);
};

// Fonction pour envoyer les données de la vidéo au script de fond
const sendVideoData = () => {
    // Envoi de la vidéo regardée
    browser.runtime.sendMessage({
        id: videoData.id,
        type: videoData.type,
        videoTitle: videoData.title,
        channelName: videoData.channel,
        channelURL: videoData.channelURL,
        videoURL: videoData.videoURL,
        viewCount: videoData.viewCount,
        commentCount: videoData.commentCount,
        currentWatchTime: videoData.watchTime,
        recommendedFrom: videoData.recommendedFrom
    }).then(() => {
        console.log("Video data sent to background script", videoData);
    }).catch(err => {
        console.error("Error sending video data:", err);
    });

    // Envoi des recommandations sous le même format
    currentHomeRecommendations.forEach((recommendation) => {
        browser.runtime.sendMessage({
            id: recommendation.id,
            type: recommendation.type,
            videoTitle: recommendation.title,
            channelName: recommendation.channel,
            channelURL: recommendation.channelURL,
            videoURL: recommendation.videoURL,
            viewCount: recommendation.viewCount,
            commentCount: recommendation.commentCount,
            currentWatchTime: recommendation.watchTime,
            recommendedFrom: recommendation.recommendedFrom
        }).then(() => {
            console.log("Recommendation sent to background script:", recommendation);
        }).catch(err => {
            console.error("Error sending recommendation:", err);
        });
    });
};

// Function to handle video change
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

// Function to check and update the number of comments with a retry mechanism
const checkCommentCount = () => {
  if (commentCheckInterval) clearInterval(commentCheckInterval); // Clear any previous interval

  commentCheckInterval = setInterval(() => {
      const commentElement = document.querySelector('ytd-comments-header-renderer #count .count-text span');
      
      if (commentElement) {
          const newCommentCount = commentElement.innerText.trim().replace(/\s/g, '');
          if (videoData.commentCount !== newCommentCount) {
              videoData.commentCount = newCommentCount;
              console.log("Comment count updated:", videoData.commentCount);
          } else {
              console.log("No change in comment count:", videoData.commentCount);
          }
          
          clearInterval(commentCheckInterval); // Stop checking once the comment count is retrieved
      } else {
          console.log("Comment element not yet available, retrying...");
      }
  }, 1000); // Retry every second until the comment count is found
};


// Function to continuously scrape homepage recommendations and update the variable every second
const scrapeHomeRecommendations = () => {
    let homeRecommendations = [];
    const recommendedElements = document.querySelectorAll('ytd-rich-item-renderer');

    recommendedElements.forEach((element, index) => {
        if (index < 5) { // Limit to the top 5 recommendations
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

    // Update the currentHomeRecommendations variable with the latest data
    currentHomeRecommendations = homeRecommendations;
    console.log("Homepage recommendations updated:", currentHomeRecommendations);
};

// Function to start scraping homepage recommendations every second
const startHomePageScraping = () => {
    if (homePageInterval) clearInterval(homePageInterval); // Clear any previous interval
    homePageInterval = setInterval(scrapeHomeRecommendations, 1000); // Scrape every second
    hasSentHomeRecommendations = false; // Reset the flag when entering the homepage
};

// Function to stop scraping and send data once when leaving the homepage
const stopHomePageScrapingAndSend = () => {
    if (homePageInterval) clearInterval(homePageInterval); // Stop the interval
    if (!hasSentHomeRecommendations && currentHomeRecommendations.length > 0) { // Ensure data is sent only once
        hasSentHomeRecommendations = true; // Mark as sent

        // Send the currentHomeRecommendations to the background script
        browser.runtime.sendMessage({
            type: "homePage",
            recommendations: currentHomeRecommendations
        }).then(() => {
            console.log("Homepage recommendations sent on page exit:", currentHomeRecommendations);
        }).catch(err => {
            console.error("Error sending homepage recommendations:", err);
        });
    }
};

// Function to check the page type and control scraping
const checkPageTypeAndScrape = () => {
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/feed/trending';

    if (isHomePage) {
        startHomePageScraping();
    } else {
        stopHomePageScrapingAndSend();
        handleVideoChange();
    }
};

// Set up a MutationObserver to detect page changes
const observePageChanges = () => {
    const observer = new MutationObserver(checkPageTypeAndScrape);
    observer.observe(document.body, { childList: true, subtree: true });
    checkPageTypeAndScrape(); // Initial check on page load
};

// Start observing page changes
observePageChanges();
