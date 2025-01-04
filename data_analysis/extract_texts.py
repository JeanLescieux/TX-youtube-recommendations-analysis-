import json
import os
import re
import torch
import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, VideoUnavailable
from transformers import BertTokenizer, BertModel
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer, PorterStemmer
import nltk

# Télécharger les ressources NLTK nécessaires
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')

# Extraire l'ID d'une vidéo YouTube à partir de l'URL
def extract_video_id(url):
    video_id_match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    if video_id_match:
        return video_id_match.group(1)
    return None

# Obtenir les sous-titres d'une vidéo YouTube
def get_youtube_transcript(video_id):
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        first_transcript = transcript_list.find_transcript(['en', 'fr'])
        transcript = first_transcript.fetch()
        return transcript
    except TranscriptsDisabled:
        print(f"Transcripts are disabled for video ID {video_id}.")
    except VideoUnavailable:
        print(f"Video with ID {video_id} is unavailable.")
    except Exception as e:
        print(f"An error occurred: {e}")
    return None

# Nettoyer le texte
def clean_text(text):
    text = re.sub(r'\[.*?\]', '', text)  # Enlever les crochets
    text = re.sub(r'[^\w\s]', '', text)  # Enlever la ponctuation
    text = text.lower().strip()  # Convertir en minuscules et enlever les espaces inutiles
    return text

# Tokenisation
def tokenize_text(text):
    return word_tokenize(text)

# Lemmatisation
def lemmatize_tokens(tokens):
    lemmatizer = WordNetLemmatizer()
    return [lemmatizer.lemmatize(token) for token in tokens]

# Stemming
def stem_tokens(tokens):
    stemmer = PorterStemmer()
    return [stemmer.stem(token) for token in tokens]

# Prétraitement des textes pour BERT
def preprocess_texts(data, use_lemmatization=True):
    stop_words = set(stopwords.words('english')) | set(stopwords.words('french'))
    combined_text = ""

    for entry in data:
        text = entry['text']
        cleaned_text = clean_text(text)
        tokens = tokenize_text(cleaned_text)
        filtered_tokens = [token for token in tokens if token not in stop_words]
        
        if use_lemmatization:
            processed_tokens = lemmatize_tokens(filtered_tokens)
        else:
            processed_tokens = stem_tokens(filtered_tokens)
        
        processed_text = ' '.join(processed_tokens)
        combined_text += processed_text + " "

    return combined_text.strip()

# Utilisation de BERT pour obtenir un embedding unique pour tout le texte
def get_bert_embedding(text, model, tokenizer):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    last_hidden_states = outputs.last_hidden_state  # Embeddings des derniers états cachés
    sentence_embedding = torch.mean(last_hidden_states, dim=1).squeeze()  # Moyenne des embeddings de la séquence
    return sentence_embedding.cpu().numpy()

# Fonction pour lire les URLs YouTube depuis un fichier .txt et extraire les IDs
def get_video_ids_from_file(file_path):
    video_ids = {
        "watched_videos": [],
        "recommended_videos": [],
        "homepage_videos": []
    }
    
    current_section = None

    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                line = line.strip()
                if line in video_ids:
                    current_section = line
                elif current_section and line:
                    video_ids[current_section].append(line)
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")

    return video_ids

# Fonction pour traiter tous les fichiers JSON dans un dossier
def process_videos_from_file(video_ids, base_output_dir, model, tokenizer, use_lemmatization=True):
    embeddings = []
    filenames = []
    labels = []

    for section, urls in video_ids.items():
        for url in urls:
            video_id = extract_video_id(url)
            if video_id:
                print(f"Processing video ID: {video_id} from section '{section}'")
                transcript = get_youtube_transcript(video_id)
                if transcript:
                    combined_text = preprocess_texts(transcript, use_lemmatization)
                    embedding = get_bert_embedding(combined_text, model, tokenizer)
                    embeddings.append(embedding)
                    filenames.append(video_id)
                    labels.append(section)

    return np.array(embeddings), filenames, labels

# Réduction dimensionnelle avec ACP et affichage des vidéos dans un espace 3D
def plot_3d_embeddings(embeddings, labels, filenames):  # Ajoutez filenames ici
    pca = PCA(n_components=3)
    reduced_embeddings = pca.fit_transform(embeddings)

    # Création de la figure pour afficher l'espace 3D
    fig = plt.figure(figsize=(10, 8))
    ax = fig.add_subplot(111, projection='3d')

    # Attribution des couleurs en fonction des sections
    colors = {'watched_videos': 'red', 'recommended_videos': 'green', 'homepage_videos': 'blue'}
    color_map = [colors[label] for label in labels]

    # Affichage des points 3D
    ax.scatter(reduced_embeddings[:, 0], reduced_embeddings[:, 1], reduced_embeddings[:, 2], c=color_map, s=50)

    # Ajouter des labels pour chaque point
    for i, filename in enumerate(filenames):  # Utilisez filenames ici
        ax.text(reduced_embeddings[i, 0], reduced_embeddings[i, 1], reduced_embeddings[i, 2], filename, size=6)

    # Titre et labels des axes
    ax.set_title('3D PCA Visualization of YouTube Video Transcripts')
    ax.set_xlabel('Principal Component 1')
    ax.set_ylabel('Principal Component 2')
    ax.set_zlabel('Principal Component 3')

    plt.show()

# Fonction principale
def main(input_file, base_output_dir):
    # Charger le modèle BERT multilingue et le tokenizer
    tokenizer = BertTokenizer.from_pretrained('bert-base-multilingual-cased')
    model = BertModel.from_pretrained('bert-base-multilingual-cased')

    # Récupérer les IDs des vidéos à partir du fichier .txt
    video_ids = get_video_ids_from_file(input_file)

    # Traiter toutes les vidéos et extraire les embeddings
    embeddings, filenames, labels = process_videos_from_file(video_ids, base_output_dir, model, tokenizer)

    # Réduction dimensionnelle avec ACP et affichage des embeddings
    plot_3d_embeddings(embeddings, labels, filenames)  # Passez filenames ici

# Exemple d'utilisation
if __name__ == "__main__":
    input_file = 'all_video_urls.txt'  # Remplacez par le chemin du fichier .txt contenant les URLs
    base_output_dir = 'video_transcripts'  # Dossier racine pour les fichiers JSON

    main(input_file, base_output_dir)