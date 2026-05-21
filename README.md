# Programme Alex

Site personnel de reconstruction — hébergé sur Render, code sur GitHub.

## Structure des fichiers

```
programme-alex/
├── public/index.html
├── src/
│   ├── index.js
│   ├── App.js          ← composant principal (page d'accueil + page "Quoi faire?")
│   └── data.js         ← programme complet 49 jours + calcul des dates
├── package.json
├── render.yaml         ← configuration Render
└── .gitignore
```

## Déploiement

### 1. GitHub
1. Crée un repo GitHub (ex: `programme-alex`) — en **privé** si tu veux
2. Dans le dossier du projet :
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TON_USERNAME/programme-alex.git
git push -u origin main
```

### 2. Render
1. Va sur https://render.com et connecte-toi
2. Clique **New → Static Site**
3. Connecte ton repo GitHub
4. Paramètres :
   - **Build Command** : `npm install && npm run build`
   - **Publish Directory** : `build`
5. Clique **Create Static Site**
6. Render build et déploie automatiquement → tu reçois une URL

### Mettre à jour la date de début

Dans `src/data.js`, ligne 3 :
```js
export const PROGRAMME_START_DATE = new Date('2026-05-21T00:00:00');
```
Change cette date pour qu'elle corresponde au vrai premier jour du programme d'Alex.

Puis commit + push → Render se redéploie automatiquement.
