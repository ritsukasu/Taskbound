import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { db, auth } from './firebaseConfig';
import { useTheme } from './ThemeContext';

const CATEGORY_COLORS = {
  School: '#4CAF50', Business: '#2196F3', 'Daily Chores': '#FF9800',
  Health: '#E91E63', Personal: '#9C27B0', Other: '#607D8B',
};

const getDeadlineDate = (task) => {
  const isRepeating = task.repeat && task.repeat !== 'None';
  if (!task.deadline && !isRepeating) return null;
  const d = task.deadline ? new Date(task.deadline) : new Date();
  if (!task.deadline) {
    const now = new Date();
    d.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (task.taskTime) {
    const [h, m] = task.taskTime.split(':');
    d.setHours(parseInt(h), parseInt(m), 0, 0);
  } else {
    d.setHours(23, 59, 59, 999);
  }
  return d;
};

const dateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayStr = () => dateStr(new Date());

const resetOverdueRepeatingTasks = async (uid) => {
  const today = todayStr();
  const now = new Date();
  try {
    const snap = await db.collection('tasks').where('uid', '==', uid).get();
    const batch = db.batch();
    let hasUpdates = false;
    snap.docs.forEach(doc => {
      const data = doc.data();
      if (!data.repeat || data.repeat === 'None') return;
      if (data.nextResetDate && data.nextResetDate <= today) {
        batch.update(doc.ref, { status: 'To Do', completedDate: null, nextResetDate: null, updatedAt: new Date().toISOString() });
        hasUpdates = true;
        return;
      }
      if (data.status !== 'Done' && !data.nextResetDate) {
        const d = data.deadline ? new Date(data.deadline) : new Date();
        if (!data.deadline) d.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
        if (data.taskTime) { const [h, m] = data.taskTime.split(':'); d.setHours(parseInt(h), parseInt(m), 0, 0); } else { d.setHours(23, 59, 59, 999); }
        if (d < now) {
          const next = data.deadline ? new Date(data.deadline) : new Date();
          if (data.repeat === 'Daily') next.setDate(next.getDate() + 1);
          else if (data.repeat === 'Weekly') next.setDate(next.getDate() + 7);
          else if (data.repeat === 'Monthly') next.setDate(next.getDate() + 30);
          const nrs = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
          batch.update(doc.ref, { nextResetDate: nrs, updatedAt: new Date().toISOString() });
          hasUpdates = true;
        }
      }
    });
    if (hasUpdates) await batch.commit();
  } catch (e) {}
};

function StatCard({ label, value, icon, accentColor, darkBg, delay }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 150, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
      <View style={[statStyle.card, { backgroundColor: darkBg }]}>
        <View style={[statStyle.iconWrap, { backgroundColor: accentColor + '25' }]}>
          <Ionicons name={icon} size={16} color={accentColor} />
        </View>
        <Text style={[statStyle.value, { color: accentColor }]}>{value}</Text>
        <Text style={statStyle.label} numberOfLines={1}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const statStyle = StyleSheet.create({
  card: { borderRadius: 14, padding: 10, alignItems: 'center', gap: 4 },
  iconWrap: { width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  value: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  label: { fontSize: 9, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.2 },
});

export default function Dashboard({ navigation }) {
  const { theme } = useTheme();
  const isDark = theme.name === 'dark';
  const [tasks, setTasks] = useState([]);
  const [userName, setUserName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(true);
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;
  const user = auth.currentUser;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists) { setUserName(doc.data().name || 'User'); setPhotoURL(doc.data().photoURL || ''); }
      });
      resetOverdueRepeatingTasks(user.uid);
    }, [user])
  );

  useEffect(() => {
    if (!user) return;
    const unsub = db.collection('tasks').where('uid', '==', user.uid).onSnapshot(snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setTasks(docs);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'Done').length;
  const inProgress = tasks.filter(t => {
    if (t.status !== 'In Progress') return false;
    const d = getDeadlineDate(t);
    return !(d && d < new Date());
  }).length;
  const todo = tasks.filter(t => {
    if (t.status !== 'To Do') return false;
    const d = getDeadlineDate(t);
    return !(d && d < new Date());
  }).length;
  const missed = tasks.filter(t => {
    if (t.status === 'Done') return false;
    const d = getDeadlineDate(t);
    return d && d < new Date();
  }).length;

  const recent = tasks.slice(0, 5);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const getStatusColor = (s) => ({ 'Done': '#2E7D32', 'In Progress': '#F57C00', 'To Do': '#1565C0' }[s] || '#aaa');
  const getStatusBg = (s) => ({
    'Done': isDark ? '#1A2E1A' : '#E8F5E9',
    'In Progress': isDark ? '#2E1F00' : '#FFF3E0',
    'To Do': isDark ? '#0D1A2E' : '#E3F2FD',
  }[s] || (isDark ? '#1a1a1a' : '#f5f5f5'));

  const statCards = [
    { label: 'Total', value: total, icon: 'layers-outline', accentColor: theme.primaryDark, darkBg: isDark ? '#1C2B1C' : '#EBF5EB', delay: 0 },
    { label: 'To Do', value: todo, icon: 'time-outline', accentColor: '#1A6FD4', darkBg: isDark ? '#0D1A2E' : '#EBF2FF', delay: 60 },
    { label: 'Doing', value: inProgress, icon: 'sync-outline', accentColor: '#E67E00', darkBg: isDark ? '#2E1A00' : '#FFF4E5', delay: 120 },
    { label: 'Done', value: done, icon: 'checkmark-done-outline', accentColor: theme.primary, darkBg: isDark ? '#1C2B1C' : '#EBF5EB', delay: 180 },
    { label: 'Missed', value: missed, icon: 'alert-circle-outline', accentColor: '#EF4444', darkBg: isDark ? '#2A1010' : '#FEE2E2', delay: 240 },
  ];

  const s = makeStyles(theme);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[s.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={s.avatarWrap}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={s.avatar} />
            ) : (
              <View style={[s.avatarPlaceholder, { backgroundColor: theme.primaryLight }]}>
                <Text style={[s.avatarInitial, { color: theme.primaryDark }]}>
                  {(userName || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View>
            <Text style={s.greeting}>{greeting}</Text>
            <Text style={s.userName}>{userName || 'User'}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('TaskForm', {})}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <View style={s.statsGrid}>
        {statCards.map(card => <StatCard key={card.label} {...card} />)}
      </View>

      <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={s.sectionTitle}>Recent Tasks</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks', {})}>
            <Text style={[s.seeAll, { color: theme.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
        ) : recent.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 36 }}>
            <Ionicons name="clipboard-outline" size={36} color={theme.border} />
            <Text style={{ color: theme.subtext, fontSize: 13, marginTop: 8 }}>No tasks yet. Tap + to add one!</Text>
          </View>
        ) : (
          recent.map((item) => {
            const isMissed = (() => {
              if (item.status === 'Done') return false;
              const d = getDeadlineDate(item);
              return d && d < new Date();
            })();
            return (
              <TouchableOpacity
                key={item.id}
                style={[s.taskCard, isMissed && { backgroundColor: isDark ? '#2A1010' : '#FFF0F0', borderColor: '#FF7779', borderWidth: 1.5 }]}
                onPress={() => navigation.navigate('TaskDetail', { item })}
              >
                <View style={[s.catDot, { backgroundColor: CATEGORY_COLORS[item.category] || '#aaa' }]} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[s.taskTitle, { color: isMissed ? '#E53935' : theme.text }, item.status === 'Done' && { textDecorationLine: 'line-through', color: theme.subtext }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={[s.taskMeta, { color: theme.subtext }]}>{item.category}{item.deadline ? ` · ${item.deadline}` : ''}</Text>
                </View>
                {isMissed ? (
                  <View style={s.missedBadge}>
                    <Text style={s.missedBadgeText}>Missed</Text>
                  </View>
                ) : (
                  <View style={[s.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                    <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 54, paddingBottom: 16, backgroundColor: theme.headerBg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 12, color: theme.subtext },
  userName: { fontSize: 20, fontWeight: '800', color: theme.primaryDark, marginTop: 1 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  avatarWrap: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: theme.primary },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 16, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.primaryDark },
  seeAll: { fontSize: 12, fontWeight: '600' },
  taskCard: { backgroundColor: theme.card, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1, borderWidth: 1, borderColor: theme.border },
  catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  taskTitle: { fontSize: 14, fontWeight: '600' },
  taskMeta: { fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16 },
  statusText: { fontSize: 10, fontWeight: '700' },
  missedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53935', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  missedBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});