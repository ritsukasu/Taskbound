import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Modal, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from './firebaseConfig';

const { width: SW, height: SH } = Dimensions.get('window');

const S = {
  leftFoot:    { x: 0.30, y: 0.04, s: 8  },
  rightFoot:   { x: 0.68, y: 0.06, s: 8  },
  leftKnee:    { x: 0.36, y: 0.12, s: 7  },
  rightKnee:   { x: 0.62, y: 0.14, s: 7  },
  iota:        { x: 0.44, y: 0.19, s: 9  },
  theta:       { x: 0.56, y: 0.19, s: 9  },
  zeta:        { x: 0.44, y: 0.27, s: 10 },
  eta:         { x: 0.56, y: 0.27, s: 10 },
  epsilon:     { x: 0.32, y: 0.28, s: 8  },
  pi:          { x: 0.64, y: 0.23, s: 8  },
  mu:          { x: 0.22, y: 0.33, s: 6  },
  xi:          { x: 0.72, y: 0.30, s: 7  },
  omicron:     { x: 0.78, y: 0.22, s: 6  },
  sarin:       { x: 0.38, y: 0.35, s: 9  },
  kornephoros: { x: 0.50, y: 0.34, s: 11 },
  rasAlgethi:  { x: 0.53, y: 0.43, s: 13 },
};

const L = [
  ['leftFoot','leftKnee'],['rightFoot','rightKnee'],
  ['leftKnee','iota'],['rightKnee','theta'],
  ['iota','theta'],['iota','zeta'],['theta','eta'],['zeta','eta'],
  ['zeta','epsilon'],['epsilon','sarin'],['sarin','mu'],
  ['eta','pi'],['pi','xi'],['xi','omicron'],
  ['sarin','kornephoros'],['zeta','kornephoros'],['kornephoros','rasAlgethi'],
];

const BG_STARS = [
  {x:0.04,y:0.05,s:3},{x:0.93,y:0.07,s:3},{x:0.07,y:0.16,s:2},
  {x:0.91,y:0.20,s:2},{x:0.03,y:0.32,s:3},{x:0.96,y:0.36,s:2},
  {x:0.05,y:0.50,s:2},{x:0.94,y:0.54,s:3},{x:0.04,y:0.65,s:3},
  {x:0.95,y:0.68,s:2},{x:0.06,y:0.78,s:2},{x:0.92,y:0.82,s:3},
  {x:0.05,y:0.90,s:3},{x:0.93,y:0.93,s:2},{x:0.10,y:0.97,s:2},
  {x:0.18,y:0.09,s:3,g:true},{x:0.82,y:0.12,s:2,g:true},{x:0.25,y:0.22,s:2,g:true},
  {x:0.75,y:0.08,s:3,g:true},{x:0.13,y:0.40,s:2,g:true},{x:0.87,y:0.44,s:3,g:true},
  {x:0.20,y:0.55,s:2,g:true},{x:0.80,y:0.60,s:2,g:true},{x:0.15,y:0.70,s:3,g:true},
  {x:0.85,y:0.73,s:2,g:true},{x:0.22,y:0.84,s:2,g:true},{x:0.78,y:0.88,s:3,g:true},
  {x:0.35,y:0.62,s:2,g:true},{x:0.65,y:0.67,s:2,g:true},{x:0.50,y:0.78,s:3,g:true},
  {x:0.42,y:0.88,s:2,g:true},{x:0.60,y:0.92,s:2,g:true},{x:0.30,y:0.95,s:3,g:true},
  {x:0.70,y:0.96,s:2,g:true},{x:0.88,y:0.15,s:2,g:true},{x:0.12,y:0.25,s:3,g:true},
  {x:0.55,y:0.50,s:2,g:true},{x:0.45,y:0.72,s:2,g:true},{x:0.28,y:0.47,s:2,g:true},
  {x:0.72,y:0.52,s:3,g:true},{x:0.17,y:0.60,s:2,g:true},{x:0.83,y:0.35,s:2,g:true},
];

function Line({ a, b }) {
  const ax = a.x * SW, ay = a.y * SH;
  const bx = b.x * SW, by = b.y * SH;
  const dx = bx - ax, dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <View style={{
      position: 'absolute', left: ax, top: ay, width: len, height: 1,
      backgroundColor: '#2E7D32', opacity: 0.15,
      transformOrigin: '0 50%', transform: [{ rotate: `${angle}deg` }],
    }} />
  );
}

function TwinklingStar({ x, y, s, delay }) {
  const opacity = useRef(new Animated.Value(0.22)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 0.55, duration: 600, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.15, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.35, duration: 500, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.22, duration: 700, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', left: x * SW - s / 2, top: y * SH - s / 2,
      width: s, height: s, borderRadius: s / 2, backgroundColor: '#2E7D32', opacity,
    }} />
  );
}

function GreenDotsOnly() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {BG_STARS.filter(d => d.g).map((d, i) => (
        <TwinklingStar key={`gd${i}`} x={d.x} y={d.y} s={d.s} delay={i * 130} />
      ))}
    </View>
  );
}

function HerculesConstellation() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {BG_STARS.map((d, i) =>
        d.g ? (
          <TwinklingStar key={`bg${i}`} x={d.x} y={d.y} s={d.s} delay={i * 130} />
        ) : (
          <View key={`bg${i}`} style={{
            position: 'absolute', left: d.x * SW - d.s / 2, top: d.y * SH - d.s / 2,
            width: d.s, height: d.s, borderRadius: d.s / 2, backgroundColor: '#aaa', opacity: 0.15,
          }} />
        )
      )}
      {L.map(([a, b], i) => <Line key={i} a={S[a]} b={S[b]} />)}
      {Object.entries(S).map(([name, d], i) => (
        <TwinklingStar key={name} x={d.x} y={d.y} s={d.s} delay={i * 180} />
      ))}
    </View>
  );
}

const PRIMARY = '#2E7D32';
const PRIMARY_DARK = '#1B5E20';
const BG = '#fff';
const CARD = '#fff';
const TEXT = '#222';
const SUBTEXT = '#888';
const BORDER = '#E0E0E0';

export default function Login({ navigation }) {
  const [step, setStep] = useState('landing');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const alertScale = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const passFade = useRef(new Animated.Value(0)).current;
  const passSlide = useRef(new Animated.Value(20)).current;
  const passRef = useRef(null);

  const showAlert = (title, msg) => {
    setAlertTitle(title); setAlertMsg(msg);
    alertScale.setValue(0.85); setAlertVisible(true);
    Animated.spring(alertScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
  };
  const hideAlert = () => {
    Animated.timing(alertScale, { toValue: 0.85, duration: 130, useNativeDriver: true }).start(() => setAlertVisible(false));
  };

  const goToUsername = () => {
    setStep('username'); fadeAnim.setValue(0); slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const revealPassword = () => {
    if (!username.trim()) { showAlert('Username required', 'Please enter your username.'); return; }
    if (step === 'username') {
      setStep('password'); passFade.setValue(0); passSlide.setValue(20);
      Animated.parallel([
        Animated.timing(passFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(passSlide, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start(() => passRef.current?.focus());
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) { showAlert('Password required', 'Please enter your password.'); return; }
    setLoading(true);
    try {
      const snap = await db.collection('users').where('username', '==', username.trim().toLowerCase()).get();
      if (snap.empty) {
        showAlert('User not found', 'No account found with that username.');
        setLoading(false);
        return;
      }
      const email = snap.docs[0].data().email;
      await auth.signInWithEmailAndPassword(email, password);
      navigation.replace('Main');
    } catch (e) {
      showAlert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const AlertModal = () => (
    <Modal transparent visible={alertVisible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.alertBox, { transform: [{ scale: alertScale }] }]}>
          <Ionicons name="alert-circle" size={32} color={PRIMARY} style={{ marginBottom: 10 }} />
          <Text style={styles.alertTitle}>{alertTitle}</Text>
          <Text style={styles.alertMsg}>{alertMsg}</Text>
          <TouchableOpacity style={styles.alertBtn} onPress={hideAlert}>
            <Text style={styles.alertBtnText}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );

  if (step === 'landing') {
    return (
      <View style={styles.landingContainer}>
        <HerculesConstellation />
        <View style={styles.landingCenter}>
          <View style={styles.titleRow}>
            <Text style={styles.landingTitle}>Get things done</Text>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </View>
          </View>
          <Text style={styles.landingSubtitle}>Stay organized and on top of everything that matters with TaskBound.</Text>
        </View>
        <View style={styles.landingBottom}>
          <TouchableOpacity style={styles.emailIconBtn} onPress={goToUsername}>
            <Ionicons name="person-outline" size={24} color={PRIMARY_DARK} />
            <Text style={styles.emailIconText}>Continue with Username</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupText}>Don't have an account? <Text style={styles.signupBold}>Sign Up</Text></Text>
          </TouchableOpacity>
          <Text style={styles.legalText}>By continuing you accept our Terms of Use and Privacy Policy.</Text>
        </View>
        <AlertModal />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GreenDotsOnly />
      <View style={styles.stepHeader}>
        <TouchableOpacity
          onPress={() => {
            if (step === 'username') { setStep('landing'); setPassword(''); }
            else if (step === 'password') { setStep('username'); setPassword(''); }
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>{step === 'username' ? 'Enter Username' : 'Enter Password'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.View style={[styles.stepBody, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.fieldLabel}>Username</Text>
        <View style={styles.stepInputRow}>
          <TextInput
            style={styles.stepInput}
            placeholder="Username"
            placeholderTextColor={SUBTEXT}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoFocus={step === 'username'}
            returnKeyType="next"
            onSubmitEditing={revealPassword}
            blurOnSubmit={false}
          />
        </View>

        {step === 'password' && (
          <Animated.View style={{ opacity: passFade, transform: [{ translateY: passSlide }] }}>
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Password</Text>
            <View style={styles.stepInputRow}>
              <TextInput
                ref={passRef}
                style={styles.stepInput}
                placeholder="Password"
                placeholderTextColor={SUBTEXT}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeInsideBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={SUBTEXT} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Log In</Text>}
            </TouchableOpacity>
          </Animated.View>
        )}

        {step === 'username' && (
          <TouchableOpacity style={styles.actionBtn} onPress={revealPassword}>
            <Text style={styles.actionBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
      </Animated.View>
      <AlertModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  landingContainer: { flex: 1, backgroundColor: BG, justifyContent: 'space-between', paddingBottom: 40 },
  landingCenter: { paddingHorizontal: 28, alignItems: 'flex-start', marginTop: SH * 0.47 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  landingTitle: { fontSize: 34, fontWeight: '900', color: '#111', lineHeight: 40 },
  checkCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  landingSubtitle: { fontSize: 15, color: SUBTEXT, lineHeight: 22 },
  landingBottom: { paddingHorizontal: 24, gap: 16 },
  emailIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: BORDER, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, backgroundColor: BG },
  emailIconText: { fontSize: 15, fontWeight: '700', color: PRIMARY_DARK },
  signupText: { textAlign: 'center', fontSize: 14, color: SUBTEXT },
  signupBold: { color: PRIMARY_DARK, fontWeight: '700' },
  legalText: { textAlign: 'center', fontSize: 11, color: '#bbb', lineHeight: 16 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 20, backgroundColor: BG },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  stepTitle: { fontSize: 17, fontWeight: '700', color: TEXT },
  stepBody: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: SUBTEXT, marginBottom: 8 },
  stepInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 12, paddingHorizontal: 14, backgroundColor: CARD, marginBottom: 4 },
  stepInput: { flex: 1, fontSize: 16, color: TEXT, paddingVertical: 16 },
  eyeInsideBtn: { padding: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 16, borderRadius: 14, backgroundColor: PRIMARY, elevation: 4 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: CARD, borderRadius: 28, padding: 28, width: '82%', alignItems: 'center', elevation: 16 },
  alertTitle: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 8, textAlign: 'center' },
  alertMsg: { fontSize: 14, color: SUBTEXT, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  alertBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, backgroundColor: PRIMARY },
  alertBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});