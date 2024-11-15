import json
import re

def clean_url(url):
    # Supprimer le timecode ou autres paramètres après le premier `&`
    return re.sub(r"&.*$", "", url)

def extract_all_video_urls(json_file, output_file):
    try:
        # Charger le contenu du fichier JSON
        with open(json_file, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except json.JSONDecodeError as e:
        print(f"Erreur de décodage JSON : {e}")
        return
    except FileNotFoundError:
        print(f"Le fichier {json_file} n'a pas été trouvé.")
        return

    # Extraction des URLs des vidéos regardées
    watched_video_urls = []
    for video in data.get("watchedVideos", []):
        url = video.get("videoURL")
        if url:
            watched_video_urls.append(clean_url(url))

    # Extraction des URLs des vidéos recommandées
    recommended_video_urls = []
    for video in data.get("watchedVideos", []):
        for recommendation in video.get("recommendations", []):
            url = recommendation.get("videoURL")
            if url:
                recommended_video_urls.append(clean_url(url))

    # Extraction des URLs des vidéos de la page d'accueil
    homepage_video_urls = []
    for homepage in data.get("homePageRecommendations", []):
        for video in homepage.get("recommendations", []):
            url = video.get("videoURL")
            if url:
                # Ajouter le préfixe complet si l'URL est relative
                if url.startswith("/watch"):
                    url = "https://www.youtube.com" + url
                homepage_video_urls.append(clean_url(url))

    # Écrire les URLs dans un fichier .txt avec des sections séparées
    try:
        with open(output_file, 'w', encoding='utf-8') as file:
            # Section des vidéos regardées
            file.write("watched_videos\n")
            for url in watched_video_urls:
                file.write(url + '\n')
            
            # Section des vidéos recommandées
            file.write("\nrecommended_videos\n")
            for url in recommended_video_urls:
                file.write(url + '\n')
            
            # Section des vidéos de la page d'accueil
            file.write("\nhomepage_videos\n")
            for url in homepage_video_urls:
                file.write(url + '\n')

        print(f"Toutes les URLs ont été sauvegardées dans {output_file}")
    except IOError as e:
        print(f"Erreur lors de l'écriture du fichier : {e}")

# Exemple d'utilisation
json_file = 'data.json'
output_file = 'all_video_urls.txt'
extract_all_video_urls(json_file, output_file)
