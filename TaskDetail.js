import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { db } from './firebaseConfig';
import { useTheme } from './ThemeContext';
import FocusTimer from './FocusTimer';

const CATEGORY_COLORS = { Work: '#4CAF50', Personal: '#2196F3', Health: '#E91E63', Study: '#FF9800', Other: '#9C27B0' };
const STATUS_COLOR = { 'Done': '#2E7D32', 'In Progress': '#F57C00', 'To Do': '#1565C0' };
const STATUS_BG = { 'Done': '#E8F5E9', 'In Progress': '#FFF3E0', 'To Do': '#E3F2FD' };
const REPEAT_LABEL = { None: null, Daily: 'Daily', Weekly: 'Weekly', Monthly: 'Monthly' };

const dateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const todayStr = () => dateStr(new Date());

const getNextResetDate = (repeat) => {
  const d = new Date();
  if (repeat === 'Daily')   d.setDate(d.getDate() + 1);
  if (repeat === 'Weekly')  d.setDate(d.getDate() + 7);
  if (repeat === 'Monthly') d.setDate(d.getDate() + 30);
  return dateStr(d);
};

export default function TaskDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { item } = route.params;
  const [task, setTask] = useState(item);
  const [alertVisible, setAlertVisible] = useState(false);
  const alertScale = useRef(new Animated.Value(0.85)).current;
  const taskIdRef = useRef(task.id);

  useFocusEffect(
    useCallback(() => {
      const fetchTask = async () => {
        const doc = await db.collection('tasks').doc(taskIdRef.current).get();
        if (doc.exists) setTask({ id: doc.id, ...doc.data() });
      };
      fetchTask();
    }, [])
  );

  const showDeleteAlert = () => {
    alertScale.setValue(0.85);
    setAlertVisible(true);
    Animated.spring(alertScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
  };

  const doDelete = async () => {
    Animated.timing(alertScale, { toValue: 0.85, duration: 130, useNativeDriver: true }).start(async () => {
      setAlertVisible(false);
      await db.collection('tasks').doc(task.id).delete();
      navigation.goBack();
    });
  };

  const cancelDelete = () => {
    Animated.timing(alertScale, { toValue: 0.85, duration: 130, useNativeDriver: true }).start(() => setAlertVisible(false));
  };

  const cycleStatus = async () => {
    const next = task.status === 'To Do' ? 'In Progress' : task.status === 'In Progress' ? 'Done' : 'To Do';
    const update = { status: next, updatedAt: new Date().toISOString() };
    if (next === 'Done' && task.repeat && task.repeat !== 'None') {
      update.completedDate = todayStr();
      update.nextResetDate = getNextResetDate(task.repeat);
    }
    if (next === 'To Do') {
      update.completedDate = null;
      update.nextResetDate = null;
    }
    await db.collection('tasks').doc(task.id).update(update);
    setTask({ ...task, ...update });
  };

  const isOverdue = task.deadline && task.status !== 'Done' && new Date(task.deadline) < new Date();

  const formatTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const s = makeStyles(theme);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.hero, { backgroundColor: CATEGORY_COLORS[task.category] || theme.primary }]}>
          <Text style={s.heroCategory}>{task.category || 'Task'}</Text>
          <Text style={s.heroTitle}>{task.title}</Text>
          {isOverdue && (
            <View style={s.overdueBadge}>
              <Ionicons name="alert-circle" size={13} color="#fff" />
              <Text style={s.overdueText}> Overdue</Text>
            </View>
          )}
        </View>

        <View style={s.body}>
          <View style={s.badgeRow}>
            <TouchableOpacity style={[s.badge, { backgroundColor: STATUS_BG[task.status] }]} onPress={cycleStatus}>
              <Ionicons name="ellipse" size={8} color={STATUS_COLOR[task.status]} style={{ marginRight: 5 }} />
              <Text style={[s.badgeText, { color: STATUS_COLOR[task.status] }]}>{task.status}</Text>
              <Text style={[s.badgeText, { color: STATUS_COLOR[task.status], fontSize: 10, marginLeft: 4 }]}>(tap to cycle)</Text>
            </TouchableOpacity>

            {task.repeat && task.repeat !== 'None' && (
              <View style={[s.badge, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="repeat" size={12} color={theme.primary} style={{ marginRight: 5 }} />
                <Text style={[s.badgeText, { color: theme.primary }]}>{REPEAT_LABEL[task.repeat]}</Text>
              </View>
            )}
          </View>

          <View style={s.section}>
            <Text style={s.sectionLabel}>Description</Text>
            <Text style={s.sectionContent}>{task.description || 'No description provided.'}</Text>
          </View>

          <View style={s.infoGrid}>
            <InfoCell theme={theme} icon="calendar-outline" label="Deadline" value={task.deadline || 'Not set'} warn={isOverdue} />
            {task.taskTime && <InfoCell theme={theme} icon="time-outline" label="Time" value={formatTime(task.taskTime)} />}
            <InfoCell theme={theme} icon="pricetag-outline" label="Category" value={task.category || 'Other'} />
            <InfoCell theme={theme} icon="trending-up-outline" label="Created" value={task.createdAt ? task.createdAt.slice(0, 10) : '—'} />
          </View>

          <View style={s.timerWrapper}>
            <FocusTimer theme={theme} />
          </View>

          <View style={s.actionRow}>
            <TouchableOpacity style={[s.editBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]} onPress={() => navigation.navigate('TaskForm', { item: task })}>
              <Ionicons name="create-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[s.editBtnText, { color: theme.primary }]}>Edit Task</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.deleteBtn} onPress={showDeleteAlert}>
              <Ionicons name="trash-outline" size={18} color="#FF7779" style={{ marginRight: 6 }} />
              <Text style={s.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal transparent visible={alertVisible} animationType="none">
          <View style={s.overlay}>
            <Animated.View style={[s.alertBox, { transform: [{ scale: alertScale }] }]}>
              <View style={s.alertIconWrap}>
                <Ionicons name="trash-outline" size={30} color="#FF7779" />
              </View>
              <Text style={s.alertTitle}>Delete Task</Text>
              <Text style={s.alertMsg}>This action cannot be undone.</Text>
              <View style={s.alertBtns}>
                <TouchableOpacity style={[s.alertBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={cancelDelete}>
                  <Text style={[s.alertBtnText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.alertBtn, { backgroundColor: '#FF7779', borderColor: '#FF7779' }]} onPress={doDelete}>
                  <Text style={[s.alertBtnText, { color: '#fff' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoCell({ theme, icon, label, value, warn }) {
  return (
    <View style={[styles.infoCell, { backgroundColor: theme.card }]}>
      <Ionicons name={icon} size={16} color={warn ? '#FF7779' : theme.primary} style={{ marginBottom: 4 }} />
      <Text style={[styles.infoCellLabel, { color: theme.subtext }]}>{label}</Text>
      <Text style={[styles.infoCellValue, { color: warn ? '#FF7779' : theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoCell: { borderRadius: 14, padding: 14, flex: 1, minWidth: '44%', elevation: 2 },
  infoCellLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoCellValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
});

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  timerWrapper: { marginBottom: 14 },
  hero: { padding: 28, paddingTop: 20, paddingBottom: 32 },
  heroCategory: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', lineHeight: 30 },
  overdueBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 10 },
  overdueText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { padding: 20, marginTop: -16, backgroundColor: theme.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  section: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: theme.subtext, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  sectionContent: { fontSize: 15, color: theme.text, lineHeight: 22 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  editBtnText: { fontWeight: '700', fontSize: 15 },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0F0', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#FFBCBD' },
  deleteBtnText: { color: '#FF7779', fontWeight: '700', fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: theme.card, borderRadius: 28, padding: 28, width: '82%', alignItems: 'center', elevation: 16 },
  alertIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 8 },
  alertMsg: { fontSize: 14, color: theme.subtext, textAlign: 'center', marginBottom: 24 },
  alertBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  alertBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  alertBtnText: { fontWeight: '700', fontSize: 15 },
});