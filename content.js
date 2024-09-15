// Fonction pour obtenir le titre de la vidéo
const getVideoTitle = () => {
    const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
    return titleElement ? titleElement.innerText : null;
  };
  
  // Fonction pour envoyer le titre au script d'arrière-plan
  const sendVideoTitle = () => {
    const videoTitle = getVideoTitle();
    if (videoTitle) {
      console.log(`Video title found: ${videoTitle}`);
      browser.runtime.sendMessage({ videoTitle }).then(() => {
        console.log("Message sent to background script");
      }).catch(err => {
        console.error("Error sending message:", err);
      });
    }
  };
  
  // Fonction pour observer les changements dans le titre de la vidéo
  const observeTitleChanges = () => {
    const targetNode = document.querySelector('h1.style-scope.ytd-watch-metadata');
  
    if (targetNode) {
      console.log("Title element found, starting observation...");
      
      // Création d'un observer pour suivre les changements
      const observer = new MutationObserver(() => {
        sendVideoTitle();
      });
  
      // Observer les changements dans l'élément titre
      observer.observe(targetNode, { childList: true, subtree: true });
  
      // Envoyer le titre actuel dès que l'observation commence
      sendVideoTitle();
    } else {
      console.log("Title element not found, retrying...");
      setTimeout(observeTitleChanges, 1000);  // Réessayer après 1 seconde
    }
  };
  
  // Fonction pour configurer l'observation et détecter les nouveaux titres de vidéos
  const setupVideoDetection = () => {
    observeTitleChanges();  // Démarrer l'observation des changements de titre
  };
  
  // Détecter les changements dans l'historique de navigation (SPA)
  window.addEventListener('popstate', () => {
    console.log("Navigation detected, rechecking video title");
    setTimeout(setupVideoDetection, 1000);  // Attendre que le nouveau contenu soit chargé
  });
  
  // Exécuter la détection au chargement initial
  setupVideoDetection();
  