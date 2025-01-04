import os
import json
import re
import math
import nltk
import joblib
from pyvis.network import Network
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    VideoUnavailable,
    NoTranscriptFound
)

# ------------------------------------------------------------------
# Téléchargement des ressources NLTK (si besoin, une seule fois)
# ------------------------------------------------------------------
nltk.download('punkt')
nltk.download('punkt_tab')   # <- Résout l'erreur LookupError: Resource punkt_tab not found
nltk.download('stopwords')

# ------------------------------------------------------------------
#            Fonctions de nettoyage / classification
# ------------------------------------------------------------------

def clean_text(text: str) -> str:
    text = re.sub(r'[^\w\s]', '', text)  # Retire la ponctuation
    text = text.lower().strip()
    return text

def preprocess_texts(transcript: list) -> str:
    stop_words = set(nltk.corpus.stopwords.words('french'))
    processed_segments = []

    for entry in transcript:
        # Récupère la clé 'text' (ou chaîne vide si pas présente)
        text = clean_text(entry.get('text', ''))
        # Tokenisation (lang='french' ou 'english')
        tokens = nltk.word_tokenize(text, language='french')
        # Retrait des stopwords
        filtered_tokens = [tk for tk in tokens if tk not in stop_words]
        processed_segments.append(' '.join(filtered_tokens))

    return ' '.join(processed_segments)

def get_youtube_transcript(video_id: str):
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        first_transcript = transcript_list.find_transcript(['fr', 'en'])
        return first_transcript.fetch()
    except NoTranscriptFound:
        print(f"Aucun sous-titre FR/EN trouvé pour la vidéo : {video_id}")
        return None
    except (TranscriptsDisabled, VideoUnavailable):
        print(f"Transcriptions désactivées ou vidéo indispo pour : {video_id}")
        return None
    except Exception as e:
        print(f"An error occurred: \n{e}")
        return None

# Mapping des classes prédictives (index -> étiquette)
label_mapping = {
    0: "sport",
    1: "makeup",
    2: "jeuxvideos",
    3: "politique",
    4: "tech",
    5: "entertainment",
    6: "vlog",
    7: "actualites",
    8: "cuisine",
    9: "education",
    10: "automobile"
}

def classify_video(video_url: str, model):
    video_id = video_url.split('v=')[-1].split('&')[0]
    transcript = get_youtube_transcript(video_id)
    if transcript is None:
        # Pas de transcript FR/EN
        return None
    processed_text = preprocess_texts(transcript)
    prediction = model.predict([processed_text])
    return label_mapping[prediction[0]]

# ------------------------------------------------------------------
#           Ajustement de la taille des noeuds
# ------------------------------------------------------------------

def compute_node_size(views: int) -> float:
    """
    Calcule une taille de nœud (size) sur une échelle
    logarithmique, pour éviter des nœuds trop gigantesques.
    On peut ajuster à volonté.
    """
    if views <= 0:
        # Pas de vues => on retourne une taille fixe (ex. 12)
        return 12
    # Echelle log : log10(views) * un facteur. Ajustez au besoin.
    size = math.log10(views) * 7  
    # Limiter la taille mini et maxi
    return max(10, min(50, size))

# ------------------------------------------------------------------
#          Construction du graphe interactif avec PyVis
# ------------------------------------------------------------------

def clean_views(view_count):
    if isinstance(view_count, str):
        # Retire tout sauf les chiffres
        view_count = re.sub(r'[^\d]', '', view_count)
        return int(view_count) if view_count.isdigit() else 0
    elif isinstance(view_count, int):
        return view_count
    return 0

def build_interactive_graph(data: dict, model, output_file="videos_graph.html"):
    net = Network(height="800px", width="100%", bgcolor="#222222", font_color="white", directed=True)
    net.barnes_hut(gravity=-8000, spring_length=100)

    color_mapping = {
        "sport": "#1f78b4",
        "makeup": "#ff69b4",
        "jeuxvideos": "#33a02c",
        "politique": "#e31a1c",
        "tech": "#ff7f00",
        "entertainment": "#6a3d9a",
        "vlog": "#ffff99",
        "actualites": "#a6cee3",
        "cuisine": "#b15928",
        "education": "#b2df8a",
        "automobile": "#7f7f7f"
    }
    default_color = "#ffffff"
    existing_nodes = set()

    for video in data.get("watchedVideos", []):
        video_url = video.get("videoURL", "")
        video_id = video_url.split("v=")[-1].split('&')[0]

        views = clean_views(video.get("views", 0))
        video_type = classify_video(video_url, model)

        if video_type is None:
            node_color = default_color
            node_label_type = "Sans sous-titres"
        else:
            node_color = color_mapping.get(video_type, default_color)
            node_label_type = video_type.capitalize()

        # Calcul de la taille du nœud
        node_size = compute_node_size(views)

        # Si views == 0 => forme "diamond", sinon "dot"
        node_shape = "diamond" if views == 0 else "dot"

        if video_id not in existing_nodes:
            net.add_node(
                video_id,
                label=video.get("title", f"Video {video_id}"),
                title=(
                    f"<b>{video.get('title', '')}</b>"
                    f"<br>Type : {node_label_type}"
                    f"<br>Vues : {views}"
                ),
                size=node_size,
                color=node_color,
                shape=node_shape,
                url=video_url
            )
            existing_nodes.add(video_id)

        # Recommandations
        for rec in video.get("recommendations", []):
            rec_url = rec.get("videoURL", "")
            rec_id = rec_url.split("v=")[-1].split('&')[0]

            rec_type = classify_video(rec_url, model)
            rec_views = 0  # Souvent, pas de "views" pour recommandations
            rec_color = default_color
            rec_label_type = "Sans sous-titres"

            if rec_type is not None:
                rec_color = color_mapping.get(rec_type, default_color)
                rec_label_type = rec_type.capitalize()

            # Taille pour les recommandations (0 = "pas de vues")
            rec_size = compute_node_size(rec_views)
            # Forme diamond si 0 vues
            rec_shape = "diamond" if rec_views == 0 else "dot"

            if rec_id not in existing_nodes:
                net.add_node(
                    rec_id,
                    label=rec.get("title", f"Video {rec_id}"),
                    title=(
                        f"<b>{rec.get('title', '')}</b>"
                        f"<br>Type : {rec_label_type}"
                    ),
                    size=rec_size,
                    color=rec_color,
                    shape=rec_shape,
                    url=rec_url
                )
                existing_nodes.add(rec_id)

            net.add_edge(video_id, rec_id, color="#aaaaaa", width=1, arrowStrikethrough=False)

    try:
        net.write_html(output_file)
        print(f"Graphe généré : {output_file}")
    except Exception as e:
        print(f"Erreur lors de la génération du graphe : {e}")

# ------------------------------------------------------------------
#          Main script : chargement JSON, modèle, exécution
# ------------------------------------------------------------------
if __name__ == "__main__":
    json_file = "datav2.json"  # À adapter
    model_path = "best_videotype_model.joblib"  # À adapter
    
    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    model = joblib.load(model_path)
    build_interactive_graph(data, model, output_file="videos_graph2.html")
