// Charger les vidéos regardées et les afficher dans l'interface utilisateur
document.addEventListener('DOMContentLoaded', function () {
  const videoList = document.getElementById('videoList');
  const toggleButton = document.getElementById('toggleButton');
  const dropdownContent = document.getElementById('dropdownContent');

  // Récupérer les vidéos regardées à partir du stockage local
  browser.storage.local.get({ watchedVideos: [] }).then(function (result) {
    const watchedVideos = result.watchedVideos;
    console.log("Videos found in storage:", watchedVideos);  // Log pour vérifier si les vidéos sont dans le stockage

    // Si des vidéos ont été trouvées
    if (watchedVideos.length > 0) {
      watchedVideos.forEach(function (title) {
        const listItem = document.createElement('li');
        listItem.classList.add('video-item');

        // Limiter le titre à 40 caractères à l'affichage
        let shortTitle = title;
        if (title.length > 40) {
          shortTitle = title.substring(0, 40) + "...";
        }

        // Créer l'élément de titre et l'ajouter à la liste
        const titleElement = document.createElement('span');
        titleElement.classList.add('video-title');
        titleElement.textContent = shortTitle;

        listItem.appendChild(titleElement);
        videoList.appendChild(listItem);

        // Ajouter un événement au clic pour afficher le titre complet
        listItem.addEventListener('click', function () {
          if (listItem.classList.contains('expanded')) {
            // Si déjà ouvert, revenir à la version tronquée
            titleElement.textContent = shortTitle;
            listItem.classList.remove('expanded');
          } else {
            // Si fermé, montrer le titre complet
            titleElement.textContent = title;
            listItem.classList.add('expanded');
          }
        });
      });
    } else {
      // Si aucune vidéo n'a été trouvée
      videoList.textContent = "No videos watched yet.";
    }
  });

  // Initialement, masquer la liste déroulante
  dropdownContent.style.display = 'none';

  // Fonction pour basculer la visibilité de la liste déroulante
  toggleButton.addEventListener('click', function () {
    if (dropdownContent.style.display === 'block') {
      dropdownContent.style.display = 'none';
      toggleButton.textContent = "Show Watched Videos";
    } else {
      dropdownContent.style.display = 'block';
      toggleButton.textContent = "Hide Watched Videos";
    }
  });
});

document.getElementById('scrapeHistoryButton').addEventListener('click', function () {
  // Ouvrir la page d'historique de YouTube dans un nouvel onglet
  browser.tabs.create({ url: 'https://www.youtube.com/feed/history' });
});