# 💑 CoupleApp - Application Android

Application Android avec 4 onglets, protégée par un code PIN secret.

---

## 📱 Fonctionnalités

### 🔐 Écran de verrouillage
- Code PIN à 4 chiffres
- Création du PIN au premier lancement
- Stockage sécurisé avec expo-secure-store

### 📊 Onglet 1 - Analyseur de conversation
- Colle un export WhatsApp et analyse :
  - Nombre de messages par personne
  - Émotions détectées (tendresse, jalousie, humour...)
  - Heures les plus actives
  - Messages supprimés et médias

### 💑 Onglet 2 - Journal de couple
- Écris des entrées avec humeur (emojis)
- Choisis ton profil (Alex ou Camille)
- Envoie des "pokes" virtuels
- Historique des entrées façon conversation

### 🎵 Onglet 3 - Générateur de chanson
- Entre des mots-clés personnels
- Choisis le style (Pop, Rap, Chanson française...)
- Génère des paroles personnalisées
- Sauvegarde tes chansons préférées

### 🚩 Onglet 4 - Détecteur Red Flags
- Analyse un texte ou une conversation
- Score de communication /100
- Détecte les red flags, orange flags et green flags
- Conseils personnalisés

---

## 🚀 Comment compiler avec Expo

### Prérequis
- Compte gratuit sur https://expo.dev
- Node.js installé (https://nodejs.org)

### Étapes

1. **Installe Expo CLI**
```bash
npm install -g eas-cli
```

2. **Installe les dépendances**
```bash
cd CoupleApp
npm install
```

3. **Connecte-toi à Expo**
```bash
eas login
```

4. **Configure EAS Build**
```bash
eas build:configure
```

5. **Compile l'APK Android (gratuit)**
```bash
eas build -p android --profile preview
```

6. **Télécharge l'APK** depuis le lien fourni par Expo et installe-le sur ton téléphone.

---

## 📂 Structure des fichiers

```
CoupleApp/
├── app/
│   ├── _layout.tsx          # Layout racine
│   ├── index.tsx            # Écran PIN (verrouillage)
│   └── (tabs)/
│       ├── _layout.tsx      # Barre d'onglets
│       ├── analyzer.tsx     # Analyseur de conversation
│       ├── journal.tsx      # Journal de couple
│       ├── song.tsx         # Générateur de chanson
│       └── redflag.tsx      # Détecteur red flags
├── app.json                 # Config Expo
├── package.json             # Dépendances
└── babel.config.js          # Config Babel
```

---

## ⚙️ eas.json (à créer si demandé)

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

---

## 🔒 Sécurité
- Le PIN est stocké avec `expo-secure-store` (chiffrement natif Android Keystore)
- Les données (journal, chansons) sont stockées localement sur l'appareil
- Aucune donnée n'est envoyée sur internet

---

Fait avec ❤️ pour Alex & Camille
