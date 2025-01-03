import os
import re
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, VideoUnavailable
from youtube_transcript_api.formatters import JSONFormatter

# Initialisation de l'API YouTube
def get_youtube_service(api_key):
    return build('youtube', 'v3', developerKey=api_key)

# Extraire l'ID de la playlist d'uploads d'une chaîne
def get_uploads_playlist_id(youtube, channel_id):
    request = youtube.channels().list(
        part="contentDetails",
        id=channel_id
    )
    response = request.execute()
    return response['items'][0]['contentDetails']['relatedPlaylists']['uploads']

# Récupérer toutes les vidéos d'une playlist YouTube (playlist d'uploads)
def get_playlist_videos(youtube, playlist_id):
    videos = []
    next_page_token = None

    while True:
        request = youtube.playlistItems().list(
            part="contentDetails",
            playlistId=playlist_id,
            maxResults=50,  # Nombre maximum de vidéos par page
            pageToken=next_page_token
        )
        response = request.execute()

        for item in response['items']:
            videos.append(item['contentDetails']['videoId'])

        next_page_token = response.get('nextPageToken')
        if not next_page_token:
            break

    return videos

# Obtenir les sous-titres d'une vidéo YouTube
def get_youtube_transcript(video_id):
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        first_transcript = transcript_list.find_transcript(['en', 'fr'])
        transcript = first_transcript.fetch()
        formatter = JSONFormatter()
        transcript_json = formatter.format_transcript(transcript)
        return transcript_json, transcript
    except TranscriptsDisabled:
        return f"Transcripts are disabled for video ID {video_id}.", None
    except VideoUnavailable:
        return f"Video with ID {video_id} is unavailable.", None
    except Exception as e:
        return str(e), None

# Sauvegarder les sous-titres avec le label "gauche"
def save_transcript_to_file(transcript_json, video_id, output_dir):
    filename = os.path.join(output_dir, f"{video_id}.json")
    try:
        with open(filename, 'w', encoding='utf-8') as file:
            file.write(f'{{"label": "automobile", "transcript": {transcript_json}}}')
        print(f"Transcript saved to {filename}")
    except Exception as e:
        print(f"An error occurred while saving the transcript: {e}")

# Traiter toutes les vidéos d'une chaîne
def process_channel_videos(api_key, channel_id, output_dir):
    youtube = get_youtube_service(api_key)

    # Créer le dossier de sortie s'il n'existe pas
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Obtenir l'ID de la playlist d'uploads de la chaîne
    uploads_playlist_id = get_uploads_playlist_id(youtube, channel_id)

    # Récupérer les vidéos de la playlist
    video_ids = get_playlist_videos(youtube, uploads_playlist_id)

    for video_id in video_ids:
        print(f"Processing video ID: {video_id}")

        # Récupérer les sous-titres
        transcript_json, transcript = get_youtube_transcript(video_id)

        if transcript is None:
            print(f"Error: {transcript_json}")
        else:
            save_transcript_to_file(transcript_json, video_id, output_dir)


# Exemple d'utilisation
if __name__ == "__main__":
    # API Key YouTube (remplacez par votre clé)
    api_key = 'AIzaSyDy6ZQySv5xUKMoPz-Sd15RCr5ZF_o8IoE'

    # ID de la chaîne YouTube
    channel_id = 'UCssjcJIu2qO0g0_9hWRWa0g'  # Remplacez par l'ID de la chaîne

    # Dossier de sortie pour les fichiers JSON
    output_dir = 'videotype'

    # Traiter toutes les vidéos de la chaîne
    process_channel_videos(api_key, channel_id, output_dir)
