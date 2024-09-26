import json
import re
import torch
import numpy as np
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer, PorterStemmer
from transformers import BertTokenizer, BertModel
import nltk

# Télécharger les ressources NLTK nécessaires
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')

# Charger les données depuis un fichier JSON
def load_data(filename):
    with open(filename, 'r', encoding='utf-8') as file:
        data = json.load(file)
    return data

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

# Réduction dimensionnelle avec PCA et affichage des points avec les noms des fichiers et une heatmap des clusters
def plot_embeddings_with_clusters(embeddings, filenames, n_clusters=5):
    # Réduction dimensionnelle avec PCA
    pca = PCA(n_components=2)
    reduced_embeddings = pca.fit_transform(embeddings)
    
    # Clustering avec KMeans
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    cluster_labels = kmeans.fit_predict(embeddings)
    
    # Création de la heatmap des clusters
    plt.figure(figsize=(10, 7))
    
    # Création de la heatmap avec seaborn
    sns.scatterplot(x=reduced_embeddings[:, 0], 
                    y=reduced_embeddings[:, 1], 
                    hue=cluster_labels, 
                    palette='viridis', 
                    alpha=0.7, 
                    s=100)
    
    # Affichage des noms de fichiers sur le graphique
    for i, filename in enumerate(filenames):
        plt.text(reduced_embeddings[i, 0], reduced_embeddings[i, 1], filename, fontsize=9)
    
    plt.title('Projection PCA des embeddings BERT avec clustering')
    plt.xlabel('Composante Principale 1')
    plt.ylabel('Composante Principale 2')
    plt.legend(title='Clusters')
    plt.show()

# Fonction pour traiter tous les fichiers JSON dans un dossier
def process_json_files_in_directory(directory, model, tokenizer, use_lemmatization=True):
    embeddings = []
    filenames = []

    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            filepath = os.path.join(directory, filename)
            print(f"Traitement du fichier : {filename}")
            
            data = load_data(filepath)
            combined_text = preprocess_texts(data, use_lemmatization)
            embedding = get_bert_embedding(combined_text, model, tokenizer)
            
            embeddings.append(embedding)
            filenames.append(filename)

    return np.array(embeddings), filenames

# Fonction principale
if __name__ == "__main__":
    # Répertoire contenant les fichiers JSON
    directory = 'transcript'  # Remplacez par le chemin de votre dossier JSON
    
    # Charger le modèle BERT multilingue et le tokenizer
    tokenizer = BertTokenizer.from_pretrained('bert-base-multilingual-cased')
    model = BertModel.from_pretrained('bert-base-multilingual-cased')

    # Traiter tous les fichiers JSON dans le dossier
    embeddings, filenames = process_json_files_in_directory(directory, model, tokenizer, use_lemmatization=True)

    # Réduction dimensionnelle et affichage des embeddings avec heatmap des clusters
    plot_embeddings_with_clusters(embeddings, filenames, n_clusters=7)
