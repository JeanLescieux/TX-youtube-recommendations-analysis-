// Variables for video and homepage data tracking
let videoData = {};
let currentVideoId = null;
let watchTimeInterval = null;
let commentCheckInterval = null;
let homePageInterval = null;
let currentHomeRecommendations = []; // Store latest homepage recommendations
let hasSentHomeRecommendations = false; // Ensure data is sent only once on page exit

// Function to reset video data
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

// Function to gather recommendations
const updateRecommendations = () => {
    const recommendedElements = document.querySelectorAll('ytd-compact-video-renderer');
    videoData.recommendations = [];
    recommendedElements.forEach((element, index) => {
        if (index < 5) { // Limit to top 5 recommendations
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

// Function to send video data to background script
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
