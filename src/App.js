import { useState, useEffect, useCallback } from "react";
import { PROGRAMME_JOURS, getJourActuel, getSemaineActuelle, getDaysElapsed, PROGRAMME_START_DATE } from "./data";

// ─── Utilitaires stockage local ─────────────────────────────────────────────
const STORAGE_KEY = "alex_programme_v2";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ─── Note de la semaine ──────────────────────────────────────────────────────
function calculerNoteJour(taches, cocheesIds) {
  if (!taches || taches.length === 0) return 10;
  const nb = taches.filter(t => cocheesIds.includes(t.id)).length;
  return Math.round((nb / taches.length) * 10);
}

function getCommentaireNote(note) {
  if (note === 10) return { emoji: "🌟", texte: "Parfait. Chaque case cochée. Tu prouvais que tu peux le faire.", couleur: "#27AE60" };
  if (note >= 8) return { emoji: "💪", texte: "Très bonne journée. Quelques manques mais l'essentiel était là.", couleur: "#2ECC71" };
  if (note >= 6) return { emoji: "🙂", texte: "Correct, mais tu sais que tu pouvais faire mieux. Demain, tu peux.", couleur: "#F39C12" };
  if (note >= 4) return { emoji: "😐", texte: "Journée difficile. Pas de honte — mais demain, une case de plus.", couleur: "#E67E22" };
  if (note >= 2) return { emoji: "😔", texte: "Presque rien de coché. Qu'est-ce qui s'est passé ? Écris-le dans ton carnet.", couleur: "#E74C3C" };
  return { emoji: "❌", texte: "Journée blanche. C'est un signal — pas une fatalité. Tu recommences demain.", couleur: "#C0392B" };
}

function getCommentaireSemaine(moyenne) {
  if (moyenne >= 9) return { emoji: "🏆", texte: "Semaine exceptionnelle. Tu as montré ce dont tu es capable.", couleur: "#F1C40F" };
  if (moyenne >= 7) return { emoji: "✅", texte: "Bonne semaine dans l'ensemble. Continue sur cette lancée.", couleur: "#27AE60" };
  if (moyenne >= 5) return { emoji: "🌱", texte: "Semaine mitigée. Il y a eu du bon — capitalise dessus la prochaine fois.", couleur: "#F39C12" };
  if (moyenne >= 3) return { emoji: "⚠️", texte: "Semaine difficile. Parle-en à ton médecin ou note ce qui coince.", couleur: "#E74C3C" };
  return { emoji: "🚨", texte: "Semaine très difficile. C'est le moment de demander de l'aide concrète.", couleur: "#C0392B" };
}

// ─── Page "Quoi faire" (le programme des 5 phases) ──────────────────────────
const phases = [
  {
    id: 1, numero: "01", titre: "Se soigner vraiment", duree: "Mois 1–2", couleur: "#C0392B", icon: "🧠",
    description: "Rien n'est possible sans cette base. Tout le reste s'effondre sans elle.",
    actions: [
      { titre: "Arrêt total de la cocaïne", detail: "Pas de réduction progressive — arrêt. Avec accompagnement médical obligatoire. Un addictologue, pas juste la volonté seule. La C déforme la réalité, alimente la paranoïa et détruit ce qu'on construit chaque jour." },
      { titre: "Suivi psychiatrique régulier", detail: "Trouver un psychiatre fixe. Le trouble borderline et la bipolarité se traitent — mais seulement avec un suivi régulier et un traitement adapté, non perturbé par des substances." },
      { titre: "Respecter son traitement", detail: "Prendre ses médicaments chaque jour, même quand ça va mieux. Surtout quand ça va mieux. Tenir un carnet de suivi de son humeur pour aider le médecin." },
      { titre: "Réguler son sommeil", detail: "Se coucher et se lever à heures fixes. Pas de messages après minuit. Pas de café à 3h du matin. Le sommeil est la fondation de l'équilibre émotionnel." }
    ],
    erreurs: [
      "Envoyer des messages la nuit sous prétexte de ne pas dormir",
      "Croire que la C n'est 'qu'une fois de temps en temps'",
      "Stopper le traitement psychiatrique dès que ça va un peu mieux",
      "Gérer les crises seul sans appeler un professionnel"
    ]
  },
  {
    id: 2, numero: "02", titre: "Reconstruire une vie à soi", duree: "Mois 2–4", couleur: "#E67E22", icon: "🏗️",
    description: "Camille ne peut pas être le seul ancrage d'Alex. Il faut d'autres piliers.",
    actions: [
      { titre: "Reprendre le sport", detail: "Vélo, musculation — peu importe. 3 fois par semaine minimum. Le sport régule naturellement la dopamine et la sérotonine que la C a épuisées." },
      { titre: "Développer la musique sérieusement", detail: "Pas juste partager des liens YouTube. Créer, produire, publier. La boutique Etsy est un bon début. Ces activités créatives donnent un sentiment de valeur qui ne dépend d'aucune relation." },
      { titre: "Reprendre le travail progressivement", detail: "Même quelques heures par semaine. Avoir un lieu à aller, des horaires, des collègues — ça structure et ça sort du cercle vicieux de la rumination." },
      { titre: "Investir dans ses amitiés", detail: "Répondre à Valentin. Appeler ses amis sans que ce soit une crise. Pas pour remplacer Camille — pour ne plus la surcharger." }
    ],
    erreurs: [
      "Rester enfermé des journées entières sans sortir",
      "Compter uniquement sur Camille pour remplir son temps vide",
      "Abandonner un projet dès la première difficulté",
      "Attendre d'aller mieux pour commencer — commencer aide à aller mieux"
    ]
  },
  {
    id: 3, numero: "03", titre: "Apprendre à faire confiance", duree: "Mois 3–5", couleur: "#F1C40F", icon: "🤝",
    description: "La jalousie ne protège pas. Elle détruit exactement ce qu'on veut garder.",
    actions: [
      { titre: "Supprimer la surveillance", detail: "Ne plus regarder la localisation. Ne plus demander qui elle a en ligne. Chaque vérification nourrit l'angoisse au lieu de la calmer." },
      { titre: "Apprendre à tolérer l'incertitude", detail: "Quand l'angoisse monte parce qu'elle ne répond pas, noter ce qu'on ressent dans un carnet plutôt que d'envoyer un message accusateur." },
      { titre: "Travailler la peur de l'abandon en thérapie", detail: "Cette peur vient de loin — pas de Camille. Un thérapeute spécialisé en TCC peut aider à comprendre d'où elle vient et comment la désamorcer." },
      { titre: "Faire confiance aux actes, pas aux preuves", detail: "Camille a montré par ses actes pendant des mois qu'elle était digne de confiance. S'appuyer sur ce bilan réel plutôt que sur les peurs imaginaires." }
    ],
    erreurs: [
      "Demander à voir son téléphone, ses archives, sa localisation",
      "Interpréter chaque silence comme une trahison",
      "Supprimer des messages impulsifs puis recommencer",
      "Utiliser la jalousie comme preuve d'amour",
      "Poser des questions accusatrices déguisées en inquiétude"
    ]
  },
  {
    id: 4, numero: "04", titre: "Communiquer sans blesser", duree: "Mois 4–6", couleur: "#27AE60", icon: "💬",
    description: "Les mots laissent des traces. Changer sa façon de parler change la relation.",
    actions: [
      { titre: "Parler en 'je' plutôt qu'en 'tu'", detail: "Au lieu de 'tu caches quelque chose', dire 'je me sens insécure là'. Ce n'est pas une faiblesse — c'est la seule façon de créer un vrai échange." },
      { titre: "Ne jamais envoyer un message en colère", detail: "Poser le téléphone. Attendre 20 minutes. Si le message semble toujours nécessaire après — l'écrire différemment, calmement." },
      { titre: "Écouter sans interrompre, sans se défendre", detail: "Quand Camille exprime quelque chose qui fait mal, résister à l'impulsion de se justifier immédiatement. Dire 'je t'entends' avant de répondre." },
      { titre: "Reconnaître ses torts sans sur-s'excuser", detail: "Un vrai 'j'ai eu tort' vaut mille fois mieux qu'un 'pardon pardon pardon' suivi du même comportement le lendemain." }
    ],
    erreurs: [
      "Dire des mots brutaux même en crise",
      "Faire des menaces déguisées ('on verra si tu répondras')",
      "Supprimer des messages — ça crée de l'instabilité",
      "Interrompre une conversation difficile par un emoji",
      "Rejouer les anciens conflits pour avoir raison"
    ]
  },
  {
    id: 5, numero: "05", titre: "Devenir un partenaire équilibré", duree: "Mois 6+", couleur: "#2980B9", icon: "⚖️",
    description: "L'objectif final : une relation où les deux grandissent.",
    actions: [
      { titre: "Rembourser ce qui est dû", detail: "L'argent emprunté à Camille doit être remboursé, intégralement. C'est une question de respect et de dignité pour les deux." },
      { titre: "Ne plus jamais demander d'argent à une partenaire", detail: "La dépendance financière crée un déséquilibre de pouvoir qui empoisonne la relation." },
      { titre: "Apprendre à donner sans attendre en retour", detail: "S'intéresser à elle, l'écouter, lui demander comment elle va sans enchaîner sur ses propres angoisses." },
      { titre: "Proposer des projets concrets", detail: "Pas seulement 'j'ai hâte de te voir' — mais 'j'ai réservé un truc pour nous'. L'amour se construit dans des actes planifiés." }
    ],
    erreurs: [
      "Se remettre en couple avant d'avoir fait les étapes précédentes",
      "Croire que l'amour suffit sans le travail concret",
      "Retomber dans les anciens schémas dès la première dispute",
      "Attendre que Camille revienne d'elle-même sans avoir changé",
      "Utiliser la guérison comme argument de séduction"
    ]
  }
];

const regles = [
  { emoji: "🚫", texte: "Jamais de message accusateur sans preuve concrète" },
  { emoji: "🚫", texte: "Jamais de surveillance (localisation, réseaux, téléphone)" },
  { emoji: "🚫", texte: "Jamais de messages après minuit sauf urgence réelle" },
  { emoji: "🚫", texte: "Jamais de demande d'argent à Camille" },
  { emoji: "🚫", texte: "Jamais de mot brutal même en crise" },
  { emoji: "🚫", texte: "Jamais de menaces déguisées en inquiétude" },
  { emoji: "🚫", texte: "Jamais de cocaïne en contact avec Camille" },
  { emoji: "✅", texte: "Toujours dire ce qu'on ressent en 'je', pas en 'tu'" },
  { emoji: "✅", texte: "Toujours attendre avant d'envoyer un message de colère" },
  { emoji: "✅", texte: "Toujours s'excuser avec des actes, pas seulement des mots" },
  { emoji: "✅", texte: "Toujours avoir un rendez-vous médical à venir" },
  { emoji: "✅", texte: "Toujours garder une activité qui n'implique pas Camille" }
];

// ─── Composant page "Quoi faire" ─────────────────────────────────────────────
function PageQuoiFaire({ onClose }) {
  const [phaseActive, setPhaseActive] = useState(null);
  const [onglet, setOnglet] = useState("programme");

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)",
      overflowY: "auto",
      fontFamily: "'Crimson Text', Georgia, serif",
      color: "#e8e0d0"
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "32px 24px 24px",
        background: "rgba(255,255,255,0.02)",
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#888", textTransform: "uppercase", marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>
            Programme de reconstruction personnelle
          </div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, margin: 0, lineHeight: 1.1, color: "#f0ebe0", fontFamily: "'Playfair Display', Georgia, serif" }}>
            Pour Alex
          </h1>
        </div>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#aaa", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13,
          fontFamily: "'Space Mono', monospace", letterSpacing: 1
        }}>
          ← Retour
        </button>
      </div>

      {/* Navigation */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 0 }}>
          {["programme", "regles"].map(tab => (
            <button key={tab} onClick={() => setOnglet(tab)} style={{
              background: "none", border: "none",
              borderBottom: onglet === tab ? "2px solid #e8e0d0" : "2px solid transparent",
              color: onglet === tab ? "#e8e0d0" : "#666",
              padding: "14px 20px", cursor: "pointer", fontSize: 12,
              letterSpacing: 2, textTransform: "uppercase",
              fontFamily: "'Space Mono', monospace", transition: "all 0.2s"
            }}>
              {tab === "programme" ? "Les 5 phases" : "Les règles d'or"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 24px 64px" }}>
        {onglet === "programme" && (
          <div>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12, padding: "20px 24px", marginBottom: 28,
              fontStyle: "italic", color: "#aaa", fontSize: 15, lineHeight: 1.7
            }}>
              Ce programme n'est pas une liste de cases à cocher. C'est un chemin. Les phases se superposent, certaines durent plus longtemps que prévu. L'important n'est pas la vitesse — c'est la direction.
            </div>
            {phases.map((phase) => (
              <div key={phase.id} style={{ marginBottom: 14 }}>
                <button onClick={() => setPhaseActive(phaseActive === phase.id ? null : phase.id)} style={{
                  width: "100%",
                  background: phaseActive === phase.id ? `${phase.couleur}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${phaseActive === phase.id ? phase.couleur + "44" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: phaseActive === phase.id ? "12px 12px 0 0" : 12,
                  padding: "18px 22px", cursor: "pointer", textAlign: "left",
                  color: "#e8e0d0", transition: "all 0.25s",
                  display: "flex", alignItems: "center", gap: 14
                }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: phase.couleur, letterSpacing: 2, minWidth: 20 }}>{phase.numero}</span>
                  <span style={{ fontSize: 20 }}>{phase.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2, fontFamily: "'Playfair Display', serif" }}>{phase.titre}</div>
                    <div style={{ fontSize: 11, color: "#666", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>{phase.duree}</div>
                  </div>
                  <span style={{ color: "#555", fontSize: 16, transform: phaseActive === phase.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}>↓</span>
                </button>
                {phaseActive === phase.id && (
                  <div style={{
                    background: "rgba(255,255,255,0.02)", border: `1px solid ${phase.couleur}33`,
                    borderTop: "none", borderRadius: "0 0 12px 12px", padding: "20px"
                  }}>
                    <p style={{ color: "#aaa", fontStyle: "italic", fontSize: 15, marginTop: 0, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{phase.description}</p>
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 10, letterSpacing: 3, color: phase.couleur, textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 14 }}>À faire</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {phase.actions.map((action, j) => (
                          <div key={j} style={{ background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${phase.couleur}`, borderRadius: "0 8px 8px 0", padding: "12px 14px" }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: "#e8e0d0" }}>{action.titre}</div>
                            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>{action.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: 3, color: "#C0392B", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 14 }}>Erreurs à ne plus commettre</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {phase.erreurs.map((erreur, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#888", lineHeight: 1.5 }}>
                            <span style={{ color: "#C0392B", marginTop: 1, flexShrink: 0 }}>✕</span>
                            <span>{erreur}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div style={{ marginTop: 36, padding: "24px 28px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontSize: 26, marginBottom: 14 }}>🌱</div>
              <p style={{ color: "#aaa", fontSize: 15, lineHeight: 1.8, fontStyle: "italic", maxWidth: 520, margin: "0 auto" }}>
                Camille ne reviendra pas parce qu'Alex aura dit les bons mots. Elle reviendra — peut-être — parce qu'il sera devenu quelqu'un qui n'a plus besoin d'elle pour exister.
              </p>
            </div>
          </div>
        )}

        {onglet === "regles" && (
          <div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 24px", marginBottom: 28, fontStyle: "italic", color: "#aaa", fontSize: 15, lineHeight: 1.7 }}>
              Ces règles ne sont pas des contraintes imposées de l'extérieur. Ce sont les limites qu'Alex doit s'imposer à lui-même.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {regles.map((regle, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px",
                  background: regle.emoji === "🚫" ? "rgba(192,57,43,0.06)" : "rgba(39,174,96,0.06)",
                  border: `1px solid ${regle.emoji === "🚫" ? "rgba(192,57,43,0.15)" : "rgba(39,174,96,0.15)"}`,
                  borderRadius: 10
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{regle.emoji}</span>
                  <span style={{ fontSize: 14, color: regle.emoji === "🚫" ? "#c0a0a0" : "#a0c0a8", lineHeight: 1.5 }}>{regle.texte}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 36, padding: "24px 28px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#666", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 14 }}>
                La règle au-dessus de toutes les règles
              </div>
              <p style={{ color: "#c8c0b0", fontSize: 16, lineHeight: 1.8, fontStyle: "italic", margin: 0 }}>
                "Avant d'envoyer un message, se poser une seule question : est-ce que ce message nourrit la relation ou est-ce qu'il nourrit mon angoisse ?"
              </p>
              <p style={{ color: "#666", fontSize: 13, marginTop: 10, marginBottom: 0, lineHeight: 1.6 }}>
                Si la réponse est "mon angoisse" — poser le téléphone. Toujours.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function App() {
  const [showQuoiFaire, setShowQuoiFaire] = useState(false);
  const [state, setState] = useState(loadState);
  const [jourIndex, setJourIndex] = useState(getJourActuel);
  const [semaine, setSemaine] = useState(getSemaineActuelle);
  const [now, setNow] = useState(new Date());

  // Mise à jour à minuit heure France
  useEffect(() => {
    const tick = () => {
      const newJour = getJourActuel();
      const newSem = getSemaineActuelle();
      setJourIndex(newJour);
      setSemaine(newSem);
      setNow(new Date());
    };
    // Recalcule toutes les minutes
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  // Données du jour actuel
  const jourData = PROGRAMME_JOURS[Math.min(jourIndex, PROGRAMME_JOURS.length - 1)];
  const totalJoursProgramme = PROGRAMME_JOURS.length;
  const joursRestants = Math.max(0, totalJoursProgramme - jourIndex - 1);
  const jourActuelNum = jourIndex + 1;

  // Clé de stockage pour les coches du jour
  const dayKey = `day_${jourIndex}`;
  const cocheesAujourdHui = state[dayKey] || [];

  const toggleTache = useCallback((id) => {
    setState(prev => {
      const current = prev[dayKey] || [];
      const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
      const newState = { ...prev, [dayKey]: next };
      saveState(newState);
      return newState;
    });
  }, [dayKey]);

  // Calcul note du jour
  const noteJour = calculerNoteJour(jourData?.taches || [], cocheesAujourdHui);
  const commentaireJour = getCommentaireNote(noteJour);

  // Calcul note de la semaine (jours 1-6 déjà passés + aujourd'hui)
  const premierJourSemaine = (semaine - 1) * 7;
  const notesJoursSemaine = [];
  for (let i = premierJourSemaine; i <= jourIndex; i++) {
    const j = PROGRAMME_JOURS[i];
    if (j) {
      const k = `day_${i}`;
      const coches = state[k] || [];
      notesJoursSemaine.push(calculerNoteJour(j.taches, coches));
    }
  }
  const moyenneSemaine = notesJoursSemaine.length > 0
    ? Math.round(notesJoursSemaine.reduce((a, b) => a + b, 0) / notesJoursSemaine.length)
    : null;
  const commentaireSemaine = moyenneSemaine !== null ? getCommentaireSemaine(moyenneSemaine) : null;

  // Jours de la semaine pour afficher les notes passées
  const joursAffichage = [];
  for (let i = premierJourSemaine; i < premierJourSemaine + 7 && i < PROGRAMME_JOURS.length; i++) {
    const j = PROGRAMME_JOURS[i];
    if (!j) continue;
    const k = `day_${i}`;
    const coches = state[k] || [];
    const note = i < jourIndex ? calculerNoteJour(j.taches, coches) : null;
    joursAffichage.push({ jour: i + 1, note, estAujourdHui: i === jourIndex, estFutur: i > jourIndex });
  }

  if (showQuoiFaire) {
    return <PageQuoiFaire onClose={() => setShowQuoiFaire(false)} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0c0c14 0%, #111118 60%, #0c0c14 100%)",
      fontFamily: "'Crimson Text', Georgia, serif",
      color: "#e8e0d0",
    }}>
      {/* ── HEADER ── */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "28px 20px 20px",
        background: "rgba(255,255,255,0.015)",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 4, color: "#666", textTransform: "uppercase", marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>
              Reconstruction
            </div>
            <h1 style={{
              fontSize: "clamp(24px, 5vw, 42px)", fontWeight: 700, margin: 0,
              lineHeight: 1.05, color: "#f0ebe0",
              fontFamily: "'Playfair Display', Georgia, serif"
            }}>
              Programme Alex
            </h1>
          </div>
          <button
            onClick={() => setShowQuoiFaire(true)}
            style={{
              background: "#1a3a6b",
              border: "1px solid #2a5aab",
              color: "#a8c4f0",
              borderRadius: 10,
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "'Space Mono', monospace",
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.2s",
              boxShadow: "0 2px 12px rgba(26,58,107,0.4)"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#1e4a8a"}
            onMouseLeave={e => e.currentTarget.style.background = "#1a3a6b"}
          >
            Quoi faire ?
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px 80px" }}>

        {/* ── COMPTEURS SEMAINES / JOURS ── */}
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, padding: "20px 22px", marginBottom: 22
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{
              fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 700,
              fontFamily: "'Playfair Display', serif", color: "#f0ebe0", lineHeight: 1
            }}>
              Semaine {semaine}
            </span>
            <span style={{ fontSize: 14, color: "#666", fontFamily: "'Space Mono', monospace" }}>
              / 7
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#888", fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>
            Jour <span style={{ color: "#c0b898" }}>{jourActuelNum}</span>
            <span style={{ color: "#555", margin: "0 6px" }}>·</span>
            <span style={{ color: "#888" }}>{joursRestants} jours restants</span>
          </div>
          {/* Barre progression semaine */}
          <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
            {joursAffichage.map((j, i) => {
              let bg = "rgba(255,255,255,0.06)";
              let border = "1px solid rgba(255,255,255,0.08)";
              if (j.estAujourdHui) { bg = "#1a3a6b"; border = "1px solid #2a5aab"; }
              else if (!j.estFutur && j.note !== null) {
                const c = getCommentaireNote(j.note);
                bg = c.couleur + "33"; border = `1px solid ${c.couleur}55`;
              }
              return (
                <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: bg, border, transition: "all 0.3s" }} title={`Jour ${j.jour}${j.note !== null ? ` — Note: ${j.note}/10` : ""}`} />
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#555", fontFamily: "'Space Mono', monospace" }}>{d}</div>
            ))}
          </div>
        </div>

        {/* ── ÉTAPE DU JOUR ── */}
        {jourData && (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{
                display: "inline-block",
                background: "rgba(200,180,120,0.12)",
                borderRadius: 6,
                padding: "4px 12px",
                marginBottom: 10
              }}>
                <span style={{
                  fontSize: "clamp(18px, 4vw, 26px)",
                  fontWeight: 700,
                  fontFamily: "'Playfair Display', serif",
                  color: "#d4b87a",
                  textDecoration: "underline",
                  textDecorationColor: "rgba(212,184,122,0.4)",
                  textUnderlineOffset: 4
                }}>
                  {jourData.etape}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#555", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>
                Jour {jourData.jour} du programme
              </div>
            </div>

            {/* ── LISTE DES TACHES ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#888", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 14 }}>
                Aujourd'hui à faire
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {jourData.taches.map((tache) => {
                  const cochee = cocheesAujourdHui.includes(tache.id);
                  return (
                    <button
                      key={tache.id}
                      onClick={() => toggleTache(tache.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        background: cochee ? "rgba(39,174,96,0.08)" : "rgba(255,255,255,0.03)",
                        border: cochee ? "1px solid rgba(39,174,96,0.25)" : "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 12, padding: "14px 16px",
                        cursor: "pointer", textAlign: "left",
                        transition: "all 0.2s", width: "100%"
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        border: cochee ? "2px solid #27AE60" : "2px solid rgba(255,255,255,0.15)",
                        background: cochee ? "#27AE60" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s"
                      }}>
                        {cochee && <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{
                        fontSize: 15, lineHeight: 1.4, color: cochee ? "#88bb88" : "#e0d8c8",
                        textDecoration: cochee ? "line-through" : "none",
                        textDecorationColor: "rgba(136,187,136,0.5)",
                        transition: "all 0.2s"
                      }}>
                        {tache.texte}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Score du jour */}
              <div style={{
                marginTop: 16, padding: "14px 18px",
                background: `${commentaireJour.couleur}11`,
                border: `1px solid ${commentaireJour.couleur}33`,
                borderRadius: 10, display: "flex", alignItems: "center", gap: 12
              }}>
                <span style={{ fontSize: 20 }}>{commentaireJour.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: commentaireJour.couleur, marginBottom: 2 }}>
                    {cocheesAujourdHui.length}/{jourData.taches.length} tâches · {noteJour}/10
                  </div>
                  <div style={{ fontSize: 13, color: "#888", lineHeight: 1.4 }}>
                    {commentaireJour.texte}
                  </div>
                </div>
              </div>
            </div>

            {/* ── RAPPELS ROUGES ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#C0392B", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 14 }}>
                ⚠ Rappels — À ne pas faire
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {jourData.rappels.map((rappel, i) => (
                  <div key={i} style={{
                    padding: "12px 16px",
                    background: "rgba(192,57,43,0.07)",
                    border: "1px solid rgba(192,57,43,0.2)",
                    borderLeft: "3px solid #C0392B",
                    borderRadius: "0 10px 10px 0",
                    fontSize: 14, color: "#cc9090", lineHeight: 1.5
                  }}>
                    {rappel}
                  </div>
                ))}
              </div>
            </div>

            {/* ── NOTE DE LA SEMAINE ── */}
            {commentaireSemaine && (
              <div style={{
                padding: "18px 20px",
                background: `${commentaireSemaine.couleur}0d`,
                border: `1px solid ${commentaireSemaine.couleur}2a`,
                borderRadius: 12
              }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#666", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 12 }}>
                  Note semaine {semaine}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 28 }}>{commentaireSemaine.emoji}</span>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: commentaireSemaine.couleur, marginBottom: 2 }}>
                      {moyenneSemaine}/10
                    </div>
                    <div style={{ fontSize: 14, color: "#888", lineHeight: 1.4 }}>
                      {commentaireSemaine.texte}
                    </div>
                  </div>
                </div>
                {/* Détail des jours */}
                <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {joursAffichage.filter(j => !j.estFutur && j.note !== null).map((j, i) => {
                    const c = getCommentaireNote(j.note);
                    return (
                      <div key={i} style={{
                        fontSize: 11, fontFamily: "'Space Mono', monospace",
                        padding: "4px 10px", borderRadius: 6,
                        background: c.couleur + "22",
                        border: `1px solid ${c.couleur}44`,
                        color: c.couleur
                      }}>
                        J{j.jour} · {j.note}/10
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Programme terminé */}
        {jourIndex >= PROGRAMME_JOURS.length && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#d4b87a", marginBottom: 12 }}>
              7 semaines accomplies.
            </h2>
            <p style={{ color: "#aaa", fontSize: 16, lineHeight: 1.8, fontStyle: "italic", maxWidth: 460, margin: "0 auto" }}>
              Ce n'est pas une fin — c'est un début. Continue avec les mêmes principes. Chaque jour compte.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
