# AANDC — Phi-3 Mini Edition 🤖

Application de messagerie chiffrée avec **analyse IA locale** des communications de couple.

## Nouveautés v2 — Phi-3 Mini

L'analyseur regex a été remplacé par **Phi-3 Mini 4K Instruct** (3.8B params Microsoft) qui tourne **100% sur l'appareil** via [llama.rn](https://github.com/mybigday/llama.rn) (binding React Native de llama.cpp).

| | Regex (v1) | Phi-3 Mini (v2) |
|---|---|---|
| Contexte | Mots-clés seulement | Comprend le contexte |
| Ironie/nuances | Non | Oui |
| Green flags | Basiques | Détaillés + exemples + explications |
| Données envoyées | Aucune | **Aucune** (100% local) |

---

## Architecture ajoutée

```
src/
  lib/
    phi3/
      engine.ts      — llama.rn : download, load, generate (streaming)
      analyzer.ts    — Prompt engineering Phi-3 + parseur JSON sécurisé
  hooks/
    usePhiModel.ts   — Hook React (cycle de vie du modèle)
  components/
    ModelSetupCard   — UI : statut, barre de téléchargement, suppression
app/(app)/
  analysis.tsx       — Écran analyse (version Phi-3, remplace la v1)
```

---

## Installation

```bash
npm install
# Build natif requis (llama.rn compile du C++ — Expo Go ne suffit pas)
npx expo run:android   # ou run:ios
```

## Modèle GGUF

Se télécharge in-app au 1er lancement depuis l'écran Analyse.

- **Fichier** : `Phi-3-mini-4k-instruct.Q4_K_M.gguf`
- **Taille** : ~2.3 GB (Wifi recommandé)
- **Source** : Hugging Face microsoft/Phi-3-mini-4k-instruct-gguf
- **Stockage** : `FileSystem.documentDirectory/models/`

Pour changer le modèle → édite `PHI3_MODEL_CONFIG` dans `src/lib/phi3/engine.ts`.

## Performance estimée

| Appareil | ~30 messages |
|---|---|
| iPhone 15 Pro | 15-25s |
| Pixel 8 | 20-35s |
| Pixel 6a | 45-70s |

Les tokens sont streamés en temps réel (l'utilisateur voit la progression).

## Variables d'environnement

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Schéma Supabase

```sql
ALTER TABLE relationship_analyses
ADD COLUMN IF NOT EXISTS positive_signals text[] DEFAULT '{}';
```
