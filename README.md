# ✨ GlassLyric Studio — Générateur de Vidéos Lyrics & Khassida TikTok (9:16 Full HD)

**GlassLyric Studio** est une application web de création et d'automatisation de vidéos musicales verticales (**1080 × 1920 — 9:16**) pour **TikTok, Reels et Shorts**, combinant deux moteurs visuels haute précision sur Canvas 2D à **60 FPS** :
1. **💎 Moteur Glassmorphism (Verre Dépoli & Reflets Spéculaires)** pour la musique sénégalaise (Mbalax, Afro, Pop, Urbain).
2. **🕌 Mode Khassida — Moteur Neumorphism (Relief Soft-UI Tactile)** spécialement conçu pour les récitations de **Khassidas** et chants religieux avec ornements islamiques et mourides.

---

## 🌟 Fonctionnalités Principales

### 1. 🎨 4 Modèles Visuels Prêts à l'Emploi
- **🇸🇳 Style 1 — Classique Drapeaux & Pilule Large** :
  - Pilule artiste large avec portrait circulaire et badge vérifié.
  - Drapeaux flottants en soie 3D aux coins (Sénégal, Mali, Guinée, Côte d'Ivoire, Maroc, etc.).
  - Notes de musique en verre 3D flottantes (`♪ ♫`), égaliseur symétrique à points, lecteur glassmorphic à 5 boutons, signature calligraphique (`Sénégal ♡`) et badge `#Hashtag`.
- **💛 Style 2 — Compact Onde, Guillemets 3D & TikTok** :
  - Pilule centrale compacte avec médaillon couronne dorée (`👑`) et mini-onde animée.
  - Drapeau sur mât métallique, guillemets 3D lumineux (`“`), cœur pinceau jaune (`♡`), et colonne d'icônes sociales TikTok (`Likes`, `Commentaires`, `Favoris`, `Partages`).
- **✨ Style 3 — Cristal Néon & Karaoké** :
  - Verre cristal à lueur cyan/or intense et mode de surlignage karaoké progressif.
- **🕌 Mode Khassida — Thème Neumorphism (Soft-UI)** :
  - Relief tactile **Soft-UI** avec ombres doubles opposées et cadre intérieur creusé (*Inset Well* via découpe `evenodd`).
  - **Décorations Islamiques & Mourides** : Croissant de lune & étoile 3D (`☪`), lanternes de mosquée suspendues (*Fanous*), arche de Mihrab orientale en filigrane, et silhouette sculptée de la **Grande Mosquée de Touba (Lamp Fall)**.
  - Calligraphie sacrée en en-tête (`﷽`, `۞ خَصِيدَة ۞`, `يَا رَسُولَ اللَّهِ`) et médaillon **TOUBA**.
  - **5 Palettes Neumorphic Soft-UI** :
    - `🤍 Blanc Pur Neumorphism` (Porcelaine & Or Champagne)
    - `🏜️ Beige Sable & Or Doux` (Crème Sablée & Or Ambré)
    - `🕌 Émeraude de Touba & Or` (Vert Profond & Or)
    - `📜 Ivoire Parchemin & Émeraude` (Clair Traditionnel)
    - `🌙 Obsidienne Nuit & Or Soufi` (Sombre Prestige)

---

### 2. ✍️ Éditeur de Paroles Intelligent & Auto-Fit
- **Retours à la ligne & Auto-Fit automatiques** : le moteur ajuste dynamiquement l'équilibrage des lignes et la taille de la police pour que chaque couplet tienne toujours parfaitement dans le cadre en verre ou le puits Neumorphic sans jamais déborder.
- **Surlignage Mot-par-Mot en 1 Clic** : cliquez directement sur les puces de mots sous chaque couplet pour les colorer en **Jaune Or Pinceau** (`*mot*`).
- **Bouton `Trait Pinceau` par carte** : activez ou désactivez le coup de pinceau doré sous chaque couplet individuellement.
- **Bouton `🕒 Caler Temps (MM:SS)` & Mode `Tap-Sync`** : synchronisez vos couplets en temps réel en écoutant la musique (au clic ou avec la touche `Espace`).
- **Import / Export `.LRC` et `.SRT`** + collage rapide de texte brut.

---

### 3. 🎬 Timeline Multipiste Interactive & Lecture Fluide
- **Timeline Studio Multipiste** (`StudioTimeline.jsx`) :
  - Piste forme d'onde audio + piste de blocs de paroles redimensionnables et déplaçables à la souris (`Drag & Drop`).
  - Découpage d'un couplet au curseur (`Scinder`), ajout rapide (`+ Couplet au curseur`), zoom temporel et vitesse de lecture (`0.5x` à `1.25x`).
- **Contrôle direct sur l'aperçu 9:16** : cliquez ou glissez directement sur la barre de progression et les boutons `|<`, `||`, `>|` à l'intérieur du lecteur vidéo.
- **Support Vidéo & Photo de Fond** : importez une image ou une vidéo MP4/WebM en arrière-plan (avec option d'utiliser directement le son de la vidéo importée).

---

### 4. ✂️ Sélecteur Visuel d'Extrait & Export Vidéo Full HD
- **Sélecteur Visuel de Partie à Exporter** (`ExportRangeSelector.jsx`) :
  - Durées TikTok en 1 clic (`15s`, `30s`, `45s`, `60s`, `Tous les couplets`, `Toute la chanson`).
  - Fenêtre verte glissable directement sur la forme d'onde de la musique avec poignées `DÉBUT` et `FIN`.
  - Sélection par clic sur le couplet de départ et le couplet de fin.
- **Export Vidéo 1080 × 1920 (60 FPS — 12 Mbps)** avec piste audio intégrée (`MP4` / `WebM`) + capture instantanée d'affiche `PNG 1080×1920`.

---

## 📁 Architecture du Projet

```text
GLASS LYRIC/
├── index.html                        # Chargement des polices Google Fonts (Caveat Brush, Amiri, Cinzel, etc.)
├── package.json                      # Dépendances React 19, Vite 6, Tailwind CSS v4, Lucide Icons
├── vite.config.js                    # Configuration Vite
├── LANCER_STUDIO.bat                 # Script de lancement rapide sous Windows
├── public/
│   ├── backgrounds/                  # Fonds HD par défaut (Coucher de soleil Dakar, Avatar Artiste)
│   └── references/                   # Images modèles de référence
└── src/
    ├── main.jsx                      # Point d'entrée React
    ├── index.css                     # Styles globaux & Tailwind CSS
    ├── App.jsx                       # Interface principale du Studio (5 onglets + Aperçu + Export)
    ├── components/
    │   ├── StudioTimeline.jsx        # Timeline multipiste interactive (scrubbing 60fps, drag & resize)
    │   └── ExportRangeSelector.jsx   # Sélecteur visuel de la zone à exporter
    ├── presets/
    │   └── defaultPresets.js         # Modèles (Style 1, 2, 3, Khassida), Palettes Neumorphic, Polices, Drapeaux, Parser LRC/SRT
    ├── renderer/
    │   └── canvasRenderer.js         # Moteur de rendu Canvas 2D 1080x1920 (Glassmorphism & Neumorphism Soft-UI)
    └── utils/
        └── audioEngine.js            # Web Audio API, Analyseur de fréquences temps réel & Générateur audio démo
```

---

## 🚀 Installation & Lancement

### Prérequis
- **Node.js** (version 18 ou supérieure)

### Lancement rapide (Windows)
Double-cliquez sur le fichier **`LANCER_STUDIO.bat`** à la racine du projet.

### Lancement en ligne de commande
```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev

# 3. Compiler pour la production
npm run build
```

Ouvrez ensuite l'URL affichée dans le terminal (par défaut `http://localhost:5173` ou `http://localhost:5174`).

---

## 🛠️ Technologies Utilisées
- **React 19** + **Vite 6**
- **HTML5 Canvas 2D API** (Rendu 1080×1920 à 60 FPS, double buffer de flou Glassmorphic & ombres Neumorphic `evenodd`)
- **Web Audio API** (`AudioContext`, `AnalyserNode`, `MediaStreamAudioDestinationNode`)
- **MediaRecorder API** (Capture vidéo Full HD 12 Mbps avec flux audio synchronisé)
- **Tailwind CSS v4** & **Lucide React Icons**
