import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Modal, Animated, Dimensions, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from './firebaseConfig';
import { useTheme } from './ThemeContext';

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

export default function Register({ navigation }) {
  const { setThemeName } = useTheme();
  const [step, setStep] = useState('landing');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [alertOnOk, setAlertOnOk] = useState(null);

  const alertScale = useRef(new Animated.Value(0.85)).current;
  const nameFade = useRef(new Animated.Value(0)).current;
  const nameSlide = useRef(new Animated.Value(40)).current;
  const usernameFade = useRef(new Animated.Value(0)).current;
  const usernameSlide = useRef(new Animated.Value(20)).current;
  const emailFade = useRef(new Animated.Value(0)).current;
  const emailSlide = useRef(new Animated.Value(20)).current;
  const passFade = useRef(new Animated.Value(0)).current;
  const passSlide = useRef(new Animated.Value(20)).current;
  const confirmFade = useRef(new Animated.Value(0)).current;
  const confirmSlide = useRef(new Animated.Value(20)).current;
  const submitFade = useRef(new Animated.Value(0)).current;

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passRef = useRef(null);
  const confirmRef = useRef(null);

  const showAlert = (title, msg, onOk) => {
    setAlertTitle(title); setAlertMsg(msg); setAlertOnOk(() => onOk || null);
    alertScale.setValue(0.85); setAlertVisible(true);
    Animated.spring(alertScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
  };
  const hideAlert = () => {
    Animated.timing(alertScale, { toValue: 0.85, duration: 130, useNativeDriver: true }).start(() => {
      setAlertVisible(false);
      if (alertOnOk) alertOnOk();
    });
  };

  const animIn = (fadeRef, slideRef, callback) => {
    fadeRef.setValue(0); slideRef.setValue(20);
    Animated.parallel([
      Animated.timing(fadeRef, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slideRef, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(callback);
  };

  const goToSignUp = () => {
    setStep('name'); nameFade.setValue(0); nameSlide.setValue(40);
    Animated.parallel([
      Animated.timing(nameFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(nameSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const revealUsername = () => {
    if (!name.trim()) { showAlert('Name required', 'Please enter your display name.'); return; }
    if (step === 'name') {
      setStep('username');
      animIn(usernameFade, usernameSlide, () => usernameRef.current?.focus());
    }
  };

  const revealEmail = () => {
    if (!username.trim()) { showAlert('Username required', 'Please choose a username.'); return; }
    if (!/^[a-z0-9_]+$/.test(username.trim().toLowerCase())) {
      showAlert('Invalid username', 'Username can only contain letters, numbers, and underscores.');
      return;
    }
    if (step === 'username') {
      setStep('email');
      animIn(emailFade, emailSlide, () => emailRef.current?.focus());
    }
  };

  const revealPassword = () => {
    if (!email.trim()) { showAlert('Email required', 'Please enter your email address.'); return; }
    if (step === 'email') {
      setStep('password');
      animIn(passFade, passSlide, () => passRef.current?.focus());
    }
  };

  const revealConfirm = () => {
    if (!password) { showAlert('Password required', 'Please enter a password.'); return; }
    if (step === 'password') {
      setStep('confirm'); submitFade.setValue(0);
      animIn(confirmFade, confirmSlide, () => {
        confirmRef.current?.focus();
        Animated.timing(submitFade, { toValue: 1, duration: 250, delay: 150, useNativeDriver: true }).start();
      });
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) { showAlert('Missing Name', 'Please enter your display name.'); return; }
    if (!username.trim()) { showAlert('Missing Username', 'Please choose a username.'); return; }
    if (!email.trim()) { showAlert('Missing Email', 'Please enter your email.'); return; }
    if (password.length < 6) { showAlert('Weak Password', 'Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { showAlert('Password Mismatch', 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      const usernameSnap = await db.collection('users').where('username', '==', username.trim().toLowerCase()).get();
      if (!usernameSnap.empty) {
        showAlert('Username taken', 'That username is already in use. Please choose another.');
        setLoading(false);
        return;
      }
      const cred = await auth.createUserWithEmailAndPassword(email.trim(), password);
      await db.collection('users').doc(cred.user.uid).set({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        photoURL: '',
        createdAt: new Date().toISOString(),
        tasksCompleted: 0,
      });
      navigation.replace('Onboarding', { name: name.trim() });
    } catch (e) {
      showAlert('Registration Failed', e.message);
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
            <Text style={styles.landingTitle}>Join TaskBound</Text>
            <View style={styles.checkCircle}>
              <Ionicons name="person-add-outline" size={18} color="#fff" />
            </View>
          </View>
          <Text style={styles.landingSubtitle}>Create an account and start organizing your tasks, goals, and everything in between.</Text>
        </View>
        <View style={styles.landingBottom}>
          <TouchableOpacity style={styles.emailIconBtn} onPress={goToSignUp}>
            <Ionicons name="mail-outline" size={24} color={PRIMARY_DARK} />
            <Text style={styles.emailIconText}>Sign Up with Email</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Log In</Text></Text>
          </TouchableOpacity>
          <Text style={styles.legalText}>By continuing you accept our Terms of Use and Privacy Policy.</Text>
        </View>
        <AlertModal />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <GreenDotsOnly />
      <View style={styles.stepHeader}>
        <TouchableOpacity
          onPress={() => {
            if (step === 'name') setStep('landing');
            else if (step === 'username') setStep('name');
            else if (step === 'email') setStep('username');
            else if (step === 'password') setStep('email');
            else if (step === 'confirm') setStep('password');
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Create Account</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View style={[styles.stepBody, { opacity: nameFade, transform: [{ translateY: nameSlide }] }]}>

          <Text style={styles.fieldLabel}>Display Name</Text>
          <View style={styles.stepInputRow}>
            <TextInput
              style={styles.stepInput}
              placeholder="Enter a display name"
              placeholderTextColor={SUBTEXT}
              value={name}
              onChangeText={setName}
              autoFocus={step === 'name'}
              returnKeyType="next"
              onSubmitEditing={revealUsername}
              blurOnSubmit={false}
            />
          </View>

          {['username', 'email', 'password', 'confirm'].includes(step) && (
            <Animated.View style={{ opacity: usernameFade, transform: [{ translateY: usernameSlide }] }}>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Username</Text>
              <View style={styles.stepInputRow}>
                <TextInput
                  ref={usernameRef}
                  style={styles.stepInput}
                  placeholder="Enter your username"
                  placeholderTextColor={SUBTEXT}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={revealEmail}
                  blurOnSubmit={false}
                />
              </View>
            </Animated.View>
          )}

          {['email', 'password', 'confirm'].includes(step) && (
            <Animated.View style={{ opacity: emailFade, transform: [{ translateY: emailSlide }] }}>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Email</Text>
              <View style={styles.stepInputRow}>
                <TextInput
                  ref={emailRef}
                  style={styles.stepInput}
                  placeholder="sample@example.com"
                  placeholderTextColor={SUBTEXT}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={revealPassword}
                  blurOnSubmit={false}
                />
              </View>
            </Animated.View>
          )}

          {['password', 'confirm'].includes(step) && (
            <Animated.View style={{ opacity: passFade, transform: [{ translateY: passSlide }] }}>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Password</Text>
              <View style={styles.stepInputRow}>
                <TextInput
                  ref={passRef}
                  style={styles.stepInput}
                  placeholder="Password min. 6 characters"
                  placeholderTextColor={SUBTEXT}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  returnKeyType="next"
                  onSubmitEditing={revealConfirm}
                  blurOnSubmit={false}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={SUBTEXT} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {step === 'confirm' && (
            <Animated.View style={{ opacity: confirmFade, transform: [{ translateY: confirmSlide }] }}>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Confirm Password</Text>
              <View style={styles.stepInputRow}>
                <TextInput
                  ref={confirmRef}
                  style={styles.stepInput}
                  placeholder="Re-enter password"
                  placeholderTextColor={SUBTEXT}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
              </View>
            </Animated.View>
          )}

          {step === 'confirm' ? (
            <Animated.View style={{ opacity: submitFade }}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Sign Up</Text>}
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={
                step === 'name' ? revealUsername :
                step === 'username' ? revealEmail :
                step === 'email' ? revealPassword :
                revealConfirm
              }
            >
              <Text style={styles.actionBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </Animated.View>
        <AlertModal />
      </ScrollView>
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
  loginText: { textAlign: 'center', fontSize: 14, color: SUBTEXT },
  loginBold: { color: PRIMARY_DARK, fontWeight: '700' },
  legalText: { textAlign: 'center', fontSize: 11, color: '#bbb', lineHeight: 16 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 20, backgroundColor: BG },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  stepTitle: { fontSize: 17, fontWeight: '700', color: TEXT },
  stepBody: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: SUBTEXT, marginBottom: 8 },
  stepInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 12, paddingHorizontal: 14, backgroundColor: CARD, marginBottom: 4 },
  stepInput: { flex: 1, fontSize: 16, color: TEXT, paddingVertical: 16 },
  eyeBtn: { padding: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingVertical: 16, borderRadius: 14, backgroundColor: PRIMARY, elevation: 4 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: CARD, borderRadius: 28, padding: 28, width: '82%', alignItems: 'center', elevation: 16 },
  alertTitle: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 8, textAlign: 'center' },
  alertMsg: { fontSize: 14, color: SUBTEXT, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  alertBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, backgroundColor: PRIMARY },
  alertBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});