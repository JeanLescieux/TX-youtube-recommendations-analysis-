# TX YouTube Recommendations Analysis

Un projet d'extension Firefox pour analyser les recommandations vidéo sur YouTube. L'extension capture les titres des vidéos visionnées et des recommandations, les formate en JSON, et affiche les données via une interface utilisateur.

## Installation et utilisation

### Prérequis
- **Firefox** : Assurez-vous d'avoir la dernière version de Firefox installée sur votre machine.

### Étapes d'installation

1. **Télécharger Firefox** :
   - Si vous ne l'avez pas encore, téléchargez et installez Firefox depuis [le site officiel](https://www.mozilla.org/fr/firefox/new/).

2. **Accéder à l'outil de débogage des extensions** :
   - Ouvrez Firefox.
   - Tapez `about:debugging` dans la barre d'adresse et appuyez sur **Entrée**.
   - Dans la section **Ce Firefox**, cliquez sur **Charger un module complémentaire temporaire...**.

3. **Charger l'extension** :
   - Sélectionnez le fichier `manifest.json` depuis votre projet local.

4. **Naviguer sur YouTube** :
   - Une fois l'extension chargée, ouvrez [YouTube](https://www.youtube.com).
   - Effectuez une navigation classique en regardant des vidéos.
   - L'extension capturera les titres des vidéos regardées.

## Fonctionnalités

- Capture automatique des **titres des vidéos** visionnées.
- Suivi des **recommandations vidéos** affichées à l'utilisateur.
- Génération d'un fichier **JSON** répertoriant les vidéos et leurs recommandations.
- Affichage des résultats via une **interface utilisateur** accessible depuis l'extension.

## Contribution

Si vous souhaitez contribuer au projet :

1. Clonez le dépôt.
2. Créez une branche avec un descriptif clair : `git checkout -b ma-branche-contribution`.
3. Effectuez les modifications nécessaires.
4. Soumettez une pull request en expliquant les changements proposés.

## Problèmes connus

- tbd

## License

tbd
