import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Modal, Dimensions, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Svg, { Circle } from 'react-native-svg';

const { width: SW } = Dimensions.get('window');
const RING = SW * 0.72;
const RADIUS = (RING - 20) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const UNITS = ['sec', 'min', 'hr'];
const toSeconds = (val, unit) => unit === 'sec' ? val : unit === 'min' ? val * 60 : val * 3600;

const formatDisplay = (secs, hasTotal) => {
  if (!hasTotal) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

export default function FocusTimer({ theme }) {
  const [inputVal, setInputVal] = useState('');
  const [unit, setUnit] = useState('min');
  const [total, setTotal] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);

  const intervalRef = useRef(null);
  const soundRef = useRef(null);
  const totalRef = useRef(null);
  const secondsLeftRef = useRef(0);
  const alarmFiredRef = useRef(false);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
    };
  }, []);

  const updateDuration = useCallback((val, u) => {
    if (running || paused) return;
    const parsed = parseInt(val);
    if (!parsed || parsed < 1) {
      totalRef.current = null;
      setTotal(null);
      secondsLeftRef.current = 0;
      setSecondsLeft(0);
      setDone(false);
      return;
    }
    const activeUnit = u || unit;
    const secs = toSeconds(parsed, activeUnit);
    totalRef.current = secs;
    setTotal(secs);
    secondsLeftRef.current = secs;
    setSecondsLeft(secs);
    setDone(false);
  }, [running, paused, unit]);

  const handleInputChange = (v) => {
    const clean = v.replace(/[^0-9]/g, '');
    setInputVal(clean);
    updateDuration(clean, unit);
  };

  const handleUnitChange = (u) => {
    if (running || paused) return;
    setUnit(u);
    updateDuration(inputVal, u);
  };

  const loadSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/focus-mode-alarm.mp3'),
        { isLooping: true, volume: 1.0, shouldPlay: false }
      );
      soundRef.current = sound;
    } catch (e) {}
  }, []);

  const playAlarm = useCallback(async () => {
    if (alarmFiredRef.current) return;
    alarmFiredRef.current = true;
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      } else {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          require('./assets/focus-mode-alarm.mp3'),
          { isLooping: true, volume: 1.0, shouldPlay: true }
        );
        soundRef.current = sound;
      }
    } catch (e) {}
  }, []);

  const stopAlarm = useCallback(async () => {
    alarmFiredRef.current = false;
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch (_) {}
      try { await soundRef.current.unloadAsync(); } catch (_) {}
      soundRef.current = null;
    }
  }, []);

  const clearTick = () => clearInterval(intervalRef.current);

  const startTick = useCallback((endTime) => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const remaining = Math.round((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        secondsLeftRef.current = 0;
        setSecondsLeft(0);
        setRunning(false);
        setDone(true);
        playAlarm();
        return;
      }
      secondsLeftRef.current = remaining;
      setSecondsLeft(remaining);
    }, 200);
  }, [playAlarm]);

  const start = async () => {
    Keyboard.dismiss();
    if (done || totalRef.current === null) return;
    alarmFiredRef.current = false;
    await loadSound();
    const endTime = Date.now() + secondsLeftRef.current * 1000;
    setRunning(true);
    setPaused(false);
    startTick(endTime);
  };

  const pause = () => {
    clearTick();
    setRunning(false);
    setPaused(true);
  };

  const resume = async () => {
    await loadSound();
    const endTime = Date.now() + secondsLeftRef.current * 1000;
    setRunning(true);
    setPaused(false);
    startTick(endTime);
  };

  const reset = async () => {
    clearTick();
    await stopAlarm();
    const t = totalRef.current || 0;
    secondsLeftRef.current = t;
    setSecondsLeft(t);
    setDone(false);
    await loadSound();
    const endTime = Date.now() + t * 1000;
    setRunning(true);
    setPaused(false);
    startTick(endTime);
  };

  const stop = async () => {
    clearTick();
    await stopAlarm();
    setRunning(false);
    setPaused(false);
    setDone(false);
    const t = totalRef.current || 0;
    secondsLeftRef.current = t;
    setSecondsLeft(t);
  };

  const progress = total && total > 0 ? Math.max(0, Math.min(1, secondsLeft / total)) : 1;
  const strokeOffset = CIRC * (1 - progress);
  const displayTime = formatDisplay(secondsLeft, totalRef.current !== null);
  const arcColor = done ? theme.primaryDark : theme.primary;
  const showModal = running || paused || done;

  return (
    <>
      <Modal visible={showModal} transparent={false} animationType="fade" statusBarTranslucent>
        <View style={[ms.screen, { backgroundColor: theme.bg }]}>
          <Text style={[ms.label, { color: theme.subtext }]}>FOCUS MODE</Text>
          <View style={ms.ringWrap}>
            <Svg width={RING} height={RING}>
              <Circle cx={RING/2} cy={RING/2} r={RADIUS} stroke={theme.inputBg} strokeWidth={10} fill="none" />
              <Circle
                cx={RING/2} cy={RING/2} r={RADIUS}
                stroke={arcColor} strokeWidth={10} fill="none"
                strokeDasharray={CIRC}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${RING/2}, ${RING/2}`}
              />
            </Svg>
            <View style={ms.ringInner}>
              <Text style={[ms.time, { color: done ? theme.primaryDark : theme.text }]}>{displayTime}</Text>
              {done && <Text style={[ms.doneText, { color: theme.primaryDark }]}>Complete!</Text>}
              {paused && !done && <Text style={[ms.statusText, { color: theme.subtext }]}>Paused</Text>}
            </View>
          </View>
          <View style={ms.btnRow}>
            {running && (
              <TouchableOpacity style={[ms.circBtn, { backgroundColor: theme.card }]} onPress={pause}>
                <Ionicons name="pause" size={26} color={theme.primary} />
                <Text style={[ms.circBtnText, { color: theme.subtext }]}>Pause</Text>
              </TouchableOpacity>
            )}
            {paused && !done && (
              <TouchableOpacity style={[ms.circBtn, { backgroundColor: theme.card }]} onPress={resume}>
                <Ionicons name="play" size={26} color={theme.primary} />
                <Text style={[ms.circBtnText, { color: theme.subtext }]}>Resume</Text>
              </TouchableOpacity>
            )}
            {(running || paused) && !done && (
              <TouchableOpacity style={[ms.circBtn, { backgroundColor: theme.card }]} onPress={reset}>
                <Ionicons name="refresh" size={26} color={theme.subtext} />
                <Text style={[ms.circBtnText, { color: theme.subtext }]}>Reset</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[ms.circBtn, { backgroundColor: theme.card }]} onPress={stop}>
              <Ionicons name="stop" size={26} color="#FF7779" />
              <Text style={[ms.circBtnText, { color: theme.subtext }]}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={[s.card, { backgroundColor: theme.card }]}>
        <View style={s.titleRow}>
          <Ionicons name="timer-outline" size={14} color={theme.subtext} />
          <Text style={[s.title, { color: theme.text }]}>Focus Mode Timer</Text>
        </View>

        <View style={s.mainRow}>
          <View style={[s.clockRing, { borderColor: done ? theme.primaryDark : theme.subtext }]}>
            <Text
              style={[s.clockText, { color: done ? theme.primaryDark : theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {displayTime}
            </Text>
          </View>

          <View style={s.rightCol}>
            <View style={s.inputRow}>
              <TextInput
                style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                value={inputVal}
                onChangeText={handleInputChange}
                keyboardType="numeric"
                maxLength={4}
                editable={!running && !paused}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                placeholder="0"
                placeholderTextColor={theme.subtext}
              />
              <View style={[s.unitSelector, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                {UNITS.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[s.unitBtn, u === unit && { backgroundColor: theme.primary }]}
                    onPress={() => handleUnitChange(u)}
                    disabled={running || paused}
                  >
                    <Text style={[s.unitBtnText, { color: u === unit ? '#fff' : theme.subtext }]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {!running && !paused && !done && (
              <TouchableOpacity
                style={[s.btn, { backgroundColor: total === null ? (theme.name === 'dark' ? '#2A2A2A' : theme.primaryLight) : theme.name === 'dark' ? theme.primary : theme.primaryDark }]}
                onPress={start}
                disabled={total === null}
              >
                <Ionicons name="play" size={14} color={total === null ? theme.subtext : '#fff'} />
                <Text style={[s.btnText, { color: total === null ? theme.subtext : '#fff' }]}>Start</Text>
              </TouchableOpacity>
            )}
            {(paused || done) && (
              <TouchableOpacity style={[s.btn, s.ghostBtn, { borderColor: theme.border, backgroundColor: theme.inputBg }]} onPress={stop}>
                <Ionicons name="stop" size={14} color={theme.subtext} />
                <Text style={[s.btnText, { color: theme.subtext }]}>Stop</Text>
              </TouchableOpacity>
            )}
            {done && <Text style={[s.doneLabel, { color: theme.primaryDark }]}>Session complete!</Text>}
          </View>
        </View>
      </View>
    </>
  );
}

const ms = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 40 },
  label: { fontSize: 13, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase' },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringInner: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 48, fontWeight: '800', letterSpacing: 2 },
  doneText: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  statusText: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 20, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 24 },
  circBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', gap: 4 },
  circBtnText: { fontSize: 11, fontWeight: '700' },
});

const s = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, marginBottom: 14, elevation: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  title: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clockRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  clockText: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  rightCol: { flex: 1, gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'stretch', gap: 6, height: 40 },
  input: { width: 56, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 0, fontSize: 17, fontWeight: '700', textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false },
  unitSelector: { flex: 1, flexDirection: 'row', borderRadius: 10, borderWidth: 1.5, overflow: 'hidden' },
  unitBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  unitBtnText: { fontSize: 11, fontWeight: '700' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 12 },
  ghostBtn: { borderWidth: 1.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  doneLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});