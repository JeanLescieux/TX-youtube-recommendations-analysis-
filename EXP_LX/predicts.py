import os
import joblib
import re
import nltk
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, VideoUnavailable
from youtube_transcript_api.formatters import JSONFormatter

# Télécharger les ressources NLTK nécessaires
nltk.download('punkt')
nltk.download('stopwords')

# Fonction pour nettoyer le texte
def clean_text(text):
    text = re.sub(r'[^\w\s]', '', text)  # Enlever la ponctuation
    text = text.lower().strip()  # Convertir en minuscules
    return text

# Tokenisation et suppression des stopwords
def preprocess_texts(transcript):
    stop_words = set(nltk.corpus.stopwords.words('french'))
    processed_texts = []

    for entry in transcript:
        text = clean_text(entry['text'])
        tokens = nltk.word_tokenize(text)
        filtered_tokens = [token for token in tokens if token not in stop_words]
        processed_texts.append(' '.join(filtered_tokens))
    
    return ' '.join(processed_texts)

# Obtenir les sous-titres d'une vidéo YouTube
def get_youtube_transcript(video_id):
    try:
        # Obtenir la liste des sous-titres disponibles pour la vidéo
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Obtenir le premier transcript disponible (anglais ou français)
        first_transcript = transcript_list.find_transcript(['en', 'fr'])
        
        # Récupérer les sous-titres
        transcript = first_transcript.fetch()
        
        return transcript
    
    except TranscriptsDisabled:
        return None  # Transcriptions désactivées
    except VideoUnavailable:
        return None  # Vidéo non disponible
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

# Fonction principale pour classifier une vidéo
def classify_video(video_url):
    # Charger le modèle sauvegardé
    model = joblib.load('best_videotype_model.joblib')
    
    video_id = video_url.split('v=')[-1].split('&')[0]
    
    transcript = get_youtube_transcript(video_id)
    
    if transcript is None:
        print(f"Transcription is not available for video ID {video_id}.")
        return None
    
    processed_text = preprocess_texts(transcript)
    
    prediction = model.predict([processed_text])
    
    # Mapper les prédictions à leurs étiquettes
    label_mapping = {
    0: "sport", 1: "makeup", 2: "jeuxvideos", 3: "politique",
    4: "tech", 5: "entertainment", 6: "vlog", 7: "actualites",
    8: "cuisine", 9: "education", 10: "automobile"
    }
    return label_mapping[prediction[0]]

# Exemple d'utilisation
if __name__ == "__main__":
    video_url = 'https://www.youtube.com/watch?v=u5VcbrulGOo'
    result = classify_video(video_url)
    
    if result is not None:
        print(f"La vidéo est classée comme : {result}")
