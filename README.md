# Lexou 💗

Une application d'exploration psychologique d'Alex basée sur sa vie et ses pensées quotidiennes.

## Fonctionnalités

### 🎲 Générateur
Découvrez 100 générations différentes de pensées, sentiments et moments de la vie d'Alex. Chaque génération est catégorisée et animée pour votre plaisir.

- **100 générations uniques** couvrant différentes catégories
- **Navigation fluide** avec les boutons précédent/suivant
- **Mode aléatoire** pour des surprises
- **Catégories** : sentiments, quotidien, musique, humour, etc.

### ❤️ Ce qu'Alex aime
Une liste complète et visuelle de tout ce qui rend Alex heureux, des choses simples aux passions profondes.

- 20+ éléments de préférence
- Interface de grille intuitive
- Emojis pour chaque élément

### 🧠 Psychologie d'Alex
Une analyse complète de la personnalité d'Alex incluant :

- **Atouts** : ses forces et qualités
- **Faiblesses** : les défis qu'il affronte
- **Traits de caractère** : qui est vraiment Alex

## Installation

### Prérequis
- Node.js (v16 ou supérieur)
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)

### Étapes

1. **Cloner/Télécharger le projet**
```bash
cd lexou_project
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Lancer l'application**
```bash
npm start
# ou
yarn start
```

4. **Choisir votre plateforme**
- iOS: Appuyez sur `i`
- Android: Appuyez sur `a`
- Web: Appuyez sur `w`

## Architecture

### Fichiers principaux

- **App.jsx** : Composant principal avec la logique d'interface
- **alexData.js** : Toutes les données d'Alex (générations, préférences, psychologie)
- **app.json** : Configuration Expo
- **package.json** : Dépendances du projet

## Structure des données

### alexGenerations
Array de 100 objets contenant:
- `id`: Identifiant unique
- `text`: Le contenu du message/pensée
- `category`: Catégorie (sentiments, musique, etc.)
- `emoji`: Emoji associé

### alexLikes
Array de 20 éléments favoris avec:
- `emoji`: L'emoji représentatif
- `text`: Description du favori

### alexPsychology
Objet contenant:
- `atouts`: Array de forces
- `faiblesses`: Array de faiblesses
- `traits`: Array de traits de caractère
- `summary`: Résumé général

## Analyse de la discussion WhatsApp

Cette application est basée sur une analyse approfondie d'une discussion WhatsApp entre Alex et Camille, révélant:

### Émotions dominantes
- Affection profonde et attachement
- Insécurité et jalousie
- Paranoia légère (effets de substances)
- Créativité musicale
- Vulnérabilité émotionnelle

### Thèmes récurrents
- Distance relationnelle
- Créativité artistique
- Moments intimes
- Activités quotidiennes
- Introspection psychologique

## Personnalisation

### Ajouter des générations
Modifiez `alexData.js` et ajoutez des objets à `alexGenerations`:

```javascript
{
  id: 101,
  text: "Votre texte ici",
  category: "votre_categorie",
  emoji: "🎯",
}
```

### Changer les couleurs
Modifiez la palette `C` au début d'`App.jsx`:

```javascript
const C = {
  accent: "#VOTRE_COULEUR", // Rose actuelle: #FF1493
  // ... autres couleurs
};
```

## Thème de couleur

- **Fond principal** : Gris très foncé (#0D1117)
- **Accent** : Rose vibrant (#FF1493)
- **Texte** : Blanc cassé (#E6EDF3)
- **Bordures** : Gris subtle (#30363D)

## Dépendances principales

- **React Native** : Framework UI mobile
- **Expo** : Plateforme de développement React Native
- **React Native Safe Area Context** : Gestion des zones sûres
- **AsyncStorage** : Stockage local persistant

## Licences et crédit

Inspirée par une véritable relation humaine documentée via WhatsApp.

## Support

Pour tout problème ou suggestion, veuillez vérifier que:
1. Toutes les dépendances sont installées (`npm install`)
2. Vous utilisez une version récente d'Expo
3. Votre appareil/émulateur est connecté

## À propos

Lexou est une célébration de la psychologie complexe d'une personne, capturée à travers 100 moments uniques et une analyse profonde de sa personnalité.

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024
