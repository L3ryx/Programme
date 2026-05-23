import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Dimensions,
  Animated,
  Clipboard,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { phases, regles, objectifsParSemaine, todoHebdo } from "../data";
import {
  categoriesContenu,
  poolSurnoms,
  poolCompliments,
  poolBlagues,
  poolSujets,
  poolMessages,
  getMultipleForDate,
} from "../camilleData";
import { generateForCamille, generateAll } from "../geminiService";

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

// ─── CamilleTab ──────────────────────────────────────────────────────────

// Pool de secours (mode classique)
const POOLS = {
  surnom:     poolSurnoms,
  compliment: poolCompliments,
  blague:     poolBlagues,
  sujet:      poolSujets,
};

function getRandomFrom(pool, excludeIndexes = []) {
  let excluded = excludeIndexes;
  if (excluded.length >= pool.length) excluded = [excludeIndexes[excludeIndexes.length - 1]];
  const candidates = pool.map((_, i) => i).filter((i) => !excluded.includes(i));
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { item: pool[pick], index: pick };
}

// ─── Modal Paramètres (clé API) ───────────────────────────────────────────────

function SettingsModal({ visible, onClose, apiKey, onSave }) {
  const [input, setInput] = useState(apiKey || "");

  useEffect(() => { setInput(apiKey || ""); }, [apiKey, visible]);

  const handleSave = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      Alert.alert("Clé manquante", "Entre ta clé API Gemini pour utiliser l'IA.");
      return;
    }
    onSave(trimmed);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={settS.overlay}>
          <View style={settS.sheet}>
            <View style={settS.handle} />
            <Text style={settS.title}>⚙️  Paramètres Gemini</Text>
            <Text style={settS.subtitle}>
              Entre ta clé API Google Gemini pour activer la génération IA.{"
"}
              Obtiens-la sur <Text style={settS.link}>aistudio.google.com</Text>
            </Text>

            <Text style={settS.label}>CLÉ API GEMINI</Text>
            <TextInput
              style={settS.input}
              value={input}
              onChangeText={setInput}
              placeholder="AIza..."
              placeholderTextColor="#484F58"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={false}
            />

            {apiKey ? (
              <View style={settS.statusRow}>
                <View style={settS.dot} />
                <Text style={settS.statusText}>Clé configurée</Text>
              </View>
            ) : (
              <View style={[settS.statusRow, { gap: 6 }]}>
                <View style={[settS.dot, { backgroundColor: "#E3B341" }]} />
                <Text style={[settS.statusText, { color: "#E3B341" }]}>Aucune clé — mode classique actif</Text>
              </View>
            )}

            <TouchableOpacity style={settS.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={settS.saveBtnText}>ENREGISTRER</Text>
            </TouchableOpacity>

            <TouchableOpacity style={settS.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={settS.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Composant principal CamilleTab ───────────────────────────────────────────

function CamilleTab() {
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [currentType, setCurrentType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const lastShownRef = useRef({});

  // Charger la clé API au démarrage
  useEffect(() => {
    AsyncStorage.getItem("gemini_api_key").then((k) => {
      if (k) setApiKey(k);
    });
  }, []);

  const saveApiKey = async (key) => {
    setApiKey(key);
    await AsyncStorage.setItem("gemini_api_key", key);
  };

  // ─── Génération Gemini ───────────────────────────────────────────────────────

  const handleGenerateGemini = async () => {
    setLoading(true);
    setCopied(null);
    setGenerated(null);

    try {
      const types = ["surnom", "compliment", "blague", "sujet", "message"];
      const results = {};

      for (const type of types) {
        setCurrentType(type);
        const text = await generateForCamille(type, apiKey);
        results[type] = text;
      }

      setCurrentType(null);
      setGenerated(results);

    } catch (e) {
      setCurrentType(null);
      const isKeyError = e.message?.includes("API_KEY") || e.message?.includes("401") || e.message?.includes("403");
      Alert.alert(
        "Erreur Gemini",
        isKeyError
          ? "Clé API invalide ou expirée. Vérifie tes paramètres."
          : (e.message || "Erreur inconnue"),
        [
          isKeyError
            ? { text: "Paramètres", onPress: () => setShowSettings(true) }
            : { text: "OK" }
        ]
      );
    }

    setLoading(false);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  // ─── Génération fallback (pool statique) ────────────────────────────────────

  const handleGenerateFallback = async () => {
    setLoading(true);
    setCopied(null);

    let history = {};
    try {
      const stored = await AsyncStorage.getItem("camille_history");
      if (stored) history = JSON.parse(stored);
    } catch {}

    const result = {};
    const cats = categoriesContenu.filter((c) => c.id !== "message");

    for (const cat of cats) {
      const pool = POOLS[cat.id];
      const currentlyShown = lastShownRef.current[cat.id];
      const persisted = history[cat.id] || [];
      const excluded = currentlyShown !== undefined
        ? [...new Set([...persisted, currentlyShown])] : persisted;
      const { item, index } = getRandomFrom(pool, excluded);
      result[cat.id] = item;
      history[cat.id] = [...persisted, index].slice(-5);
    }

    const msgPersisted = history["message"] || [];
    const currentMsg = lastShownRef.current["message"];
    const msgExcluded = currentMsg !== undefined
      ? [...new Set([...msgPersisted, currentMsg])] : msgPersisted;
    const { item: msgItem, index: msgIdx } = getRandomFrom(poolMessages, msgExcluded);
    result["message"] = msgItem.texte;
    history["message"] = [...msgPersisted, msgIdx].slice(-5);

    lastShownRef.current = { surnom: result.surnom, compliment: result.compliment, blague: result.blague, sujet: result.sujet, message: msgIdx };

    try { await AsyncStorage.setItem("camille_history", JSON.stringify(history)); } catch {}

    setGenerated(result);
    setLoading(false);

    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  const handleGenerate = () => apiKey ? handleGenerateGemini() : handleGenerateFallback();

  const handleCopy = (text, id) => {
    Clipboard.setString(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const TYPE_LABELS = {
    surnom:     "Génération du surnom…",
    compliment: "Génération du compliment…",
    blague:     "Génération de la taquinerie…",
    sujet:      "Génération du sujet…",
    message:    "Génération du message…",
  };

  return (
    <>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={camS.heroCard}>
          <Text style={camS.heroEmoji}>💕</Text>
          <View style={{ flex: 1 }}>
            <Text style={camS.heroTitle}>Onglet Camille</Text>
            <Text style={camS.heroSub}>
              {apiKey ? "Gemini AI · génération unique à chaque fois" : "Mode classique · pool de suggestions"}
            </Text>
          </View>
          {/* Bouton paramètres */}
          <TouchableOpacity style={settS.gearBtn} onPress={() => setShowSettings(true)} activeOpacity={0.7}>
            <Text style={settS.gearIcon}>⚙️</Text>
            {!apiKey && <View style={settS.gearDot} />}
          </TouchableOpacity>
        </View>

        {/* Bannière si pas de clé */}
        {!apiKey && (
          <TouchableOpacity style={camS.noBanner} onPress={() => setShowSettings(true)} activeOpacity={0.8}>
            <Text style={camS.noBannerText}>🔑  Configure ta clé Gemini pour activer l'IA</Text>
            <Text style={camS.noBannerSub}>Appuie ici ou sur ⚙️ en haut à droite</Text>
          </TouchableOpacity>
        )}

        {/* Status génération en cours */}
        {loading && currentType && (
          <View style={camS.statusBox}>
            <Text style={camS.statusText}>{TYPE_LABELS[currentType] || "Génération…"}</Text>
            <Text style={camS.statusHint}>Gemini AI · génération en cours…</Text>
          </View>
        )}

        {/* Bouton GÉNÉRER */}
        <TouchableOpacity
          style={[camS.generateBtn, loading && camS.generateBtnDisabled]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={camS.generateBtnEmoji}>{loading ? "⏳" : (apiKey ? "✨" : "📋")}</Text>
          <Text style={camS.generateBtnText}>
            {loading ? "GÉNÉRATION EN COURS…" : "GÉNÉRER"}
          </Text>
        </TouchableOpacity>

        {/* Résultats */}
        {generated && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>

            {[
              { id: "surnom",     cat: categoriesContenu[0] },
              { id: "compliment", cat: categoriesContenu[1] },
              { id: "blague",     cat: categoriesContenu[2] },
              { id: "sujet",      cat: categoriesContenu[3] },
            ].map(({ id, cat }) => {
              const text = generated?.[id] || "";
              return text ? (
                <ResultCard
                  key={id}
                  cat={cat}
                  content={text}
                  isStreaming={false}
                  onCopy={() => handleCopy(text, id)}
                  copied={copied === id}
                />
              ) : null;
            })}

            {generated?.message && (() => {
              const cat = categoriesContenu[4];
              const text = generated.message;
              return (
                <View style={[camS.resultCard, { borderColor: cat.couleur + "60" }]}>
                  <View style={camS.resultHeader}>
                    <View style={[camS.resultBadge, { backgroundColor: cat.couleur + "20" }]}>
                      <Text style={camS.resultBadgeEmoji}>{cat.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[camS.resultLabel, { color: cat.couleur }]}>{cat.label}</Text>
                    </View>
                    <TouchableOpacity
                      style={[camS.copyBtn, copied === "message" && { backgroundColor: "#1A3D2B" }]}
                      onPress={() => handleCopy(text, "message")}
                      activeOpacity={0.7}
                    >
                      <Text style={camS.copyBtnText}>{copied === "message" ? "✓ Copié" : "📋 Copier"}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={camS.resultDivider} />
                  <Text style={camS.resultText}>{text}</Text>
                </View>
              );
            })()}

            <View style={camS.tipBox}>
              <Text style={camS.tipIcon}>{apiKey ? "✨" : "💡"}</Text>
              <Text style={camS.tipText}>
                {apiKey
                  ? "Généré par Gemini AI. Adapte si besoin — l'IA propose, tu choisis."
                  : "Suggestions tirées de l'analyse de vos échanges. Configure Gemini pour des suggestions 100% uniques."}
              </Text>
            </View>
          </Animated.View>
        )}

        {!generated && !loading && (
          <View style={camS.emptyState}>
            <Text style={camS.emptyEmoji}>💌</Text>
            <Text style={camS.emptyTitle}>Prêt à lui faire plaisir ?</Text>
            <Text style={camS.emptyText}>
              {apiKey
                ? "Gemini va générer un contenu 100% original à chaque appui — surnom, compliment, taquinerie, sujet et message complet."
                : "Appuie sur Générer pour des suggestions tirées de vos échanges, ou configure Gemini pour de l'IA."}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        apiKey={apiKey}
        onSave={saveApiKey}
      />
    </>
  );
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

function ResultCard({ cat, content, isStreaming, onCopy, copied }) {
  return (
    <View style={[camS.resultCard, { borderColor: cat.couleur + "55" }]}>
      <View style={camS.resultHeader}>
        <View style={[camS.resultBadge, { backgroundColor: cat.couleur + "20" }]}>
          <Text style={camS.resultBadgeEmoji}>{cat.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[camS.resultLabel, { color: cat.couleur }]}>{cat.label}</Text>
        </View>
        {!!content && (
          <TouchableOpacity
            style={[camS.copyBtn, copied && { backgroundColor: "#1A3D2B" }]}
            onPress={onCopy}
            activeOpacity={0.7}
          >
            <Text style={camS.copyBtnText}>{copied ? "✓ Copié" : "📋 Copier"}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={camS.resultDivider} />
      <Text style={camS.resultText}>{content}</Text>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "objectifs", label: "Objectifs", icon: "🎯" },
  { key: "programme", label: "Programme", icon: "📋" },
  { key: "regles",    label: "Règles d'or", icon: "🛡️" },
  { key: "camille",   label: "Camille", icon: "💕" },
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
        {onglet === "camille" && <CamilleTab />}
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
// ─── Styles Camille ───────────────────────────────────────────────────────────

const camS = StyleSheet.create({
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1C1228",
    borderWidth: 1,
    borderColor: "#FF6B9D40",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  heroEmoji: { fontSize: 36 },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6B9D",
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    color: "#8B6070",
    lineHeight: 18,
  },

  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FF6B9D",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 20,
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  generateBtnDisabled: {
    backgroundColor: "#5A3040",
    shadowOpacity: 0,
    elevation: 0,
  },
  generateBtnEmoji: { fontSize: 20 },
  generateBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2.5,
  },

  resultCard: {
    backgroundColor: "#161B22",
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    paddingBottom: 12,
  },
  resultBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resultBadgeEmoji: { fontSize: 18 },
  resultLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: "monospace",
  },
  tagPill: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  copyBtn: {
    backgroundColor: "#1C2128",
    borderWidth: 1,
    borderColor: "#30363D",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyBtnText: {
    fontSize: 11,
    color: "#8B949E",
    fontWeight: "600",
  },
  resultDivider: {
    height: 1,
    backgroundColor: "#30363D",
    marginHorizontal: 14,
  },
  resultText: {
    color: "#E6EDF3",
    fontSize: 14,
    lineHeight: 22,
    padding: 14,
    paddingTop: 12,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6B9D",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#8B6070",
    lineHeight: 20,
    textAlign: "center",
  },

  tipBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#1C1A10",
    borderWidth: 1,
    borderColor: "#E3B34130",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    alignItems: "flex-start",
  },
  tipIcon: { fontSize: 16 },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: "#B8A070",
    lineHeight: 18,
    fontStyle: "italic",
  },

  // Specs modèle
  specBox: {
    width: "100%",
    backgroundColor: "#161B22",
    borderWidth: 1,
    borderColor: "#30363D",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#30363D",
    gap: 10,
  },
  specIcon: { fontSize: 16, width: 24, textAlign: "center" },
  specLabel: { color: "#8B949E", fontSize: 12, width: 120 },
  specVal: { color: "#E6EDF3", fontSize: 12, fontWeight: "600", flex: 1 },

  // Mode toggle
  modeToggle: {
    backgroundColor: "#1C2128",
    borderWidth: 1,
    borderColor: "#30363D",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modeToggleAI: {
    borderColor: "#FF6B9D50",
    backgroundColor: "#2A1020",
  },
  modeToggleText: {
    fontSize: 11,
    color: "#8B949E",
    fontWeight: "600",
  },

  // Status génération
  statusBox: {
    backgroundColor: "#1C1228",
    borderWidth: 1,
    borderColor: "#FF6B9D30",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: "center",
  },
  statusText: {
    color: "#FF6B9D",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusHint: {
    color: "#5A3040",
    fontSize: 10,
    fontFamily: "monospace",
  },

  // Bannière pas de clé
  noBanner: {
    backgroundColor: "#1C1A10",
    borderWidth: 1,
    borderColor: "#E3B34150",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    alignItems: "center",
  },
  noBannerText: {
    color: "#E3B341",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 3,
  },
  noBannerSub: {
    color: "#8B7040",
    fontSize: 11,
  },
});

// ─── Styles Paramètres ────────────────────────────────────────────────────────

const settS = StyleSheet.create({
  gearBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1C2128",
    borderWidth: 1,
    borderColor: "#30363D",
    alignItems: "center",
    justifyContent: "center",
  },
  gearIcon: { fontSize: 18 },
  gearDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E3B341",
    borderWidth: 1,
    borderColor: "#0D1117",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#161B22",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#30363D",
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#30363D",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E6EDF3",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#8B949E",
    lineHeight: 20,
    marginBottom: 20,
  },
  link: {
    color: "#58A6FF",
    textDecorationLine: "underline",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#8B949E",
    marginBottom: 8,
    fontFamily: "monospace",
  },
  input: {
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#30363D",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#E6EDF3",
    fontSize: 14,
    fontFamily: "monospace",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3DD68C",
  },
  statusText: {
    color: "#3DD68C",
    fontSize: 12,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#FF6B9D",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#8B949E",
    fontSize: 13,
  },
});
