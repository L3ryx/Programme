import { useState } from "react";

const phases = [
  {
    id: 1,
    numero: "01",
    titre: "Se soigner vraiment",
    duree: "Mois 1–2",
    couleur: "#C0392B",
    icon: "🧠",
    description: "Rien n'est possible sans cette base. Tout le reste s'effondre sans elle.",
    actions: [
      {
        titre: "Arrêt total de la cocaïne",
        detail: "Pas de réduction progressive — arrêt. Avec accompagnement médical obligatoire. Un addictologue, pas juste la volonté seule. La C déforme la réalité, alimente la paranoïa et détruit ce qu'on construit chaque jour."
      },
      {
        titre: "Suivi psychiatrique régulier",
        detail: "Trouver un psychiatre fixe (pas seulement des urgences). Le trouble borderline et la bipolarité se traitent — mais seulement avec un suivi régulier et un traitement adapté, non perturbé par des substances."
      },
      {
        titre: "Respecter son traitement",
        detail: "Prendre ses médicaments chaque jour, même quand ça va mieux. Surtout quand ça va mieux. Tenir un carnet de suivi de son humeur pour aider le médecin."
      },
      {
        titre: "Réguler son sommeil",
        detail: "Se coucher et se lever à heures fixes. Pas de messages après minuit. Pas de café à 3h du matin. Le sommeil est la fondation de l'équilibre émotionnel."
      }
    ],
    erreurs: [
      "Envoyer des messages la nuit sous prétexte de ne pas dormir",
      "Croire que la C n'est 'qu'une fois de temps en temps'",
      "Stopper le traitement psychiatrique dès que ça va un peu mieux",
      "Gérer les crises seul sans appeler un professionnel"
    ]
  },
  {
    id: 2,
    numero: "02",
    titre: "Reconstruire une vie à soi",
    duree: "Mois 2–4",
    couleur: "#E67E22",
    icon: "🏗️",
    description: "Camille ne peut pas être le seul ancrage d'Alex. Il faut d'autres piliers.",
    actions: [
      {
        titre: "Reprendre le sport",
        detail: "Vélo, musculation — peu importe. 3 fois par semaine minimum. Le sport régule naturellement la dopamine et la sérotonine que la C a épuisées. C'est du concret, mesurable, et ça redonne de l'estime de soi."
      },
      {
        titre: "Développer la musique sérieusement",
        detail: "Pas juste partager des liens YouTube. Créer, produire, publier. La boutique Etsy est un bon début. Ces activités créatives donnent un sentiment de valeur qui ne dépend d'aucune relation."
      },
      {
        titre: "Reprendre le travail progressivement",
        detail: "Même quelques heures par semaine. Avoir un lieu à aller, des horaires, des collègues — ça structure et ça sort du cercle vicieux de la rumination."
      },
      {
        titre: "Investir dans ses amitiés",
        detail: "Répondre à Valentin. Appeler ses amis sans que ce soit une crise. Pas pour remplacer Camille — pour ne plus la surcharger."
      }
    ],
    erreurs: [
      "Rester enfermé des journées entières sans sortir",
      "Compter uniquement sur Camille pour remplir son temps vide",
      "Abandonner un projet dès la première difficulté",
      "Attendre d'aller mieux pour commencer — commencer aide à aller mieux"
    ]
  },
  {
    id: 3,
    numero: "03",
    titre: "Apprendre à faire confiance",
    duree: "Mois 3–5",
    couleur: "#F1C40F",
    icon: "🤝",
    description: "La jalousie ne protège pas. Elle détruit exactement ce qu'on veut garder.",
    actions: [
      {
        titre: "Supprimer la surveillance",
        detail: "Ne plus regarder la localisation. Ne plus demander qui elle a en ligne. Ne plus analyser ses archives Instagram, son forfait téléphonique, ses photos. Chaque vérification nourrit l'angoisse au lieu de la calmer."
      },
      {
        titre: "Apprendre à tolérer l'incertitude",
        detail: "Quand l'angoisse monte parce qu'elle ne répond pas, noter ce qu'on ressent dans un carnet plutôt que d'envoyer un message accusateur. Respirer. Attendre. Elle a le droit d'avoir une vie."
      },
      {
        titre: "Travailler la peur de l'abandon en thérapie",
        detail: "Cette peur vient de loin — pas de Camille. Un thérapeute spécialisé en TCC ou en thérapie des schémas peut aider à comprendre d'où elle vient et comment la désamorcer."
      },
      {
        titre: "Faire confiance aux actes, pas aux preuves",
        detail: "Camille a montré par ses actes pendant des mois qu'elle était digne de confiance. Apprendre à s'appuyer sur ce bilan réel plutôt que sur les peurs imaginaires du moment."
      }
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
    id: 4,
    numero: "04",
    titre: "Communiquer sans blesser",
    duree: "Mois 4–6",
    couleur: "#27AE60",
    icon: "💬",
    description: "Les mots laissent des traces. Changer sa façon de parler change la relation.",
    actions: [
      {
        titre: "Parler en 'je' plutôt qu'en 'tu'",
        detail: "Au lieu de 'tu caches quelque chose', dire 'je me sens insécure là et j'ai besoin d'être rassuré'. Ce n'est pas une faiblesse — c'est la seule façon de créer un vrai échange."
      },
      {
        titre: "Ne jamais envoyer un message en colère",
        detail: "Poser le téléphone. Attendre 20 minutes. Si le message semble toujours nécessaire après — l'écrire différemment, calmement. La plupart du temps, l'envie passe."
      },
      {
        titre: "Écouter sans interrompre, sans se défendre",
        detail: "Quand Camille exprime quelque chose qui fait mal, résister à l'impulsion de se justifier immédiatement. Dire 'je t'entends' avant de répondre. Elle a besoin d'être entendue, pas débattue."
      },
      {
        titre: "Reconnaître ses torts sans sur-s'excuser",
        detail: "Un vrai 'j'ai eu tort de dire ça, ça ne se reproduira pas' vaut mille fois mieux qu'un 'pardon pardon pardon' suivi du même comportement le lendemain."
      }
    ],
    erreurs: [
      "Dire 'j't'emmerde' ou tout autre mot brutal même en crise",
      "Faire des menaces déguisées ('on verra si tu répondras la prochaine fois')",
      "Supprimer des messages — ça crée de l'instabilité",
      "Interrompre une conversation difficile par un emoji ou un changement de sujet",
      "Rejouer les anciens conflits pour avoir raison"
    ]
  },
  {
    id: 5,
    numero: "05",
    titre: "Devenir un partenaire équilibré",
    duree: "Mois 6+",
    couleur: "#2980B9",
    icon: "⚖️",
    description: "L'objectif final : une relation où les deux grandissent, pas où l'un porte l'autre.",
    actions: [
      {
        titre: "Rembourser ce qui est dû",
        detail: "L'argent emprunté à Camille doit être remboursé, intégralement. Pas demain — maintenant, dès que possible. C'est une question de respect et de dignité pour les deux."
      },
      {
        titre: "Ne plus jamais demander d'argent à une partenaire",
        detail: "La dépendance financière crée un déséquilibre de pouvoir qui empoisonne la relation. Alex doit être capable de subvenir à ses besoins de base avant de se remettre en couple."
      },
      {
        titre: "Apprendre à donner sans attendre en retour",
        detail: "Dans cette relation, Alex a beaucoup pris et Camille a beaucoup donné. Inverser progressivement ce rapport — s'intéresser à elle, l'écouter, lui demander comment elle va sans enchaîner sur ses propres angoisses."
      },
      {
        titre: "Proposer des projets concrets",
        detail: "Pas seulement 'j'ai hâte de te voir' — mais 'j'ai réservé un truc pour nous ce weekend-là, tu peux venir ?'. L'amour se construit dans des actes planifiés, pas seulement dans des émotions partagées."
      }
    ],
    erreurs: [
      "Se remettre en couple avant d'avoir fait les étapes précédentes",
      "Croire que l'amour suffit sans le travail concret",
      "Retomber dans les anciens schémas dès la première dispute",
      "Attendre que Camille revienne d'elle-même sans avoir changé",
      "Utiliser la guérison comme argument de séduction plutôt que comme vrai objectif"
    ]
  }
];

const regles = [
  { emoji: "🚫", texte: "Jamais de message accusateur sans preuve concrète" },
  { emoji: "🚫", texte: "Jamais de surveillance (localisation, réseaux, téléphone)" },
  { emoji: "🚫", texte: "Jamais de messages après minuit sauf urgence réelle" },
  { emoji: "🚫", texte: "Jamais de demande d'argent à Camille" },
  { emoji: "🚫", texte: "Jamais de mot brutal même en crise ('j't'emmerde', 'tu es chelou')" },
  { emoji: "🚫", texte: "Jamais de menaces déguisées en inquiétude" },
  { emoji: "🚫", texte: "Jamais de cocaïne en contact avec Camille" },
  { emoji: "✅", texte: "Toujours dire ce qu'on ressent en 'je', pas en 'tu'" },
  { emoji: "✅", texte: "Toujours attendre avant d'envoyer un message de colère" },
  { emoji: "✅", texte: "Toujours s'excuser avec des actes, pas seulement des mots" },
  { emoji: "✅", texte: "Toujours avoir un rendez-vous médical à venir" },
  { emoji: "✅", texte: "Toujours garder une activité qui n'implique pas Camille" }
];

export default function ProgrammeAlex() {
  const [phaseActive, setPhaseActive] = useState(null);
  const [onglet, setOnglet] = useState("programme");

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)",
      fontFamily: "'Georgia', serif",
      color: "#e8e0d0",
      padding: "0"
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "40px 32px 32px",
        background: "rgba(255,255,255,0.02)"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{
            fontSize: 11,
            letterSpacing: 4,
            color: "#888",
            textTransform: "uppercase",
            marginBottom: 12,
            fontFamily: "'Courier New', monospace"
          }}>
            Programme de reconstruction personnelle
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 400,
            margin: "0 0 8px",
            lineHeight: 1.1,
            color: "#f0ebe0"
          }}>
            Pour Alex
          </h1>
          <p style={{
            color: "#888",
            fontSize: 15,
            margin: 0,
            fontStyle: "italic",
            fontFamily: "'Georgia', serif"
          }}>
            5 phases · 6 mois · Un seul objectif : devenir la personne qu'il mérite d'être
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px",
        background: "rgba(255,255,255,0.01)"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 0 }}>
          {["programme", "regles"].map(tab => (
            <button
              key={tab}
              onClick={() => setOnglet(tab)}
              style={{
                background: "none",
                border: "none",
                borderBottom: onglet === tab ? "2px solid #e8e0d0" : "2px solid transparent",
                color: onglet === tab ? "#e8e0d0" : "#666",
                padding: "16px 24px",
                cursor: "pointer",
                fontSize: 13,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'Courier New', monospace",
                transition: "all 0.2s"
              }}
            >
              {tab === "programme" ? "Les 5 phases" : "Les règles d'or"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 32px 64px" }}>

        {onglet === "programme" && (
          <div>
            {/* Timeline intro */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "24px 28px",
              marginBottom: 32,
              fontStyle: "italic",
              color: "#aaa",
              fontSize: 15,
              lineHeight: 1.7
            }}>
              Ce programme n'est pas une liste de cases à cocher. C'est un chemin. Les phases se superposent, certaines durent plus longtemps que prévu. L'important n'est pas la vitesse — c'est la direction.
            </div>

            {phases.map((phase, i) => (
              <div
                key={phase.id}
                style={{ marginBottom: 16 }}
              >
                {/* Phase header */}
                <button
                  onClick={() => setPhaseActive(phaseActive === phase.id ? null : phase.id)}
                  style={{
                    width: "100%",
                    background: phaseActive === phase.id
                      ? `rgba(${phase.couleur === '#C0392B' ? '192,57,43' : phase.couleur === '#E67E22' ? '230,126,34' : phase.couleur === '#F1C40F' ? '241,196,15' : phase.couleur === '#27AE60' ? '39,174,96' : '41,128,185'},0.12)`
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${phaseActive === phase.id ? phase.couleur + '44' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: phaseActive === phase.id ? "12px 12px 0 0" : 12,
                    padding: "20px 24px",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#e8e0d0",
                    transition: "all 0.25s",
                    display: "flex",
                    alignItems: "center",
                    gap: 16
                  }}
                >
                  <span style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 11,
                    color: phase.couleur,
                    letterSpacing: 2,
                    minWidth: 24
                  }}>
                    {phase.numero}
                  </span>
                  <span style={{ fontSize: 22 }}>{phase.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 2 }}>
                      {phase.titre}
                    </div>
                    <div style={{ fontSize: 12, color: "#666", fontFamily: "'Courier New', monospace", letterSpacing: 1 }}>
                      {phase.duree}
                    </div>
                  </div>
                  <span style={{
                    color: "#555",
                    fontSize: 18,
                    transform: phaseActive === phase.id ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s"
                  }}>
                    ↓
                  </span>
                </button>

                {/* Phase content */}
                {phaseActive === phase.id && (
                  <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${phase.couleur}33`,
                    borderTop: "none",
                    borderRadius: "0 0 12px 12px",
                    padding: "24px"
                  }}>
                    <p style={{
                      color: "#aaa",
                      fontStyle: "italic",
                      fontSize: 15,
                      marginTop: 0,
                      marginBottom: 24,
                      paddingBottom: 20,
                      borderBottom: "1px solid rgba(255,255,255,0.06)"
                    }}>
                      {phase.description}
                    </p>

                    {/* Actions */}
                    <div style={{ marginBottom: 28 }}>
                      <div style={{
                        fontSize: 10,
                        letterSpacing: 3,
                        color: phase.couleur,
                        textTransform: "uppercase",
                        fontFamily: "'Courier New', monospace",
                        marginBottom: 16
                      }}>
                        À faire
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {phase.actions.map((action, j) => (
                          <div key={j} style={{
                            background: "rgba(255,255,255,0.03)",
                            borderLeft: `3px solid ${phase.couleur}`,
                            borderRadius: "0 8px 8px 0",
                            padding: "14px 16px"
                          }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: "#e8e0d0" }}>
                              {action.titre}
                            </div>
                            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.6 }}>
                              {action.detail}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Erreurs */}
                    <div>
                      <div style={{
                        fontSize: 10,
                        letterSpacing: 3,
                        color: "#C0392B",
                        textTransform: "uppercase",
                        fontFamily: "'Courier New', monospace",
                        marginBottom: 16
                      }}>
                        Erreurs à ne plus commettre
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {phase.erreurs.map((erreur, j) => (
                          <div key={j} style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            fontSize: 13,
                            color: "#888",
                            lineHeight: 1.5
                          }}>
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

            {/* Message final */}
            <div style={{
              marginTop: 40,
              padding: "28px 32px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>🌱</div>
              <p style={{
                color: "#aaa",
                fontSize: 15,
                lineHeight: 1.8,
                fontStyle: "italic",
                maxWidth: 520,
                margin: "0 auto"
              }}>
                Camille ne reviendra pas parce qu'Alex aura dit les bons mots. Elle reviendra — peut-être — parce qu'il sera devenu quelqu'un qui n'a plus besoin d'elle pour exister. C'est la seule chose qui puisse vraiment changer la donne.
              </p>
            </div>
          </div>
        )}

        {onglet === "regles" && (
          <div>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "24px 28px",
              marginBottom: 32,
              fontStyle: "italic",
              color: "#aaa",
              fontSize: 15,
              lineHeight: 1.7
            }}>
              Ces règles ne sont pas des contraintes imposées de l'extérieur. Ce sont les limites qu'Alex doit s'imposer à lui-même — parce qu'il comprend désormais ce qu'elles protègent.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {regles.map((regle, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: "16px 20px",
                  background: regle.emoji === "🚫"
                    ? "rgba(192,57,43,0.06)"
                    : "rgba(39,174,96,0.06)",
                  border: `1px solid ${regle.emoji === "🚫" ? "rgba(192,57,43,0.15)" : "rgba(39,174,96,0.15)"}`,
                  borderRadius: 10
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{regle.emoji}</span>
                  <span style={{
                    fontSize: 14,
                    color: regle.emoji === "🚫" ? "#c0a0a0" : "#a0c0a8",
                    lineHeight: 1.5
                  }}>
                    {regle.texte}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 40,
              padding: "28px 32px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12
            }}>
              <div style={{
                fontSize: 10,
                letterSpacing: 3,
                color: "#666",
                textTransform: "uppercase",
                fontFamily: "'Courier New', monospace",
                marginBottom: 16
              }}>
                La règle au-dessus de toutes les règles
              </div>
              <p style={{
                color: "#c8c0b0",
                fontSize: 16,
                lineHeight: 1.8,
                fontStyle: "italic",
                margin: 0
              }}>
                "Avant d'envoyer un message, se poser une seule question : est-ce que ce message nourrit la relation ou est-ce qu'il nourrit mon angoisse ?"
              </p>
              <p style={{
                color: "#666",
                fontSize: 13,
                marginTop: 12,
                marginBottom: 0,
                lineHeight: 1.6
              }}>
                Si la réponse est "mon angoisse" — poser le téléphone. Toujours.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
