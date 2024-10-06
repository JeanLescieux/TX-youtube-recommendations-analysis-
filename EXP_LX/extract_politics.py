import os
import re
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, VideoUnavailable
from youtube_transcript_api.formatters import JSONFormatter

# Extraire l'ID d'une vidéo YouTube à partir de l'URL
def extract_video_id(url):
    # Utiliser une expression régulière pour extraire l'ID
    video_id_match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    if video_id_match:
        return video_id_match.group(1)
    return None

# Obtenir les sous-titres d'une vidéo YouTube
def get_youtube_transcript(video_id):
    try:
        # Obtenir la liste des sous-titres disponibles pour la vidéo
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Obtenir le premier transcript disponible (anglais ou français)
        first_transcript = transcript_list.find_transcript(['en', 'fr'])
        
        # Récupérer les sous-titres
        transcript = first_transcript.fetch()
        
        # Formatter les sous-titres en JSON
        formatter = JSONFormatter()
        transcript_json = formatter.format_transcript(transcript)
        
        return transcript_json, transcript  # Renvoie à la fois le texte formaté et le texte brut
    
    except TranscriptsDisabled:
        return f"Transcripts are disabled for video ID {video_id}.", None
    except VideoUnavailable:
        return f"Video with ID {video_id} is unavailable.", None
    except Exception as e:
        return str(e), None

# Sauvegarder les sous-titres dans un fichier JSON avec le label "extrême gauche"
def save_transcript_to_file(transcript_json, filename):
    try:
        with open(filename, 'w', encoding='utf-8') as file:
            file.write(f'{{"label": "extrême-droite", "transcript": {transcript_json}}}')
        print(f"Transcript saved to {filename}")
    except Exception as e:
        print(f"An error occurred while saving the transcript: {e}")

# Fonction pour traiter plusieurs vidéos
def process_multiple_videos(video_ids, output_dir):
    # Créer le dossier de sortie s'il n'existe pas
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Traiter chaque vidéo
    for video_id in video_ids:
        print(f"Processing video ID: {video_id}")
        
        # Récupérer les sous-titres
        transcript_json, transcript = get_youtube_transcript(video_id)
        
        # Vérifier s'il y a une erreur dans le retour
        if transcript is None:
            print(f"Error: {transcript_json}")
        else:
            # Sauvegarder dans un fichier avec le nom basé sur l'ID de la vidéo
            filename = os.path.join(output_dir, f"{video_id}.json")
            save_transcript_to_file(transcript_json, filename)

# Lire les URLs YouTube depuis un fichier .txt et extraire les IDs
def get_video_ids_from_file(file_path):
    video_ids = []
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            urls = file.readlines()
            for url in urls:
                url = url.strip()
                video_id = extract_video_id(url)
                if video_id:
                    video_ids.append(video_id)
                else:
                    print(f"Invalid URL: {url}")
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")
    
    return video_ids

# Exemple d'utilisation
if __name__ == "__main__":
    # Fichier texte contenant les URLs YouTube
    input_file = 'youtube_urls.txt'  # Remplacez par le chemin de votre fichier .txt
    
    # Dossier de sortie pour les fichiers JSON
    output_dir = 'politics'
    
    # Récupérer les IDs des vidéos depuis le fichier .txt
    video_ids = get_video_ids_from_file(input_file)
    
    if video_ids:
        # Traiter toutes les vidéos et sauvegarder les sous-titres dans des fichiers JSON avec le label "extrême gauche"
        process_multiple_videos(video_ids, output_dir)
    else:
        print("No valid video IDs found.")
