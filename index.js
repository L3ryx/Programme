import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { alexGenerations, alexLikes, alexPsychology } from './alexData';

const { width, height } = Dimensions.get('window');

const C = {
  bg: '#0D1117',
  surface: '#161B22',
  surface2: '#1C2128',
  border: '#30363D',
  accent: '#FF1493',
  accentSoft: '#3D1A2A',
  accentBlue: '#58A6FF',
  danger: '#F85149',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#484F58',
};

// Composant coeur dessiné en React Native pur
function HeartShape({ size = 100, color = C.accent }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute',
        width: s * 0.5,
        height: s * 0.5,
        borderRadius: s * 0.25,
        backgroundColor: color,
        top: s * 0.08,
        left: s * 0.03,
      }} />
      <View style={{
        position: 'absolute',
        width: s * 0.5,
        height: s * 0.5,
        borderRadius: s * 0.25,
        backgroundColor: color,
        top: s * 0.08,
        right: s * 0.03,
      }} />
      <View style={{
        position: 'absolute',
        width: s * 0.72,
        height: s * 0.72,
        backgroundColor: color,
        bottom: s * 0.04,
        transform: [{ rotate: '45deg' }],
        borderRadius: 6,
      }} />
    </View>
  );
}

// Particule d'explosion
function Particle({ delay, angle, distance, size, color }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] }),
        transform: [
          { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, x] }) },
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, y] }) },
          { scale: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1.5, 0.2] }) },
        ],
      }}
    />
  );
}

// Écran d'intro animé
function IntroScreen({ onFinish }) {
  const [phase, setPhase] = useState(0);
  const [showParticles, setShowParticles] = useState(false);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const explosionScale = useRef(new Animated.Value(1)).current;
  const explosionOpacity = useRef(new Animated.Value(1)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    angle: (i / 20) * Math.PI * 2,
    distance: 80 + Math.random() * 120,
    size: 4 + Math.random() * 10,
    delay: Math.random() * 150,
    color: i % 3 === 0 ? '#FF1493' : i % 3 === 1 ? '#FF69B4' : '#FFB6C1',
  }));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(titleY, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setPhase(1);
      Animated.parallel([
        Animated.spring(heartScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(heartOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        setPhase(2);
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseScale, { toValue: 1.12, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(pulseScale, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
          { iterations: 2 }
        ).start(() => {
          setPhase(3);
          setShowParticles(true);
          Animated.parallel([
            Animated.timing(explosionScale, { toValue: 8, duration: 500, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
            Animated.timing(explosionOpacity, { toValue: 0, duration: 500, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          ]).start(() => {
            setTimeout(() => {
              Animated.timing(screenOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(onFinish);
            }, 300);
          });
        });
      });
    });
  }, []);

  return (
    <Animated.View style={[styles.introContainer, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.introGlow} />
      <Animated.Text style={[styles.introTitle, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
        Lexou
      </Animated.Text>
      {phase >= 1 && (
        <Animated.View
          style={{
            transform: [
              { scale: phase >= 3 ? Animated.multiply(heartScale, explosionScale) : Animated.multiply(heartScale, pulseScale) },
            ],
            opacity: phase >= 3 ? explosionOpacity : heartOpacity,
            marginTop: 30,
          }}
        >
          <HeartShape size={120} color={C.accent} />
        </Animated.View>
      )}
      {showParticles && (
        <View style={styles.particlesContainer}>
          {particles.map((p) => (
            <Particle key={p.id} {...p} />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

// Écran principal
function MainScreen() {
  const [activeTab, setActiveTab] = useState('generator');
  const [generationIndex, setGenerationIndex] = useState(0);

  const currentGeneration = alexGenerations[generationIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={styles.tabsContainer}>
        {[
          { key: 'generator', label: '🎲 Générateur' },
          { key: 'likes', label: '❤️ Likes' },
          { key: 'brain', label: '🧠 Psycho' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabText}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'generator' && (
        <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
          <View style={styles.generatorCard}>
            <View style={styles.generationHeader}>
              <Text style={styles.generationCounter}>{generationIndex + 1} / {alexGenerations.length}</Text>
              <Text style={styles.generationEmoji}>{currentGeneration.emoji}</Text>
            </View>
            <Text style={styles.generationCategory}>{currentGeneration.category.toUpperCase()}</Text>
            <Text style={styles.generationText}>{currentGeneration.text}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => setGenerationIndex(i => i === 0 ? alexGenerations.length - 1 : i - 1)}>
                <Text style={styles.buttonText}>← Précédent</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={() => setGenerationIndex(Math.floor(Math.random() * alexGenerations.length))}>
                <Text style={styles.buttonText}>🎲 Aléatoire</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => setGenerationIndex(i => i === alexGenerations.length - 1 ? 0 : i + 1)}>
                <Text style={styles.buttonText}>Suivant →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === 'likes' && (
        <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
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

      {activeTab === 'brain' && (
        <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Psychologie d'Alex</Text>
          <View style={styles.brainCard}>
            <Text style={styles.brainEmoji}>🧠</Text>
            <Text style={styles.brainSummary}>{alexPsychology.summary}</Text>
          </View>
          {[
            { title: '✨ Atouts', items: alexPsychology.atouts, color: C.accent },
            { title: '⚠️ Faiblesses', items: alexPsychology.faiblesses, color: C.danger },
            { title: '🔍 Traits de caractère', items: alexPsychology.traits, color: C.accentBlue },
          ].map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionSubtitle, { color: section.color }]}>{section.title}</Text>
              {section.items.map((item, index) => (
                <View key={index} style={[styles.traitItem, { borderLeftColor: section.color }]}>
                  <Text style={[styles.traitBullet, { color: section.color }]}>•</Text>
                  <Text style={styles.traitText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// App principale
function App() {
  const [showIntro, setShowIntro] = useState(true);
  return showIntro ? <IntroScreen onFinish={() => setShowIntro(false)} /> : <MainScreen />;
}

const styles = StyleSheet.create({
  introContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF1493',
    opacity: 0.08,
    top: height / 2 - 150,
  },
  introTitle: {
    fontSize: 72,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 6,
    textShadowColor: '#FF1493',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  particlesContainer: {
    position: 'absolute',
    width: 2,
    height: 2,
    alignItems: 'center',
    justifyContent: 'center',
    top: height / 2 + 50,
    left: width / 2,
  },
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  tabActive: { backgroundColor: C.accent },
  tabText: { color: C.textPrimary, fontWeight: '600', fontSize: 13 },
  contentContainer: { flex: 1 },
  contentInner: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  generatorCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  generationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  generationCounter: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  generationEmoji: { fontSize: 32 },
  generationCategory: {
    color: C.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  generationText: {
    color: C.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  button: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  buttonPrimary: { backgroundColor: C.accent },
  buttonSecondary: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  buttonText: { color: C.textPrimary, fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: C.textPrimary, marginBottom: 16 },
  likesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  likeCard: {
    width: '48%',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  likeEmoji: { fontSize: 40, marginBottom: 8 },
  likeText: { color: C.textPrimary, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  brainCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  brainEmoji: { fontSize: 48, marginBottom: 12 },
  brainSummary: {
    color: C.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: { marginBottom: 20 },
  sectionSubtitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  traitItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  traitBullet: { fontSize: 16, marginRight: 8 },
  traitText: { color: C.textPrimary, fontSize: 13, flex: 1, lineHeight: 20 },
});

registerRootComponent(App);
