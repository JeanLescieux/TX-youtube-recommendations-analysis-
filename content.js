const getVideoTitle = () => {
    // Sélecteur mis à jour basé sur l'élément que tu as partagé
    const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
    return titleElement ? titleElement.innerText : null;
  };
  
  const checkForVideoTitle = () => {
    const videoTitle = getVideoTitle();
    if (videoTitle) {
      console.log(`Video title found: ${videoTitle}`);  // Vérifie si le titre est trouvé
      browser.runtime.sendMessage({ videoTitle }).then(() => {
        console.log("Message sent to background script");
      }).catch(err => {
        console.error("Error sending message:", err);
      });
    } else {
      console.log("No video title found, retrying...");
      setTimeout(checkForVideoTitle, 1000);  // Réessayer après 1 seconde si le titre n'est pas trouvé
    }
  };
  
  checkForVideoTitle();
  