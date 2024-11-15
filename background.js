// background.js
let sessionID = Date.now().toString();
let videoBatch = [];  // Tableau pour accumuler les vidéos avant de les stocker
let storageUpdateTimeout = null;  // Variable pour gérer le délai

browser.storage.local.set({ sessionID }).then(() => {
    console.log("Session ID created:", sessionID);
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background script:", message);

    if (message.type === "Video") {
        // Récupérer les vidéos déjà stockées
        browser.storage.local.get({ watchedVideos: [] }).then((result) => {
            const watchedVideos = result.watchedVideos || [];

            // Vérifier si une vidéo avec le même videoURL existe déjà
            const videoExists = watchedVideos.some(video => video.videoURL === message.videoURL);

            if (!videoExists) {
                // Ajouter l'objet vidéo reçu au tableau watchedVideos
                const videoData = {
                    sessionID: sessionID,
                    id: message.id,
                    type: message.type,
                    title: message.videoTitle,
                    channel: message.channelName,
                    channelURL: message.channelURL,
                    videoURL: message.videoURL,
                    views: message.viewCount,
                    comments: message.commentCount,
                    watchTime: message.currentWatchTime,
                    recommendedFrom: Array.isArray(message.recommendedFrom) ? message.recommendedFrom : [] // Ajout du champ recommendedFrom
                };
                
                videoBatch.push(videoData);
                console.log("Video added to batch:", videoData);

                // Si on n'a pas déjà un délai de mise à jour en cours, on en crée un
                if (!storageUpdateTimeout) {
                    storageUpdateTimeout = setTimeout(() => {
                        // Mettre à jour le stockage après un petit délai (par exemple 500 ms)
                        browser.storage.local.get({ watchedVideos: [] }).then((result) => {
                            const watchedVideos = result.watchedVideos || [];
                            watchedVideos.push(...videoBatch);  // Ajouter toutes les vidéos accumulées au stockage
                            console.log("Storing batch of videos:", videoBatch);
                            browser.storage.local.set({ watchedVideos }).then(() => {
                                console.log("Videos stored successfully.");
                                videoBatch = [];  // Réinitialiser le batch après l'enregistrement
                                storageUpdateTimeout = null;  // Réinitialiser le délai
                            }).catch(err => {
                                console.error("Error storing videos:", err);
                            });
                        });
                    }, 500);  // Attendre 500ms avant de mettre à jour le stockage
                }
            } else {
                console.log("Video already exists, not adding:", message.videoURL);
            }
        }).catch(err => {
            console.error("Error getting watched videos from storage:", err);
        });
    } else if (message.type === "homePage") {
        // Traitement des recommandations de la page d'accueil
        browser.storage.local.get({ homePageRecommendations: [], sessionID: sessionID }).then((result) => {
            const homePageRecommendations = result.homePageRecommendations;

            const homePageData = {
                sessionID: result.sessionID,
                type: "homePage",
                recommendations: message.recommendations,
                timestamp: new Date().toISOString()
            };

            homePageRecommendations.push(homePageData);
            console.log("Storing homepage recommendations with sessionID:", homePageData);
            browser.storage.local.set({ homePageRecommendations });
        });
    }
});
