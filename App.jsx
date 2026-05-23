import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { alexGenerations, alexLikes, alexPsychology } from "./alexData";

const { width, height } = Dimensions.get("window");

// Couleurs cohérentes
const C = {
  bg: "#0D1117",
  surface: "#161B22",
  surface2: "#1C2128",
  border: "#30363D",
  accent: "#FF1493", // Rose/Pink
  accentSoft: "#3D1A2A",
  accentBlue: "#58A6FF",
  danger: "#F85149",
  textPrimary: "#E6EDF3",
  textSecondary: "#8B949E",
  textMuted: "#484F58",
};

// Intro animée
function IntroScreen({ onFinish }) {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(1));
  const [showExplosion, setShowExplosion] = useState(false);

  useEffect(() => {
    // Animation d'apparition du coeur
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setShowExplosion(true);
      setTimeout(onFinish, 600);
    });
  }, []);

  return (
    <View style={[styles.introContainer, { backgroundColor: C.bg }]}>
      <Text style={styles.introTitle}>Lexou</Text>

      {!showExplosion && (
        <Animated.View
          style={[
            styles.heartContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Text style={styles.heartEmoji}>❤️</Text>
        </Animated.View>
      )}

      {showExplosion && (
        <View style={styles.explosionContainer}>
          <Text style={styles.explosionEmoji}>💥</Text>
          <Text style={[styles.explosionEmoji, { opacity: 0.6 }]}>✨</Text>
          <Text style={[styles.explosionEmoji, { opacity: 0.4 }]}>⭐</Text>
        </View>
      )}
    </View>
  );
}

// Écran principal
function MainScreen() {
  const [activeTab, setActiveTab] = useState("generator");
  const [generationIndex, setGenerationIndex] = useState(0);
  const [likes, setLikes] = useState([...alexLikes]);

  const currentGeneration = alexGenerations[generationIndex];

  const handleNextGeneration = () => {
    setGenerationIndex((prev) =>
      prev === alexGenerations.length - 1 ? 0 : prev + 1
    );
  };

  const handlePreviousGeneration = () => {
    setGenerationIndex((prev) =>
      prev === 0 ? alexGenerations.length - 1 : prev - 1
    );
  };

  const handleRandomGeneration = () => {
    setGenerationIndex(Math.floor(Math.random() * alexGenerations.length));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "generator" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("generator")}
        >
          <Text style={styles.tabText}>🎲 Générateur</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "likes" && styles.tabActive]}
          onPress={() => setActiveTab("likes")}
        >
          <Text style={styles.tabText}>❤️ Likes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "brain" && styles.tabActive]}
          onPress={() => setActiveTab("brain")}
        >
          <Text style={styles.tabText}>🧠 Psycho</Text>
        </TouchableOpacity>
      </View>

      {/* Generator Tab */}
      {activeTab === "generator" && (
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.generatorCard}>
            <View style={styles.generationHeader}>
              <Text style={styles.generationCounter}>
                {generationIndex + 1} / {alexGenerations.length}
              </Text>
              <Text style={styles.generationEmoji}>
                {currentGeneration.emoji}
              </Text>
            </View>

            <Text style={styles.generationCategory}>
              {currentGeneration.category.toUpperCase()}
            </Text>

            <Text style={styles.generationText}>
              {currentGeneration.text}
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handlePreviousGeneration}
              >
                <Text style={styles.buttonText}>← Précédent</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleRandomGeneration}
              >
                <Text style={styles.buttonText}>🎲 Aléatoire</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleNextGeneration}
              >
                <Text style={styles.buttonText}>Suivant →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Likes Tab */}
      {activeTab === "likes" && (
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Ce qu'Alex aime</Text>
          <View style={styles.likesGrid}>
            {alexLikes.map((like, index) => (
              <View key={index} style={styles.likeCard}>
                <Text style={styles.likeEmoji}>{like.emoji}</Text>
                <Text style={styles.likeText}>{like.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Brain/Psychology Tab */}
      {activeTab === "brain" && (
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Psychologie d'Alex</Text>

          <View style={styles.brainCard}>
            <Text style={styles.brainEmoji}>🧠</Text>
            <Text style={styles.brainSummary}>{alexPsychology.summary}</Text>
          </View>

          {/* Atouts */}
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>✨ Atouts</Text>
            {alexPsychology.atouts.map((atout, index) => (
              <View key={index} style={styles.traitItem}>
                <Text style={styles.traitBullet}>•</Text>
                <Text style={styles.traitText}>{atout}</Text>
              </View>
            ))}
          </View>

          {/* Faiblesses */}
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>⚠️ Faiblesses</Text>
            {alexPsychology.faiblesses.map((faiblesse, index) => (
              <View key={index} style={styles.traitItem}>
                <Text style={[styles.traitBullet, { color: C.danger }]}>
                  •
                </Text>
                <Text style={styles.traitText}>{faiblesse}</Text>
              </View>
            ))}
          </View>

          {/* Traits */}
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>🔍 Traits de caractère</Text>
            {alexPsychology.traits.map((trait, index) => (
              <View key={index} style={styles.traitItem}>
                <Text style={[styles.traitBullet, { color: C.accent }]}>
                  •
                </Text>
                <Text style={styles.traitText}>{trait}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// App principale
export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  if (showIntro) {
    return <IntroScreen onFinish={() => setShowIntro(false)} />;
  }

  return <MainScreen />;
}

// Styles
const styles = StyleSheet.create({
  // Intro Styles
  introContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  introTitle: {
    fontSize: 60,
    fontWeight: "bold",
    color: C.accent,
    marginBottom: 40,
  },
  heartContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  heartEmoji: {
    fontSize: 80,
  },
  explosionContainer: {
    position: "relative",
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  explosionEmoji: {
    fontSize: 60,
    position: "absolute",
  },

  // Main Styles
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: C.surface,
  },
  tabActive: {
    backgroundColor: C.accent,
  },
  tabText: {
    color: C.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
  contentContainer: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // Generator Styles
  generatorCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  generationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  generationCounter: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  generationEmoji: {
    fontSize: 32,
  },
  generationCategory: {
    color: C.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  generationText: {
    color: C.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: C.accent,
  },
  buttonSecondary: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
  },
  buttonText: {
    color: C.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },

  // Likes Styles
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: C.textPrimary,
    marginBottom: 16,
  },
  likesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  likeCard: {
    width: "48%",
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  likeEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  likeText: {
    color: C.textPrimary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },

  // Brain Styles
  brainCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  brainEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  brainSummary: {
    color: C.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
  },
  section: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.accent,
    marginBottom: 12,
  },
  traitItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  traitBullet: {
    color: C.accent,
    fontSize: 16,
    marginRight: 8,
  },
  traitText: {
    color: C.textPrimary,
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
});
