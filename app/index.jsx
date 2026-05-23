import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { phases, regles, objectifsParSemaine, todoHebdo } from "../data";

const { width } = Dimensions.get("window");

// ─── Palette santé sombre ────────────────────────────────────────────────────
const C = {
  bg: "#0D1117",
  surface: "#161B22",
  surface2: "#1C2128",
  border: "#30363D",
  accent: "#3DD68C",       // vert santé
  accentSoft: "#1A3D2B",
  accentBlue: "#58A6FF",   // bleu info
  accentBlueSoft: "#1A2A3D",
  danger: "#F85149",
  dangerSoft: "#3D1A1A",
  warn: "#E3B341",
  warnSoft: "#3D2E1A",
  textPrimary: "#E6EDF3",
  textSecondary: "#8B949E",
  textMuted: "#484F58",
  white: "#FFFFFF",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function getWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
}

function getWeekKey() {
  const now = new Date();
  return `week_${now.getFullYear()}_${getWeekNumber()}`;
}

function getDaysSinceMonday() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function computeScore(checked, total) {
  if (total === 0) return 0;
  return Math.round((checked / total) * 100);
}

function getScoreInfo(score) {
  if (score === 100) return { label: "Semaine parfaite", color: C.accent, emoji: "🏆" };
  if (score >= 85) return { label: "Excellente semaine", color: C.accent, emoji: "⭐" };
  if (score >= 70) return { label: "Bonne semaine", color: C.accentBlue, emoji: "👍" };
  if (score >= 50) return { label: "Semaine correcte", color: C.warn, emoji: "📈" };
  if (score >= 30) return { label: "Semaine difficile", color: C.danger, emoji: "💪" };
  return { label: "Semaine à refaire", color: C.danger, emoji: "🔄" };
}

function getScoreMessage(score, checkedIds, objectives) {
  const unchecked = objectives.filter((o) => !checkedIds.includes(o.id));
  const uncheckedTitles = unchecked.map((o) => `• ${o.titre}`).join("\n");
  if (score === 100) return "Incroyable. Tu as coché chaque objectif cette semaine. C'est exactement comme ça que le changement se construit — un jour après l'autre. Continue.";
  if (score >= 85) return `Très belle semaine. Il reste quelques points :\n\n${uncheckedTitles}\n\nCe sont ces petits manques qui feront la différence la semaine prochaine.`;
  if (score >= 70) return `Bonne semaine dans l'ensemble. Ce qui n'a pas été fait :\n\n${uncheckedTitles}\n\nConcentre-toi sur ces points la semaine prochaine.`;
  if (score >= 50) return `Semaine mitigée. Plus de la moitié des objectifs n'ont pas été atteints :\n\n${uncheckedTitles}\n\nReviens avec plus de détermination la semaine prochaine.`;
  return `Semaine difficile. La majorité des objectifs n'ont pas été remplis :\n\n${uncheckedTitles}\n\nPas de jugement — mais du sérieux. Recommence depuis le début la semaine prochaine.`;
}

// ─── PhaseCard ───────────────────────────────────────────────────────────────

function PhaseCard({ phase }) {
  const [expanded, setExpanded] = useState(false);
  const colors = {
    "#C0392B": C.danger,
    "#E67E22": C.warn,
    "#F1C40F": C.warn,
    "#27AE60": C.accent,
    "#2980B9": C.accentBlue,
  };
  const col = colors[phase.couleur] || C.accent;

  return (
    <View style={s.card}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={s.phaseHeader} activeOpacity={0.8}>
        <View style={[s.phaseNumBadge, { backgroundColor: col + "22", borderColor: col + "55" }]}>
          <Text style={[s.phaseNum, { color: col }]}>{phase.numero}</Text>
        </View>
        <Text style={s.phaseIcon}>{phase.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.phaseTitre}>{phase.titre}</Text>
          <Text style={s.phaseDuree}>{phase.duree}</Text>
        </View>
        <View style={[s.expandIcon, expanded && { backgroundColor: col + "22" }]}>
          <Text style={[s.expandArrow, { color: col }]}>{expanded ? "−" : "+"}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[s.phaseBody, { borderTopColor: C.border }]}>
          <Text style={s.phaseDesc}>{phase.description}</Text>

          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: col }]} />
            <Text style={[s.sectionTitle, { color: col }]}>À FAIRE</Text>
          </View>
          {phase.actions.map((action, j) => (
            <View key={j} style={[s.actionCard, { borderLeftColor: col }]}>
              <Text style={s.actionTitre}>{action.titre}</Text>
              <Text style={s.actionDetail}>{action.detail}</Text>
            </View>
          ))}

          <View style={[s.sectionHeader, { marginTop: 20 }]}>
            <View style={[s.sectionDot, { backgroundColor: C.danger }]} />
            <Text style={[s.sectionTitle, { color: C.danger }]}>ERREURS À ÉVITER</Text>
          </View>
          {phase.erreurs.map((erreur, j) => (
            <View key={j} style={s.erreurRow}>
              <View style={s.erreurDot} />
              <Text style={s.erreurText}>{erreur}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── ProgrammeTab ─────────────────────────────────────────────────────────────

function ProgrammeTab() {
  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.infoBox}>
        <Text style={s.infoBoxIcon}>📋</Text>
        <Text style={s.infoBoxText}>
          Ce programme n'est pas une liste de cases à cocher. C'est un chemin. Les phases se superposent — l'important n'est pas la vitesse, c'est la direction.
        </Text>
      </View>
      {phases.map((phase) => <PhaseCard key={phase.id} phase={phase} />)}
      <View style={[s.infoBox, { marginTop: 8 }]}>
        <Text style={s.infoBoxIcon}>🌱</Text>
        <Text style={s.infoBoxText}>
          Camille ne reviendra pas parce qu'Alex aura dit les bons mots. Elle reviendra — peut-être — parce qu'il sera devenu quelqu'un qui n'a plus besoin d'elle pour exister.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── ReglesTab ────────────────────────────────────────────────────────────────

function ReglesTab() {
  const interdits = regles.filter((r) => r.emoji === "🚫");
  const positifs = regles.filter((r) => r.emoji === "✅");

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.infoBox}>
        <Text style={s.infoBoxIcon}>🛡️</Text>
        <Text style={s.infoBoxText}>
          Ces règles sont les limites qu'Alex s'impose à lui-même — parce qu'il comprend désormais ce qu'elles protègent.
        </Text>
      </View>

      <Text style={s.groupLabel}>INTERDITS ABSOLUS</Text>
      {interdits.map((r, i) => (
        <View key={i} style={[s.regleCard, { backgroundColor: C.dangerSoft, borderColor: C.danger + "40" }]}>
          <View style={[s.regleBadge, { backgroundColor: C.danger + "30" }]}>
            <Text style={s.regleBadgeText}>✕</Text>
          </View>
          <Text style={[s.regleTexte, { color: "#E89090" }]}>{r.texte}</Text>
        </View>
      ))}

      <Text style={[s.groupLabel, { marginTop: 24 }]}>ENGAGEMENTS POSITIFS</Text>
      {positifs.map((r, i) => (
        <View key={i} style={[s.regleCard, { backgroundColor: C.accentSoft, borderColor: C.accent + "40" }]}>
          <View style={[s.regleBadge, { backgroundColor: C.accent + "30" }]}>
            <Text style={[s.regleBadgeText, { color: C.accent }]}>✓</Text>
          </View>
          <Text style={[s.regleTexte, { color: "#90C8A0" }]}>{r.texte}</Text>
        </View>
      ))}

      <View style={[s.masterBox]}>
        <Text style={s.masterLabel}>⚡ LA RÈGLE SUPRÊME</Text>
        <Text style={s.masterQuote}>
          "Avant d'envoyer un message, se poser une seule question : est-ce que ce message nourrit la relation ou est-ce qu'il nourrit mon angoisse ?"
        </Text>
        <View style={[s.masterFooter]}>
          <Text style={s.masterSub}>Si c'est l'angoisse → poser le téléphone. Toujours.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── ObjectifsTab ─────────────────────────────────────────────────────────────

function ObjectifsTab() {
  const [checkedIds, setCheckedIds] = useState([]);
  const [weekValidated, setWeekValidated] = useState(false);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const weekKey = getWeekKey();
  const weekIndex = (getWeekNumber() - 1) % objectifsParSemaine.length;
  const objectives = objectifsParSemaine[weekIndex];
  const daysSinceMonday = getDaysSinceMonday();
  const isDay7 = daysSinceMonday === 6;
  const progressPct = computeScore(checkedIds.length, objectives.length);
  const scoreInfo = getScoreInfo(score);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(`objectives_${weekKey}`);
        if (stored) {
          const p = JSON.parse(stored);
          setCheckedIds(p.checkedIds || []);
          setWeekValidated(p.validated || false);
          if (p.validated) setScore(p.score || 0);
        }
      } catch (e) {}
      setLoading(false);
    })();
  }, [weekKey]);

  const save = useCallback(async (ids, validated, sc) => {
    try {
      await AsyncStorage.setItem(`objectives_${weekKey}`, JSON.stringify({ checkedIds: ids, validated, score: sc }));
    } catch (e) {}
  }, [weekKey]);

  const toggleCheck = (id) => {
    if (weekValidated || checkedIds.includes(id)) return;
    const newIds = [...checkedIds, id];
    setCheckedIds(newIds);
    save(newIds, false, 0);
  };

  const validateWeek = () => {
    const sc = computeScore(checkedIds.length, objectives.length);
    setScore(sc);
    setWeekValidated(true);
    save(checkedIds, true, sc);
    setShowModal(true);
  };

  if (loading) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={{ color: C.textMuted }}>Chargement…</Text></View>;

  return (
    <>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Carte semaine */}
        <View style={s.weekCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <View>
              <Text style={s.weekLabel}>SEMAINE EN COURS</Text>
              <Text style={s.weekDay}>Jour {daysSinceMonday + 1} sur 7</Text>
            </View>
            {weekValidated
              ? <View style={[s.scorePill, { backgroundColor: scoreInfo.color + "25", borderColor: scoreInfo.color + "60" }]}>
                  <Text style={[s.scorePillText, { color: scoreInfo.color }]}>{scoreInfo.emoji} {score}%</Text>
                </View>
              : <View style={[s.scorePill, { backgroundColor: C.accentBlue + "20", borderColor: C.accentBlue + "50" }]}>
                  <Text style={[s.scorePillText, { color: C.accentBlue }]}>{checkedIds.length}/{objectives.length}</Text>
                </View>
            }
          </View>

          {/* Barre */}
          <View style={s.progressBg}>
            <View style={[s.progressFill, {
              width: `${progressPct}%`,
              backgroundColor: weekValidated ? scoreInfo.color : C.accent,
            }]} />
          </View>
          <Text style={s.progressLabel}>{progressPct}% accompli</Text>
        </View>

        {/* Objectifs */}
        <Text style={s.groupLabel}>OBJECTIFS DE LA SEMAINE</Text>
        {objectives.map((obj) => {
          const checked = checkedIds.includes(obj.id);
          const missed = weekValidated && !checked;
          return (
            <TouchableOpacity
              key={obj.id}
              onPress={() => toggleCheck(obj.id)}
              activeOpacity={weekValidated ? 1 : 0.7}
              style={[
                s.objRow,
                checked && s.objRowChecked,
                missed && s.objRowMissed,
              ]}
            >
              <View style={[s.checkbox, checked && s.checkboxChecked, missed && s.checkboxMissed]}>
                {checked && <Text style={s.checkmark}>✓</Text>}
                {missed && <Text style={[s.checkmark, { color: C.danger }]}>✕</Text>}
              </View>
              <Text style={[s.objText, checked && s.objTextChecked, missed && s.objTextMissed]}>
                {obj.titre}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Bouton validation */}
        <View style={{ marginTop: 20, marginBottom: 8 }}>
          {weekValidated ? (
            <TouchableOpacity style={s.bilanBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
              <Text style={s.bilanBtnText}>📊  Voir le bilan de semaine</Text>
            </TouchableOpacity>
          ) : isDay7 ? (
            <TouchableOpacity style={s.validateBtn} onPress={validateWeek} activeOpacity={0.8}>
              <Text style={s.validateBtnText}>✦  VALIDER MA SEMAINE</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.validateWaiting}>
              <Text style={s.validateWaitingText}>🔒  Validation disponible le dimanche (jour 7)</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={s.divider} />

        {/* À faire */}
        <Text style={s.groupLabel}>À FAIRE CETTE SEMAINE</Text>
        {todoHebdo.faire.map((item, i) => (
          <View key={i} style={[s.todoRow, { borderLeftColor: C.accent }]}>
            <Text style={s.todoCheck}>✓</Text>
            <Text style={s.todoText}>{item}</Text>
          </View>
        ))}

        <Text style={[s.groupLabel, { marginTop: 24, color: C.danger }]}>À NE PAS FAIRE</Text>
        {todoHebdo.nepasiFaire.map((item, i) => (
          <View key={i} style={[s.todoRow, { borderLeftColor: C.danger }]}>
            <Text style={[s.todoCheck, { color: C.danger }]}>✕</Text>
            <Text style={[s.todoText, { color: "#C09090" }]}>{item}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal bilan */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.modalTop, { backgroundColor: scoreInfo.color + "18" }]}>
              <Text style={s.modalEmoji}>{scoreInfo.emoji}</Text>
              <Text style={[s.modalScore, { color: scoreInfo.color }]}>{score}%</Text>
              <Text style={[s.modalLabel, { color: scoreInfo.color }]}>{scoreInfo.label}</Text>
            </View>
            <ScrollView style={{ maxHeight: 280, padding: 20 }}>
              <Text style={s.modalMsg}>{getScoreMessage(score, checkedIds, objectives)}</Text>
            </ScrollView>
            <TouchableOpacity style={s.modalClose} onPress={() => setShowModal(false)} activeOpacity={0.8}>
              <Text style={s.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "objectifs", label: "Objectifs", icon: "🎯" },
  { key: "programme", label: "Programme", icon: "📋" },
  { key: "regles",    label: "Règles d'or", icon: "🛡️" },
];

export default function Index() {
  const [onglet, setOnglet] = useState("objectifs");

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerEyebrow}>RECONSTRUCTION PERSONNELLE</Text>
          <Text style={s.headerTitle}>Programme Alex</Text>
        </View>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>6 mois</Text>
        </View>
      </View>

      {/* Tab bar visible en bas */}
      <View style={s.tabBar}>
        {TABS.map((tab) => {
          const active = onglet === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setOnglet(tab.key)}
              style={[s.tabItem, active && s.tabItemActive]}
              activeOpacity={0.7}
            >
              <Text style={s.tabIcon}>{tab.icon}</Text>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
              {active && <View style={s.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contenu */}
      <View style={{ flex: 1 }}>
        {onglet === "objectifs" && <ObjectifsTab />}
        {onglet === "programme" && <ProgrammeTab />}
        {onglet === "regles" && <ReglesTab />}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerEyebrow: { fontSize: 9, letterSpacing: 2.5, color: C.textMuted, fontFamily: "monospace", marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: C.textPrimary },
  headerBadge: { backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent + "50", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  headerBadgeText: { color: C.accent, fontSize: 12, fontWeight: "600" },

  // Tab bar en haut, bien visible
  tabBar: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    position: "relative",
  },
  tabItemActive: {
    backgroundColor: C.surface2,
  },
  tabIcon: { fontSize: 18, marginBottom: 3 },
  tabLabel: { fontSize: 10, color: C.textMuted, fontWeight: "500", letterSpacing: 0.5 },
  tabLabelActive: { color: C.accent, fontWeight: "700" },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: C.accent,
    borderRadius: 1,
  },

  scroll: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  phaseNumBadge: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  phaseNum: { fontSize: 11, fontWeight: "700", fontFamily: "monospace" },
  phaseIcon: { fontSize: 22 },
  phaseTitre: { color: C.textPrimary, fontSize: 15, fontWeight: "600", marginBottom: 2 },
  phaseDuree: { color: C.textMuted, fontSize: 11, fontFamily: "monospace" },
  expandIcon: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  expandArrow: { fontSize: 18, fontWeight: "300", color: C.textSecondary },

  phaseBody: { borderTopWidth: 1, padding: 16 },
  phaseDesc: { color: C.textSecondary, fontSize: 13, fontStyle: "italic", lineHeight: 20, marginBottom: 18 },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 9, letterSpacing: 2.5, fontFamily: "monospace", fontWeight: "700" },

  actionCard: {
    backgroundColor: C.surface2,
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  actionTitre: { color: C.textPrimary, fontWeight: "600", fontSize: 13, marginBottom: 5 },
  actionDetail: { color: C.textSecondary, fontSize: 12, lineHeight: 18 },

  erreurRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 7 },
  erreurDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.danger, marginTop: 7 },
  erreurText: { color: C.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 },

  infoBox: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  infoBoxIcon: { fontSize: 20, marginTop: 1 },
  infoBoxText: { color: C.textSecondary, fontSize: 13, lineHeight: 20, flex: 1, fontStyle: "italic" },

  groupLabel: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: C.accent,
    fontFamily: "monospace",
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 4,
  },

  regleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 7,
  },
  regleBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  regleBadgeText: { color: C.danger, fontSize: 14, fontWeight: "700" },
  regleTexte: { fontSize: 13, lineHeight: 20, flex: 1 },

  masterBox: {
    marginTop: 24,
    backgroundColor: C.accentBlueSoft,
    borderWidth: 1,
    borderColor: C.accentBlue + "50",
    borderRadius: 14,
    overflow: "hidden",
  },
  masterLabel: { fontSize: 10, letterSpacing: 2, color: C.accentBlue, fontFamily: "monospace", fontWeight: "700", padding: 16, paddingBottom: 12 },
  masterQuote: { color: C.textPrimary, fontSize: 14, lineHeight: 24, fontStyle: "italic", paddingHorizontal: 16, paddingBottom: 16 },
  masterFooter: { backgroundColor: C.accentBlue + "15", padding: 14 },
  masterSub: { color: C.accentBlue, fontSize: 12, fontWeight: "600" },

  // Semaine
  weekCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  weekLabel: { fontSize: 9, letterSpacing: 2.5, color: C.textMuted, fontFamily: "monospace", marginBottom: 4 },
  weekDay: { fontSize: 18, fontWeight: "700", color: C.textPrimary },
  scorePill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  scorePillText: { fontSize: 14, fontWeight: "700" },

  progressBg: { height: 6, backgroundColor: C.surface2, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { color: C.textMuted, fontSize: 11, fontFamily: "monospace" },

  objRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 7,
    gap: 12,
  },
  objRowChecked: { backgroundColor: C.accentSoft, borderColor: C.accent + "50" },
  objRowMissed: { backgroundColor: C.dangerSoft, borderColor: C.danger + "40" },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface2,
  },
  checkboxChecked: { backgroundColor: C.accent, borderColor: C.accent },
  checkboxMissed: { backgroundColor: C.dangerSoft, borderColor: C.danger },
  checkmark: { color: C.bg, fontSize: 13, fontWeight: "800" },
  objText: { color: C.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 },
  objTextChecked: { color: C.accent, textDecorationLine: "line-through" },
  objTextMissed: { color: C.danger + "AA" },

  validateBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  validateBtnText: { color: C.bg, fontSize: 13, fontWeight: "800", letterSpacing: 2 },
  validateWaiting: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  validateWaitingText: { color: C.textMuted, fontSize: 12, fontFamily: "monospace" },
  bilanBtn: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.accentBlue + "50",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  bilanBtnText: { color: C.accentBlue, fontSize: 13, fontWeight: "600" },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 24 },

  todoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.surface,
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 12,
    marginBottom: 7,
  },
  todoCheck: { fontSize: 14, color: C.accent, fontWeight: "700", marginTop: 1 },
  todoText: { color: C.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 },

  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.88)", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 18, width: "100%", overflow: "hidden" },
  modalTop: { alignItems: "center", padding: 28, paddingBottom: 20 },
  modalEmoji: { fontSize: 42, marginBottom: 8 },
  modalScore: { fontSize: 52, fontWeight: "800", marginBottom: 4 },
  modalLabel: { fontSize: 15, fontWeight: "600", letterSpacing: 1 },
  modalMsg: { color: C.textSecondary, fontSize: 14, lineHeight: 24 },
  modalClose: {
    margin: 16,
    marginTop: 4,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  modalCloseText: { color: C.textSecondary, fontSize: 13, fontWeight: "600" },
});
