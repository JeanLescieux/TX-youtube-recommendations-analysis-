import os
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, VideoUnavailable
from youtube_transcript_api.formatters import JSONFormatter

# Obtenir les sous-titres d'une vidéo YouTube
def get_youtube_transcript(video_id):
    try:
        # Obtenir la liste des sous-titres disponibles pour la vidéo
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Obtenir le premier transcript disponible (anglais ou français)
        first_transcript = transcript_list.find_transcript(['en-GB', 'fr'])
        
        # Récupérer les sous-titres
        transcript = first_transcript.fetch()
        
        # Formatter les sous-titres en JSON
        formatter = JSONFormatter()
        transcript_json = formatter.format_transcript(transcript)
        
        return transcript_json
    
    except TranscriptsDisabled:
        return f"Transcripts are disabled for video ID {video_id}."
    except VideoUnavailable:
        return f"Video with ID {video_id} is unavailable."
    except Exception as e:
        return str(e)

# Sauvegarder les sous-titres dans un fichier JSON
def save_transcript_to_file(transcript_json, filename):
    try:
        with open(filename, 'w', encoding='utf-8') as file:
            file.write(transcript_json)
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
        transcript_json = get_youtube_transcript(video_id)
        
        # Vérifier s'il y a une erreur dans le retour
        if isinstance(transcript_json, str) and ('error' in transcript_json.lower() or 'disabled' in transcript_json.lower() or 'unavailable' in transcript_json.lower()):
            print(f"Error: {transcript_json}")
        else:
            # Sauvegarder dans un fichier avec le nom basé sur l'ID de la vidéo
            filename = os.path.join(output_dir, f"{video_id}.json")
            save_transcript_to_file(transcript_json, filename)

# Exemple d'utilisation
if __name__ == "__main__":
    # Liste des IDs de vidéos YouTube à traiter
    video_ids = ['BJoipvWDGME']  # Remplacez par vos propres IDs de vidéos
    # Dossier de sortie pour les fichiers JSON
    output_dir = 'transcript'
    
    # Traiter toutes les vidéos et sauvegarder les sous-titres dans des fichiers JSON
    process_multiple_videos(video_ids, output_dir)
