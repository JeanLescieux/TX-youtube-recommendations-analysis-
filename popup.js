console.log('popup.js est bien chargé');

document.addEventListener('DOMContentLoaded', function () {
    const videoList = document.getElementById('videoList');
    const analysisButton = document.getElementById('analysisButton');

    // Fonction pour charger et afficher les vidéos
    function loadAndDisplayVideos() {
        browser.storage.local.get({ watchedVideos: [] }).then(function (result) {
            const watchedVideos = result.watchedVideos;
            console.log("Videos found in storage:", watchedVideos);

            videoList.innerHTML = ''; // Nettoyer la liste existante

            if (watchedVideos.length > 0) {
                watchedVideos.forEach(function (video) {
                    const listItem = document.createElement('li');
                    listItem.classList.add('video-item');

                    let shortTitle = video.title.length > 40 ? video.title.substring(0, 40) + "..." : video.title;

                    const titleElement = document.createElement('span');
                    titleElement.classList.add('video-title');
                    titleElement.textContent = shortTitle;

                    // Hide the details section initially
                    const detailsElement = document.createElement('div');
                    detailsElement.classList.add('hidden');
                    detailsElement.innerHTML = `
                      <p>Channel: ${video.channel}</p>
                      <p>Views: ${video.views}</p>
                      <p>Comments: ${video.comments}</p>
                      <p>Watch Time: ${video.watchTime} seconds</p>
                      <p>Video URL: <a href="${video.videoURL}" target="_blank">${video.videoURL}</a></p>
                      <p>Channel URL: <a href="${video.channelURL}" target="_blank">${video.channelURL}</a></p>
                      <p>Session id: <a href="${video.sessionID}" target="_blank">${video.sessionID}</a></p>
                  `;

                    // Create a section for recommendations
                    if (video.recommendations && video.recommendations.length > 0) {
                        const recommendationsHeader = document.createElement('p');
                        recommendationsHeader.textContent = "Recommendations:";
                        detailsElement.appendChild(recommendationsHeader);

                        const recommendationList = document.createElement('ul');
                        video.recommendations.forEach(rec => {
                            const recItem = document.createElement('li');
                            recItem.innerHTML = `<a href="${rec.videoURL}" target="_blank">${rec.title}</a>`;
                            recommendationList.appendChild(recItem);
                        });
                        detailsElement.appendChild(recommendationList);
                    }

                    listItem.appendChild(titleElement);
                    listItem.appendChild(detailsElement);
                    videoList.appendChild(listItem);

                    // Toggle the title and show/hide the additional details on click
                    listItem.addEventListener('click', function () {
                        if (listItem.classList.contains('expanded')) {
                            titleElement.textContent = shortTitle;
                            detailsElement.classList.add('hidden');  // Hide details
                            listItem.classList.remove('expanded');
                        } else {
                            titleElement.textContent = video.title; // Show full title
                            detailsElement.classList.remove('hidden');  // Show details
                            listItem.classList.add('expanded');
                        }
                    });
                });
            } else {
                const noVideosMsg = document.createElement('li');
                noVideosMsg.textContent = "Aucune vidéo visionnée pour le moment.";
                videoList.appendChild(noVideosMsg);
            }
        });
    }

    // Charger les vidéos au démarrage
    loadAndDisplayVideos();

    const settingsButton = document.getElementById('settingsButton');
    const infoButton = document.getElementById('infoButton');
    const homeSection = document.getElementById('homeSection');
    const settingsSection = document.getElementById('settingsSection');
    const infoSection = document.getElementById('infoSection');

    // Fonction pour masquer toutes les sections
    function hideAllSections() {
        homeSection.classList.add('hidden');
        settingsSection.classList.add('hidden');
        infoSection.classList.add('hidden');
    }

    homeButton.addEventListener('click', function () {
        console.log('Le bouton Home a été cliqué.');
        hideAllSections();
        homeSection.classList.remove('hidden');
    });

    // Afficher la section des paramètres lorsque le bouton Paramètres est cliqué
    settingsButton.addEventListener('click', function () {
        console.log('Le bouton Paramètres a été cliqué.');
        hideAllSections();
        settingsSection.classList.remove('hidden');
    });

    // Afficher la section des infos lorsque le bouton Info est cliqué
    infoButton.addEventListener('click', function () {
        console.log('Le bouton Info a été cliqué.');
        hideAllSections();
        infoSection.classList.remove('hidden');
    });

    // Gérer l'événement de soumission du formulaire
    document.getElementById('permissionsForm').addEventListener('submit', function (event) {
        event.preventDefault(); // Empêcher le rechargement de la page

        const permissions = {};

        // Collecter l'état de chaque permission
        const permissionNames = ['readHistory', 'readRecommendations', 'readMetadata', 'trackViewingTime', 'collectData'];
        permissionNames.forEach(permission => {
            const selectedOption = document.querySelector(`input[name="${permission}"]:checked`);
            permissions[permission] = selectedOption ? selectedOption.value : 'disabled';
        });

        console.log('Permissions sélectionnées:', permissions);

        // Sauvegarder les permissions sélectionnées dans le stockage local
        browser.storage.local.set({ permissions }).then(() => {
            console.log('Permissions enregistrées avec succès:', permissions);
        });
    });

    // Charger les permissions au démarrage
    function loadPermissions() {
        browser.storage.local.get({ permissions: {} }).then(result => {
            const savedPermissions = result.permissions;

            // Cocher les boutons radio correspondants aux permissions sauvegardées
            for (const [key, value] of Object.entries(savedPermissions)) {
                const radio = document.querySelector(`input[name="${key}"][value="${value}"]`);
                if (radio) {
                    radio.checked = true;
                }
            }
        });
    }

    // Charger les permissions au démarrage
    loadPermissions();

    // Fonction pour créer le graphique circulaire des catégories de vidéos
    function createPieChart() {
        const canvas = document.getElementById('categoryChart');
        const ctx = canvas.getContext('2d');

        // Données d'exemple
        const data = [20, 30, 25, 15, 10];
        const labels = ['Éducation', 'Divertissement', 'Technologie', 'Musique', 'Voyage'];
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

        const total = data.reduce((a, b) => a + b, 0);
        let startAngle = 0;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.9;

        data.forEach((value, index) => {
            const sliceAngle = (value / total) * (2 * Math.PI); // Angle de chaque tranche
            ctx.beginPath();
            ctx.moveTo(centerX, centerY); // Centre du camembert
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle); // Tracer la tranche
            ctx.closePath();
            ctx.fillStyle = colors[index];
            ctx.fill();
            startAngle += sliceAngle; // Mettre à jour l'angle de départ
        });
    }

    // Créer le graphique au démarrage
    createPieChart();

    // Add the event listener for the JSON button (assuming you've added it in popup.html)
    const jsonButton = document.getElementById('jsonButton');
    const jsonSection = document.getElementById('jsonSection');
    jsonButton.addEventListener('click', () => {
        hideAllSections();
        jsonSection.classList.remove('hidden');
        loadAndDisplayJSON();
    });

    // Function to load and display the JSON data
    function loadAndDisplayJSON() {
        browser.storage.local.get({ watchedVideos: [] }).then(result => {
            const jsonDataDisplay = document.getElementById('jsonDataDisplay');
            const watchedVideos = result.watchedVideos;

            // Convert the watched videos data to JSON and display it
            jsonDataDisplay.textContent = JSON.stringify(watchedVideos, null, 2);
        });
    }

});
