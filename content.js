const getVideoTitle = () => {
    // Recherche du titre de la vidéo à partir de l'élément DOM spécifique
    const titleElement = document.querySelector('h1.title yt-formatted-string');
    return titleElement ? titleElement.innerText : null;
  };
  
  const checkForVideoTitle = () => {
    const videoTitle = getVideoTitle();
    if (videoTitle) {
      console.log(`Video title found: ${videoTitle}`);  // Log pour vérifier si le titre est récupéré
      browser.runtime.sendMessage({ videoTitle });
    } else {
      console.log("No video title found, retrying...");
      // Réessayer après un certain temps si le titre n'est pas encore disponible
      setTimeout(checkForVideoTitle, 1000);
    }
  };
  
  // Lancer la vérification
  checkForVideoTitle();
  