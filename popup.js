// Charger les vidéos regardées et les afficher dans l'interface utilisateur
browser.storage.local.get({ watchedVideos: [] }).then(function (result) {
    const videoList = document.getElementById('videoList');
    const watchedVideos = result.watchedVideos;
    console.log("Videos found in storage:", watchedVideos);  // Log pour vérifier si les vidéos sont dans le stockage
  
    if (watchedVideos.length > 0) {
      watchedVideos.forEach(function (title) {
        const listItem = document.createElement('li');
        listItem.textContent = title;
        videoList.appendChild(listItem);
      });
    } else {
      videoList.textContent = "No videos watched yet.";
    }
  });
  