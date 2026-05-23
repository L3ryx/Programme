import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { phases, regles, objectifsParSemaine, todoHebdo } from "../data";

// ─── helpers ────────────────────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `week_${now.getFullYear()}_${week}`;
}

function getDayOfWeek() {
  return new Date().getDay(); // 0=Sun, 6=Sat
}

function getDaysSinceMonday() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1; // 0=Monday, 6=Sunday
}

function getWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
}

// Calcule une note sur 100 selon les objectifs cochés
function computeScore(checked, total) {
  if (total === 0) return 0;
  return Math.round((checked / total) * 100);
}

function getScoreLabel(score) {
  if (score === 100) return { label: "Semaine parfaite", color: "#27AE60", emoji: "🏆" };
  if (score >= 85) return { label: "Excellente semaine", color: "#2ECC71", emoji: "⭐" };
  if (score >= 70) return { label: "Bonne semaine", color: "#F1C40F", emoji: "👍" };
  if (score >= 50) return { label: "Semaine correcte", color: "#E67E22", emoji: "📈" };
  if (score >= 30) return { label: "Semaine difficile", color: "#E74C3C", emoji: "💪" };
  return { label: "Semaine à refaire", color: "#C0392B", emoji: "🔄" };
}

function getScoreMessage(score, checkedIds, objectives) {
  const unchecked = objectives.filter((o) => !checkedIds.includes(o.id));
  const uncheckedTitles = unchecked.map((o) => `• ${o.titre}`).join("\n");

  if (score === 100) {
    return "Incroyable. Tu as coché chaque objectif cette semaine. C'est exactement comme ça que le changement se construit — un jour après l'autre, une semaine après l'autre. Continue.";
  }
  if (score >= 85) {
    return `Très belle semaine. Il reste quelques points à travailler :\n\n${uncheckedTitles}\n\nCe sont ces petits manques qui feront la différence la semaine prochaine.`;
  }
  if (score >= 70) {
    return `Bonne semaine dans l'ensemble. Voici ce qui n'a pas été fait :\n\n${uncheckedTitles}\n\nConcentre-toi sur ces points la semaine prochaine. Tu en es capable.`;
  }
  if (score >= 50) {
    return `Semaine mitigée. Plus de la moitié des objectifs n'ont pas été atteints :\n\n${uncheckedTitles}\n\nC'est normal d'avoir des hauts et des bas. Mais il faut y retourner la semaine prochaine avec plus de détermination.`;
  }
  return `Semaine difficile. La majorité des objectifs n'ont pas été remplis :\n\n${uncheckedTitles}\n\nPas de jugement — mais du sérieux. Ce programme ne fonctionne que si tu t'y tiens vraiment. La semaine prochaine, recommence depuis le début avec cette liste.`;
}

// ─── PhaseCard ──────────────────────────────────────────────────────────────

function PhaseCard({ phase }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.phaseWrapper}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={[
          styles.phaseHeader,
          expanded && {
            backgroundColor: hexToRgba(phase.couleur, 0.12),
            borderColor: hexToRgba(phase.couleur, 0.3),
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
        ]}
        activeOpacity={0.8}
      >
        <Text style={[styles.phaseNumero, { color: phase.couleur }]}>{phase.numero}</Text>
        <Text style={styles.phaseIcon}>{phase.icon}</Text>
        <View style={styles.phaseTitleBlock}>
          <Text style={styles.phaseTitre}>{phase.titre}</Text>
          <Text style={styles.phaseDuree}>{phase.duree}</Text>
        </View>
        <Text style={[styles.phaseArrow, expanded && styles.phaseArrowUp]}>↓</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.phaseContent, { borderColor: hexToRgba(phase.couleur, 0.2) }]}>
          <Text style={styles.phaseDescription}>{phase.description}</Text>
          <Text style={[styles.sectionLabel, { color: phase.couleur }]}>À FAIRE</Text>
          {phase.actions.map((action, j) => (
            <View key={j} style={[styles.actionCard, { borderLeftColor: phase.couleur }]}>
              <Text style={styles.actionTitre}>{action.titre}</Text>
              <Text style={styles.actionDetail}>{action.detail}</Text>
            </View>
          ))}
          <Text style={[styles.sectionLabel, { color: "#C0392B", marginTop: 20 }]}>
            ERREURS À NE PLUS COMMETTRE
          </Text>
          {phase.erreurs.map((erreur, j) => (
            <View key={j} style={styles.erreurRow}>
              <Text style={styles.erreurCross}>✕</Text>
              <Text style={styles.erreurText}>{erreur}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── ProgrammeTab ────────────────────────────────────────────────────────────

function ProgrammeTab() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.introBox}>
        <Text style={styles.introText}>
          Ce programme n'est pas une liste de cases à cocher. C'est un chemin. Les phases se
          superposent, certaines durent plus longtemps que prévu. L'important n'est pas la vitesse
          — c'est la direction.
        </Text>
      </View>
      {phases.map((phase) => (
        <PhaseCard key={phase.id} phase={phase} />
      ))}
      <View style={styles.finalBox}>
        <Text style={styles.finalEmoji}>🌱</Text>
        <Text style={styles.finalText}>
          Camille ne reviendra pas parce qu'Alex aura dit les bons mots. Elle reviendra — peut-être
          — parce qu'il sera devenu quelqu'un qui n'a plus besoin d'elle pour exister. C'est la
          seule chose qui puisse vraiment changer la donne.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── ReglesTab ───────────────────────────────────────────────────────────────

function ReglesTab() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.introBox}>
        <Text style={styles.introText}>
          Ces règles ne sont pas des contraintes imposées de l'extérieur. Ce sont les limites
          qu'Alex doit s'imposer à lui-même — parce qu'il comprend désormais ce qu'elles
          protègent.
        </Text>
      </View>
      {regles.map((regle, i) => {
        const isNon = regle.emoji === "🚫";
        return (
          <View
            key={i}
            style={[
              styles.regleCard,
              {
                backgroundColor: isNon ? "rgba(192,57,43,0.06)" : "rgba(39,174,96,0.06)",
                borderColor: isNon ? "rgba(192,57,43,0.2)" : "rgba(39,174,96,0.2)",
              },
            ]}
          >
            <Text style={styles.regleEmoji}>{regle.emoji}</Text>
            <Text style={[styles.regleTexte, { color: isNon ? "#c0a0a0" : "#a0c0a8" }]}>
              {regle.texte}
            </Text>
          </View>
        );
      })}
      <View style={styles.regleMasterBox}>
        <Text style={styles.regleMasterLabel}>LA RÈGLE AU-DESSUS DE TOUTES</Text>
        <Text style={styles.regleMasterQuote}>
          "Avant d'envoyer un message, se poser une seule question : est-ce que ce message nourrit
          la relation ou est-ce qu'il nourrit mon angoisse ?"
        </Text>
        <Text style={styles.regleMasterSub}>
          Si la réponse est "mon angoisse" — poser le téléphone. Toujours.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── ObjectifsTab ────────────────────────────────────────────────────────────

function ObjectifsTab() {
  const [checkedIds, setCheckedIds] = useState([]);
  const [weekKey, setWeekKey] = useState(getWeekKey());
  const [weekValidated, setWeekValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Choisir la liste d'objectifs selon le numéro de semaine (cycle de 4)
  const weekIndex = (getWeekNumber() - 1) % objectifsParSemaine.length;
  const currentObjectives = objectifsParSemaine[weekIndex];
  const daysSinceMonday = getDaysSinceMonday(); // 0=lundi, 6=dimanche
  const isDay7 = daysSinceMonday === 6; // dimanche = jour 7

  // Charger l'état depuis AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(`objectives_${weekKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setCheckedIds(parsed.checkedIds || []);
          setWeekValidated(parsed.validated || false);
          if (parsed.validated) {
            setScore(parsed.score || 0);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [weekKey]);

  // Sauvegarder
  const save = useCallback(
    async (ids, validated, sc) => {
      try {
        await AsyncStorage.setItem(
          `objectives_${weekKey}`,
          JSON.stringify({ checkedIds: ids, validated, score: sc })
        );
      } catch (e) {
        console.error(e);
      }
    },
    [weekKey]
  );

  const toggleCheck = (id) => {
    if (weekValidated) return; // semaine validée, plus modifiable
    const already = checkedIds.includes(id);
    if (already) return; // ne peut pas décocher
    const newIds = [...checkedIds, id];
    setCheckedIds(newIds);
    save(newIds, false, 0);
  };

  const validateWeek = () => {
    const sc = computeScore(checkedIds.length, currentObjectives.length);
    setScore(sc);
    setWeekValidated(true);
    save(checkedIds, true, sc);
    setShowModal(true);
  };

  const scoreInfo = getScoreLabel(score);

  if (loading) {
    return (
      <View style={[styles.scrollContent, { flex: 1, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: "#555" }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Semaine info */}
        <View style={styles.weekInfoBox}>
          <View style={styles.weekInfoLeft}>
            <Text style={styles.weekInfoLabel}>SEMAINE EN COURS</Text>
            <Text style={styles.weekInfoSub}>
              Jour {daysSinceMonday + 1} / 7 · {checkedIds.length}/{currentObjectives.length} objectifs
            </Text>
          </View>
          {weekValidated && (
            <View style={[styles.weekBadge, { backgroundColor: hexToRgba(scoreInfo.color, 0.15), borderColor: hexToRgba(scoreInfo.color, 0.4) }]}>
              <Text style={[styles.weekBadgeText, { color: scoreInfo.color }]}>
                {scoreInfo.emoji} {score}%
              </Text>
            </View>
          )}
        </View>

        {/* Barre de progression */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${computeScore(checkedIds.length, currentObjectives.length)}%`,
                backgroundColor: weekValidated ? scoreInfo.color : "#8B7355",
              },
            ]}
          />
        </View>

        {/* Objectifs */}
        <Text style={styles.sectionLabel2}>OBJECTIFS DE LA SEMAINE</Text>
        {currentObjectives.map((obj) => {
          const isChecked = checkedIds.includes(obj.id);
          return (
            <TouchableOpacity
              key={obj.id}
              onPress={() => toggleCheck(obj.id)}
              activeOpacity={weekValidated ? 1 : 0.75}
              style={[
                styles.objectifRow,
                isChecked && styles.objectifRowChecked,
                weekValidated && !isChecked && styles.objectifRowMissed,
              ]}
            >
              <View style={[styles.checkBox, isChecked && styles.checkBoxChecked]}>
                {isChecked && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={[styles.objectifText, isChecked && styles.objectifTextChecked]}>
                {obj.titre}
              </Text>
              {weekValidated && !isChecked && (
                <Text style={styles.missedMark}>✕</Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Bouton validation */}
        {!weekValidated && (
          <View style={styles.validateSection}>
            {isDay7 ? (
              <TouchableOpacity style={styles.validateBtn} onPress={validateWeek} activeOpacity={0.8}>
                <Text style={styles.validateBtnText}>✦ VALIDER MA SEMAINE</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.validateDisabledBtn}>
                <Text style={styles.validateDisabledText}>
                  Validation disponible le dimanche (jour 7)
                </Text>
              </View>
            )}
          </View>
        )}

        {weekValidated && (
          <TouchableOpacity style={styles.recapBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
            <Text style={styles.recapBtnText}>📊 Voir le bilan de semaine</Text>
          </TouchableOpacity>
        )}

        {/* Séparateur */}
        <View style={styles.divider} />

        {/* À FAIRE cette semaine */}
        <Text style={styles.sectionLabel2}>À FAIRE CETTE SEMAINE</Text>
        {todoHebdo.faire.map((item, i) => (
          <View key={i} style={styles.todoRow}>
            <Text style={styles.todoIcon}>✅</Text>
            <Text style={styles.todoText}>{item}</Text>
          </View>
        ))}

        {/* NE PAS FAIRE */}
        <Text style={[styles.sectionLabel2, { color: "#C0392B", marginTop: 24 }]}>
          À NE PAS FAIRE
        </Text>
        {todoHebdo.nepasiFaire.map((item, i) => (
          <View key={i} style={styles.todoRow}>
            <Text style={styles.todoIcon}>🚫</Text>
            <Text style={[styles.todoText, { color: "#c0a0a0" }]}>{item}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal bilan */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={[styles.modalScore, { color: scoreInfo.color }]}>
              {scoreInfo.emoji} {score}%
            </Text>
            <Text style={[styles.modalLabel, { color: scoreInfo.color }]}>{scoreInfo.label}</Text>
            <View style={styles.modalDivider} />
            <ScrollView style={{ maxHeight: 300 }}>
              <Text style={styles.modalMessage}>
                {getScoreMessage(score, checkedIds, currentObjectives)}
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowModal(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Index() {
  const [onglet, setOnglet] = useState("objectifs");

  const tabs = [
    { key: "objectifs", label: "OBJECTIFS" },
    { key: "programme", label: "LES 5 PHASES" },
    { key: "regles", label: "RÈGLES D'OR" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />

      <View style={styles.header}>
        <Text style={styles.headerSurtitle}>PROGRAMME DE RECONSTRUCTION PERSONNELLE</Text>
        <Text style={styles.headerTitle}>Pour Alex</Text>
        <Text style={styles.headerSub}>5 phases · 6 mois · Un seul objectif</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setOnglet(tab.key)}
            style={[styles.tab, onglet === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, onglet === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {onglet === "programme" && <ProgrammeTab />}
      {onglet === "regles" && <ReglesTab />}
      {onglet === "objectifs" && <ObjectifsTab />}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },

  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  headerSurtitle: {
    fontSize: 9,
    letterSpacing: 3,
    color: "#888",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  headerTitle: { fontSize: 32, fontWeight: "300", color: "#f0ebe0", marginBottom: 4 },
  headerSub: { fontSize: 13, color: "#888", fontStyle: "italic" },

  tabsScroll: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.01)",
    flexGrow: 0,
  },
  tabs: { flexDirection: "row" },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#e8e0d0" },
  tabText: { fontSize: 10, letterSpacing: 2, color: "#555", fontFamily: "monospace" },
  tabTextActive: { color: "#e8e0d0" },

  scrollContent: { padding: 16, paddingBottom: 40 },

  introBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  introText: { color: "#aaa", fontSize: 14, lineHeight: 22, fontStyle: "italic" },

  // Phase card
  phaseWrapper: { marginBottom: 12 },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  phaseNumero: { fontFamily: "monospace", fontSize: 10, letterSpacing: 2, minWidth: 22 },
  phaseIcon: { fontSize: 20 },
  phaseTitleBlock: { flex: 1 },
  phaseTitre: { color: "#e8e0d0", fontSize: 16, fontWeight: "600", marginBottom: 2 },
  phaseDuree: { color: "#555", fontSize: 11, fontFamily: "monospace", letterSpacing: 1 },
  phaseArrow: { color: "#555", fontSize: 16 },
  phaseArrowUp: { transform: [{ rotate: "180deg" }] },
  phaseContent: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 20,
  },
  phaseDescription: {
    color: "#aaa",
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 22,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  sectionLabel: { fontSize: 9, letterSpacing: 3, fontFamily: "monospace", marginBottom: 12 },
  actionCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderLeftWidth: 3,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  actionTitre: { color: "#e8e0d0", fontWeight: "600", fontSize: 14, marginBottom: 6 },
  actionDetail: { color: "#888", fontSize: 13, lineHeight: 20 },
  erreurRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  erreurCross: { color: "#C0392B", fontSize: 13, marginTop: 1 },
  erreurText: { color: "#777", fontSize: 13, lineHeight: 20, flex: 1 },

  finalBox: {
    marginTop: 24,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    alignItems: "center",
  },
  finalEmoji: { fontSize: 28, marginBottom: 14 },
  finalText: { color: "#aaa", fontSize: 14, lineHeight: 24, fontStyle: "italic", textAlign: "center" },

  // Règles
  regleCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  regleEmoji: { fontSize: 18, marginTop: 1 },
  regleTexte: { fontSize: 14, lineHeight: 22, flex: 1 },
  regleMasterBox: {
    marginTop: 32,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
  },
  regleMasterLabel: { fontSize: 9, letterSpacing: 3, color: "#555", fontFamily: "monospace", marginBottom: 14 },
  regleMasterQuote: { color: "#c8c0b0", fontSize: 15, lineHeight: 26, fontStyle: "italic" },
  regleMasterSub: { color: "#555", fontSize: 13, marginTop: 12, lineHeight: 20 },

  // Objectifs
  weekInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  weekInfoLeft: {},
  weekInfoLabel: { fontSize: 9, letterSpacing: 3, color: "#888", fontFamily: "monospace", marginBottom: 4 },
  weekInfoSub: { color: "#c8c0b0", fontSize: 13 },
  weekBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  weekBadgeText: { fontSize: 14, fontWeight: "700" },

  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 2,
    marginBottom: 24,
    overflow: "hidden",
  },
  progressBarFill: { height: 4, borderRadius: 2 },

  sectionLabel2: {
    fontSize: 9,
    letterSpacing: 3,
    color: "#8B7355",
    fontFamily: "monospace",
    marginBottom: 12,
  },

  objectifRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  objectifRowChecked: {
    backgroundColor: "rgba(39,174,96,0.07)",
    borderColor: "rgba(39,174,96,0.25)",
  },
  objectifRowMissed: {
    backgroundColor: "rgba(192,57,43,0.05)",
    borderColor: "rgba(192,57,43,0.15)",
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxChecked: {
    backgroundColor: "#27AE60",
    borderColor: "#27AE60",
  },
  checkMark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  objectifText: { color: "#aaa", fontSize: 14, lineHeight: 20, flex: 1 },
  objectifTextChecked: { color: "#c8c0b0", textDecorationLine: "line-through" },
  missedMark: { color: "#C0392B", fontSize: 16 },

  validateSection: { marginTop: 24, marginBottom: 12 },
  validateBtn: {
    backgroundColor: "rgba(139,115,85,0.15)",
    borderWidth: 1,
    borderColor: "rgba(139,115,85,0.4)",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  validateBtnText: { color: "#c8b896", fontSize: 12, letterSpacing: 3, fontFamily: "monospace" },
  validateDisabledBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  validateDisabledText: { color: "#444", fontSize: 12, fontFamily: "monospace" },

  recapBtn: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  recapBtnText: { color: "#888", fontSize: 13 },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 28,
  },

  todoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  todoIcon: { fontSize: 16, marginTop: 1 },
  todoText: { color: "#aaa", fontSize: 14, lineHeight: 22, flex: 1 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: "#111118",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 28,
    width: "100%",
  },
  modalScore: { fontSize: 48, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  modalLabel: { fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 20, letterSpacing: 1 },
  modalDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginBottom: 20 },
  modalMessage: { color: "#aaa", fontSize: 14, lineHeight: 24 },
  modalClose: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  modalCloseText: { color: "#888", fontSize: 13, letterSpacing: 1, fontFamily: "monospace" },
});
