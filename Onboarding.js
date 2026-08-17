import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

const { width: SW, height: SH } = Dimensions.get('window');

const DOTS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random(),
  y: Math.random(),
  s: Math.random() * 2 + 1,
  delay: Math.floor(Math.random() * 2500),
}));

function FloatingDot({ x, y, s, delay }) {
  const opacity = useRef(new Animated.Value(0.1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.5, duration: 700 + Math.random() * 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.1, duration: 900 + Math.random() * 400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute',
      left: x * SW - s / 2,
      top: y * SH - s / 2,
      width: s, height: s,
      borderRadius: s / 2,
      backgroundColor: '#2E7D32',
      opacity,
    }} />
  );
}

function GreenDots() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {DOTS.map(d => <FloatingDot key={d.id} x={d.x} y={d.y} s={d.s} delay={d.delay} />)}
    </View>
  );
}

const getSlides = (name) => [
  {
    id: '1',
    icon: 'checkmark-circle-outline',
    title: `Welcome, ${name}!`,
    subtitle: 'TaskBound helps you stay organised and on top of everything that matters.',
    tag: null,
  },
  {
    id: '2',
    icon: 'add-circle-outline',
    title: 'Create Tasks Easily',
    subtitle: 'Tap the + button to add a new task. Set a title, category, priority, and deadline.',
    tag: null,
  },
  {
    id: '3',
    icon: 'checkbox-outline',
    title: 'Track Your Progress',
    subtitle: 'Tap the circle next to a task to mark it done. The title will be crossed out automatically.',
    tag: null,
  },
  {
    id: '4',
    icon: 'calendar-outline',
    title: 'Calendar View',
    subtitle: 'See all your tasks laid out by date. Tap any day to view, add, or manage tasks. Colour-coded dots show what\'s done, upcoming, or missed.',
    tag: null,
  },
  {
    id: '5',
    icon: 'timer-outline',
    title: 'Focus Mode Timer',
    subtitle: "There's a built-in focus timer to help you work distraction-free. Set your session length, start the timer, and stay locked in until the job is done.",
    tag: null,
  },
  {
    id: '6',
    icon: 'rocket-outline',
    title: "You're All Set!",
    subtitle: "Let's get productive. Your first task is waiting to be created.",
    tag: null,
  },
];

export default function Onboarding({ route, navigation }) {
  const { theme } = useTheme();
  const name   = route.params?.name || 'there';
  const slides = getSlides(name);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0,   duration: 120, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -30, duration: 120, useNativeDriver: true }),
      ]).start(() => {
        setCurrentIndex(prev => prev + 1);
        slideAnim.setValue(30);
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      });
    } else {
      navigation.replace('Main');
    }
  };

  const skip  = () => navigation.replace('Main');
  const slide = slides[currentIndex];
  const s     = makeStyles(theme);

  return (
    <View style={s.container}>
      <GreenDots />

      <TouchableOpacity style={s.skipBtn} onPress={skip}>
        <Text style={s.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        <View style={s.iconCircle}>
          <Ionicons name={slide.icon} size={72} color="#2E7D32" />
        </View>

        {slide.tag && (
          <View style={s.newBadge}>
            <Text style={s.newBadgeText}>{slide.tag}</Text>
          </View>
        )}

        <Text style={s.title}>{slide.title}</Text>
        <Text style={s.subtitle}>{slide.subtitle}</Text>
      </Animated.View>

      <View style={s.bottom}>
        <View style={s.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[s.dot, i === currentIndex && { backgroundColor: '#2E7D32', width: 22 }]}
            />
          ))}
        </View>

        <TouchableOpacity style={[s.nextBtn, { backgroundColor: '#2E7D32' }]} onPress={goNext}>
          <Text style={s.nextText}>
            {currentIndex === slides.length - 1 ? "Let's Go" : 'Next'}
          </Text>
          <Ionicons
            name={currentIndex === slides.length - 1 ? 'rocket-outline' : 'arrow-forward'}
            size={18}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: 32,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  skipText: { color: '#888', fontSize: 14, fontWeight: '600' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  iconCircle: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: '#fff',
    borderWidth: 2, borderColor: '#2E7D32',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 28, elevation: 2,
  },
  newBadge: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, marginBottom: 12,
  },
  newBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: {
    fontSize: 26, fontWeight: '800',
    color: '#2E7D32', textAlign: 'center', marginBottom: 14,
  },
  subtitle: {
    fontSize: 15, color: '#888',
    textAlign: 'center', lineHeight: 24,
  },
  bottom: { alignItems: 'center', gap: 24 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 44, paddingVertical: 16,
    borderRadius: 16, elevation: 4,
  },
  nextText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});