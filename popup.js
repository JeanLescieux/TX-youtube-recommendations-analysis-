console.log('popup.js est bien chargé');

document.addEventListener('DOMContentLoaded', function () {
    const videoList = document.getElementById('videoList');
    const categoryChartCanvas = document.getElementById('categoryChart');
    const jsonButton = document.getElementById('jsonButton');
    const homeButton = document.getElementById('homeButton');
    const settingsButton = document.getElementById('settingsButton');
    const infoButton = document.getElementById('infoButton');

    const homeSection = document.getElementById('homeSection');
    const jsonSection = document.getElementById('jsonSection');
    const settingsSection = document.getElementById('settingsSection');
    const infoSection = document.getElementById('infoSection');

    const jsonDataDisplay = document.getElementById('jsonDataDisplay');

    // Hide all sections and only show the requested one
    function showSection(section) {
        console.log("Section à afficher :", section.id); // Log pour vérifier la section active
        
        const analysisButton = document.getElementById('analysisButton');
    
        // Masquer toutes les sections
        homeSection.classList.add('hidden');
        jsonSection.classList.add('hidden');
        settingsSection.classList.add('hidden');
        infoSection.classList.add('hidden');
    
        // Afficher la section demandée
        section.classList.remove('hidden');
        console.log("Section affichée :", section.id); // Vérifiez si la section est affichée
    
        // Afficher ou masquer le bouton d'analyse
        if (section === homeSection || section === jsonSection) {
            analysisButton.classList.remove('hidden');
            console.log("Bouton d'analyse affiché");
        } else {
            analysisButton.classList.add('hidden');
            console.log("Bouton d'analyse masqué");
        }
    }
    

    // Toggle between sections
    jsonButton.addEventListener('click', () => {
        showSection(jsonSection);
        loadAndDisplayJSON(); // Load JSON when showing JSON section
    });

    homeButton.addEventListener('click', () => {
        showSection(homeSection);
    });

    settingsButton.addEventListener('click', () => {
        showSection(settingsSection);
    });

    infoButton.addEventListener('click', () => {
        showSection(infoSection);
    });

    function loadAndDisplayJSON() {
        browser.storage.local.get({ watchedVideos: [], homePageRecommendations: [] }).then(result => {
            jsonDataDisplay.textContent = JSON.stringify(result, null, 2);
        }).catch(error => {
            console.error("Error fetching JSON data:", error);
        });
    }

    // Function to load and display video data in the main section
    function loadAndDisplayData() {
        browser.storage.local.get({ watchedVideos: [], homePageRecommendations: [] }).then(function (result) {
            const watchedVideos = result.watchedVideos;
            const homePageRecommendations = result.homePageRecommendations;
            console.log("Videos found in storage:", watchedVideos);
            console.log("Homepage recommendations found in storage:", homePageRecommendations);

            videoList.innerHTML = ''; // Clear existing list

            if (watchedVideos.length > 0) {
                watchedVideos.forEach(function (video) {
                    const listItem = document.createElement('li');
                    listItem.classList.add('video-item');

                    let shortTitle = video.title && video.title.length > 40 ? video.title.substring(0, 40) + "..." : video.title;

                    const titleElement = document.createElement('span');
                    titleElement.classList.add('video-title');
                    titleElement.textContent = `Watched Video: ${shortTitle}`;

                    const detailsElement = document.createElement('div');
                    detailsElement.classList.add('hidden');
                    detailsElement.innerHTML = `
                      <p>Channel: ${video.channel}</p>
                      <p>Views: ${video.views}</p>
                      <p>Comments: ${video.comments}</p>
                      <p>Watch Time: ${video.watchTime} seconds</p>
                      <p>Video URL: <a href="${video.videoURL}" target="_blank">${video.videoURL}</a></p>
                      <p>Channel URL: <a href="${video.channelURL}" target="_blank">${video.channelURL}</a></p>
                      <p>Session ID: ${video.sessionID}</p>
                  `;

                    if (video.recommendations && video.recommendations.length > 0) {
                        const recommendationsHeader = document.createElement('p');
                        recommendationsHeader.textContent = "Video Recommendations:";
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

                    listItem.addEventListener('click', function () {
                        if (listItem.classList.contains('expanded')) {
                            titleElement.textContent = shortTitle;
                            detailsElement.classList.add('hidden');
                            listItem.classList.remove('expanded');
                        } else {
                            titleElement.textContent = `Watched Video: ${video.title}`;
                            detailsElement.classList.remove('hidden');
                            listItem.classList.add('expanded');
                        }
                    });
                });
            }

            if (homePageRecommendations.length > 0) {
                homePageRecommendations.forEach(function (recommendationData, index) {
                    const listItem = document.createElement('li');
                    listItem.classList.add('video-item');

                    const titleElement = document.createElement('span');
                    titleElement.classList.add('video-title');
                    titleElement.textContent = `Homepage Recommendations - Session ${index + 1}`;

                    const detailsElement = document.createElement('div');
                    detailsElement.classList.add('hidden');
                    detailsElement.innerHTML = `<p>Session ID: ${recommendationData.sessionID}</p>`;

                    const recommendationsHeader = document.createElement('p');
                    recommendationsHeader.textContent = "Top 5 Recommendations:";
                    detailsElement.appendChild(recommendationsHeader);

                    const recommendationList = document.createElement('ul');
                    recommendationData.recommendations.forEach(rec => {
                        const recItem = document.createElement('li');
                        recItem.innerHTML = `<a href="${rec.videoURL}" target="_blank">${rec.title} (Channel: ${rec.channel})</a>`;
                        recommendationList.appendChild(recItem);
                    });
                    detailsElement.appendChild(recommendationList);

                    listItem.appendChild(titleElement);
                    listItem.appendChild(detailsElement);
                    videoList.appendChild(listItem);

                    listItem.addEventListener('click', function () {
                        if (listItem.classList.contains('expanded')) {
                            detailsElement.classList.add('hidden');
                            listItem.classList.remove('expanded');
                        } else {
                            detailsElement.classList.remove('hidden');
                            listItem.classList.add('expanded');
                        }
                    });
                });
            }

            if (watchedVideos.length === 0 && homePageRecommendations.length === 0) {
                const noDataMsg = document.createElement('li');
                noDataMsg.textContent = "Aucune donnée disponible pour le moment.";
                videoList.appendChild(noDataMsg);
            }

            // Create the chart after loading data
            createPieChart();
        });
    }

    // Function to create the pie chart for video categories
    function createPieChart() {
        if (categoryChartCanvas) {
            const ctx = categoryChartCanvas.getContext('2d');
            const data = [20, 30, 25, 15, 10]; // Example data
            const labels = ['Éducation', 'Divertissement', 'Technologie', 'Musique', 'Voyage'];
            const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        } else {
            console.error("Canvas for category chart not found");
        }
    }

    // Load videos and recommendations on startup
    loadAndDisplayData();
});

document.addEventListener('DOMContentLoaded', function () {
    const downloadJsonButton = document.getElementById('downloadJsonButton');
    const jsonDataDisplay = document.getElementById('jsonDataDisplay');

    // Fonction pour télécharger le JSON
    function downloadJSON() {
        // Récupérer les données affichées
        const jsonData = jsonDataDisplay.textContent;

        if (jsonData) {
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Crée un lien de téléchargement
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = 'data.json';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
            console.log("Fichier JSON téléchargé avec succès !");
        } else {
            console.error("Aucune donnée JSON disponible à télécharger.");
        }
    }

    // Ajouter un événement de clic au bouton "Download JSON"
    downloadJsonButton.addEventListener('click', downloadJSON);
});


document.addEventListener('DOMContentLoaded', function () {
    const permissionRadios = document.querySelectorAll('#permissionsForm input[type="radio"]');

    // Charger les valeurs des permissions au démarrage
    browser.storage.local.get({
        trackHomePageRec: "enabled",
        trackWatchedVideos: "enabled",
        trackViewingTime: "enabled",
        trackSideRecommendations: "enabled"
    }).then(result => {
        // Appliquer les valeurs sauvegardées pour chaque bouton radio
        permissionRadios.forEach(radio => {
            if (result[radio.name] === radio.value) {
                radio.checked = true; // Maintient la sélection utilisateur
            }
        });
    });

    // Mettre à jour les permissions dans le stockage local lors d'un changement
    permissionRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const { name, value } = radio;
            browser.storage.local.set({ [name]: value }).then(() => {
                console.log(`Permission "${name}" mise à jour : ${value}`);
            });
        });
    });
});
