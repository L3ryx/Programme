import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { phases, regles } from "../data";

// Helper to convert hex color to rgba with opacity
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
        <Text style={[styles.phaseNumero, { color: phase.couleur }]}>
          {phase.numero}
        </Text>
        <Text style={styles.phaseIcon}>{phase.icon}</Text>
        <View style={styles.phaseTitleBlock}>
          <Text style={styles.phaseTitre}>{phase.titre}</Text>
          <Text style={styles.phaseDuree}>{phase.duree}</Text>
        </View>
        <Text style={[styles.phaseArrow, expanded && styles.phaseArrowUp]}>↓</Text>
      </TouchableOpacity>

      {expanded && (
        <View
          style={[
            styles.phaseContent,
            { borderColor: hexToRgba(phase.couleur, 0.2) },
          ]}
        >
          <Text style={styles.phaseDescription}>{phase.description}</Text>

          {/* Actions */}
          <Text style={[styles.sectionLabel, { color: phase.couleur }]}>
            À FAIRE
          </Text>
          {phase.actions.map((action, j) => (
            <View
              key={j}
              style={[
                styles.actionCard,
                { borderLeftColor: phase.couleur },
              ]}
            >
              <Text style={styles.actionTitre}>{action.titre}</Text>
              <Text style={styles.actionDetail}>{action.detail}</Text>
            </View>
          ))}

          {/* Erreurs */}
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

function ProgrammeTab() {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.introBox}>
        <Text style={styles.introText}>
          Ce programme n'est pas une liste de cases à cocher. C'est un chemin. Les phases se superposent, certaines durent plus longtemps que prévu. L'important n'est pas la vitesse — c'est la direction.
        </Text>
      </View>

      {phases.map((phase) => (
        <PhaseCard key={phase.id} phase={phase} />
      ))}

      <View style={styles.finalBox}>
        <Text style={styles.finalEmoji}>🌱</Text>
        <Text style={styles.finalText}>
          Camille ne reviendra pas parce qu'Alex aura dit les bons mots. Elle reviendra — peut-être — parce qu'il sera devenu quelqu'un qui n'a plus besoin d'elle pour exister. C'est la seule chose qui puisse vraiment changer la donne.
        </Text>
      </View>
    </ScrollView>
  );
}

function ReglesTab() {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.introBox}>
        <Text style={styles.introText}>
          Ces règles ne sont pas des contraintes imposées de l'extérieur. Ce sont les limites qu'Alex doit s'imposer à lui-même — parce qu'il comprend désormais ce qu'elles protègent.
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
                backgroundColor: isNon
                  ? "rgba(192,57,43,0.06)"
                  : "rgba(39,174,96,0.06)",
                borderColor: isNon
                  ? "rgba(192,57,43,0.2)"
                  : "rgba(39,174,96,0.2)",
              },
            ]}
          >
            <Text style={styles.regleEmoji}>{regle.emoji}</Text>
            <Text
              style={[
                styles.regleTexte,
                { color: isNon ? "#c0a0a0" : "#a0c0a8" },
              ]}
            >
              {regle.texte}
            </Text>
          </View>
        );
      })}

      <View style={styles.regleMasterBox}>
        <Text style={styles.regleMasterLabel}>LA RÈGLE AU-DESSUS DE TOUTES</Text>
        <Text style={styles.regleMasterQuote}>
          "Avant d'envoyer un message, se poser une seule question : est-ce que ce message nourrit la relation ou est-ce qu'il nourrit mon angoisse ?"
        </Text>
        <Text style={styles.regleMasterSub}>
          Si la réponse est "mon angoisse" — poser le téléphone. Toujours.
        </Text>
      </View>
    </ScrollView>
  );
}

export default function Index() {
  const [onglet, setOnglet] = useState("programme");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSurtitle}>
          PROGRAMME DE RECONSTRUCTION PERSONNELLE
        </Text>
        <Text style={styles.headerTitle}>Pour Alex</Text>
        <Text style={styles.headerSub}>
          5 phases · 6 mois · Un seul objectif
        </Text>
      </View>

      {/* Navigation tabs */}
      <View style={styles.tabs}>
        {["programme", "regles"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setOnglet(tab)}
            style={[styles.tab, onglet === tab && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                onglet === tab && styles.tabTextActive,
              ]}
            >
              {tab === "programme" ? "LES 5 PHASES" : "LES RÈGLES D'OR"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {onglet === "programme" ? <ProgrammeTab /> : <ReglesTab />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
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
  headerTitle: {
    fontSize: 32,
    fontWeight: "300",
    color: "#f0ebe0",
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.01)",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#e8e0d0",
  },
  tabText: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#555",
    fontFamily: "monospace",
  },
  tabTextActive: {
    color: "#e8e0d0",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  introBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  introText: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },

  // Phase card
  phaseWrapper: {
    marginBottom: 12,
  },
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
  phaseNumero: {
    fontFamily: "monospace",
    fontSize: 10,
    letterSpacing: 2,
    minWidth: 22,
  },
  phaseIcon: {
    fontSize: 20,
  },
  phaseTitleBlock: {
    flex: 1,
  },
  phaseTitre: {
    color: "#e8e0d0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  phaseDuree: {
    color: "#555",
    fontSize: 11,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  phaseArrow: {
    color: "#555",
    fontSize: 16,
  },
  phaseArrowUp: {
    transform: [{ rotate: "180deg" }],
  },
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
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 3,
    fontFamily: "monospace",
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderLeftWidth: 3,
    borderRadius: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  actionTitre: {
    color: "#e8e0d0",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 6,
  },
  actionDetail: {
    color: "#888",
    fontSize: 13,
    lineHeight: 20,
  },
  erreurRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  erreurCross: {
    color: "#C0392B",
    fontSize: 13,
    marginTop: 1,
  },
  erreurText: {
    color: "#777",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },

  // Final box
  finalBox: {
    marginTop: 24,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    alignItems: "center",
  },
  finalEmoji: {
    fontSize: 28,
    marginBottom: 14,
  },
  finalText: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 24,
    fontStyle: "italic",
    textAlign: "center",
  },

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
  regleEmoji: {
    fontSize: 18,
    marginTop: 1,
  },
  regleTexte: {
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  regleMasterBox: {
    marginTop: 32,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
  },
  regleMasterLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: "#555",
    fontFamily: "monospace",
    marginBottom: 14,
  },
  regleMasterQuote: {
    color: "#c8c0b0",
    fontSize: 15,
    lineHeight: 26,
    fontStyle: "italic",
  },
  regleMasterSub: {
    color: "#555",
    fontSize: 13,
    marginTop: 12,
    lineHeight: 20,
  },
});
