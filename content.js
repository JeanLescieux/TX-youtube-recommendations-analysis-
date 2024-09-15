// Fonction pour obtenir le titre de la vidéo regardée
const getVideoTitle = () => {
    const titleElement = document.querySelector('h1.title');
    return titleElement ? titleElement.innerText : null;
  };
  
  // Récupérer le titre de la vidéo et l'envoyer à background.js
  const videoTitle = getVideoTitle();
  if (videoTitle) {
    chrome.runtime.sendMessage({ videoTitle });
  }
  