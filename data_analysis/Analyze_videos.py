import os
import joblib
import re
import nltk
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, VideoUnavailable
from collections import Counter
import plotly.graph_objects as go

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
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        first_transcript = transcript_list.find_transcript(['en', 'fr'])
        transcript = first_transcript.fetch()
        return transcript
    except (TranscriptsDisabled, VideoUnavailable):
        return None
    except Exception as e:
        print(f"Error fetching transcript for video ID {video_id}: {e}")
        return None

# Classifier une vidéo
def classify_video(video_url, model):
    video_id = video_url.split('v=')[-1].split('&')[0]
    transcript = get_youtube_transcript(video_id)
    if transcript is None:
        return None
    processed_text = preprocess_texts(transcript)
    prediction = model.predict([processed_text])
    label_mapping = {
        0: "sport", 1: "makeup", 2: "jeuxvideos", 3: "politique",
        4: "tech", 5: "entertainment", 6: "vlog", 7: "actualites",
        8: "cuisine", 9: "education", 10: "automobile"
    }
    return label_mapping[prediction[0]]

# Analyser une section et calculer les pourcentages
def analyze_section(videos, model):
    classifications = []
    for video in videos:
        classification = classify_video(video, model)
        if classification:
            classifications.append(classification)
    total_videos = len(classifications)
    if total_videos == 0:
        return {}
    counts = Counter(classifications)
    return {key: (value / total_videos) * 100 for key, value in counts.items()}

# Charger le fichier et analyser chaque section
def analyze_file(file_path, model_path):
    model = joblib.load(model_path)
    with open(file_path, 'r') as file:
        content = file.read()

    sections = content.split('\n\n')  # Diviser par section (assume double saut de ligne)
    results = {}

    for section in sections:
        lines = section.split('\n')
        section_name = lines[0].strip()
        video_urls = [line.strip() for line in lines[1:] if line.strip()]
        results[section_name] = analyze_section(video_urls, model)
    
    return results

# Fonction pour afficher les résultats sous forme de camembert interactif
def plot_pie_chart(results):
    for section, percentages in results.items():
        labels = list(percentages.keys())
        values = list(percentages.values())

        fig = go.Figure(data=[go.Pie(labels=labels, values=values, textinfo='label+percent',
                                     hoverinfo='label+percent+value', hole=0.4)])
        fig.update_layout(title=f"Répartition des catégories pour la section : {section}",
                          template="plotly_dark")
        fig.show()

# Exemple d'utilisation
if __name__ == "__main__":
    file_path = 'all_video_urls.txt'  # Chemin vers le fichier contenant les vidéos
    model_path = 'best_videotype_model.joblib'  # Chemin vers le modèle sauvegardé

    results = analyze_file(file_path, model_path)

    if results:
        plot_pie_chart(results)
