# Programme Alex — Application Expo Go

## Prérequis
- Node.js 18+ installé sur ton PC
- L'application **Expo Go** installée sur ton téléphone Android
  → https://play.google.com/store/apps/details?id=host.exp.exponent

---

## Installation

1. **Dézippe** ce dossier sur ton PC

2. **Ouvre un terminal** dans le dossier `ProgrammeAlex` et lance :

```bash
npm install
```

3. **Démarre l'application** :

```bash
npx expo start
```

4. **Sur ton téléphone Android** :
   - Ouvre l'app **Expo Go**
   - Scanne le **QR code** qui apparaît dans le terminal
   - L'app se charge directement sur ton téléphone ✅

---

## Structure des fichiers

```
ProgrammeAlex/
├── app/
│   ├── _layout.jsx     → Configuration de navigation
│   └── index.jsx       → Écran principal (Programme + Règles)
├── data.js             → Toutes les données (phases, règles)
├── app.json            → Config Expo
├── package.json        → Dépendances
└── babel.config.js     → Config Babel
```

---

## En cas de problème

- Si `npm install` échoue → essaie `npm install --legacy-peer-deps`
- Si l'app ne se charge pas → vérifie que ton PC et ton téléphone sont sur le **même réseau Wi-Fi**
- Pour forcer le rechargement → secoue le téléphone → "Reload"
