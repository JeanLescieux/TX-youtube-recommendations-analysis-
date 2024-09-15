const getVideoTitle = () => {
    const titleElement = document.querySelector('h1.title yt-formatted-string');
    return titleElement ? titleElement.innerText : null;
  };
  
  const checkForVideoTitle = () => {
    const videoTitle = getVideoTitle();
    if (videoTitle) {
      console.log(`Video title found: ${videoTitle}`);  // Vérifier si le titre est récupéré
      browser.runtime.sendMessage({ videoTitle }).then(() => {
        console.log("Message sent to background script");
      }).catch(err => {
        console.error("Error sending message:", err);
      });
    } else {
      console.log("No video title found, retrying...");
      setTimeout(checkForVideoTitle, 1000);
    }
  };
  
  checkForVideoTitle();
  