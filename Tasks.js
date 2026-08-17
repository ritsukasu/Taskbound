import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  TextInput, Modal, Animated, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { db, auth } from './firebaseConfig';
import { useTheme } from './ThemeContext';

const dateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const todayStr = () => dateStr(new Date());

const getNextResetDate = (repeat, fromDeadline) => {
  const d = fromDeadline ? new Date(fromDeadline) : new Date();
  if (repeat === 'Daily')   d.setDate(d.getDate() + 1);
  if (repeat === 'Weekly')  d.setDate(d.getDate() + 7);
  if (repeat === 'Monthly') d.setDate(d.getDate() + 30);
  return dateStr(d);
};

const resetOverdueRepeatingTasks = async (uid) => {
  const today = todayStr();
  const now = new Date();
  try {
    const snap = await db.collection('tasks')
      .where('uid', '==', uid)
      .get();
    const batch = db.batch();
    let hasUpdates = false;
    snap.docs.forEach(doc => {
      const data = doc.data();
      if (!data.repeat || data.repeat === 'None') return;
      if (data.nextResetDate && data.nextResetDate <= today) {
        batch.update(doc.ref, {
          status: 'To Do',
          completedDate: null,
          nextResetDate: null,
          updatedAt: new Date().toISOString(),
        });
        hasUpdates = true;
        return;
      }
      if (data.status !== 'Done' && !data.nextResetDate) {
        const d = data.deadline ? new Date(data.deadline) : new Date();
        if (!data.deadline) {
          d.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
        }
        if (data.taskTime) {
          const [h, m] = data.taskTime.split(':');
          d.setHours(parseInt(h), parseInt(m), 0, 0);
        } else {
          d.setHours(23, 59, 59, 999);
        }
        if (d < now) {
          batch.update(doc.ref, {
            nextResetDate: getNextResetDate(data.repeat, data.deadline),
            updatedAt: new Date().toISOString(),
          });
          hasUpdates = true;
        }
      }
    });
    if (hasUpdates) await batch.commit();
  } catch (e) {}
};

const CATEGORY_COLORS = { School: '#4CAF50', Business: '#2196F3', 'Daily Chores': '#FF9800', Health: '#E91E63', Personal: '#9C27B0', Other: '#607D8B' };
const CATEGORIES = ['School', 'Business', 'Daily Chores', 'Health', 'Personal', 'Other'];
const STATUS_OPTIONS = ['To Do', 'Done', 'In Progress', 'Missed', 'No Date'];

function getDeadlineDate(task) {
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
}

function getGroup(task) {
  if (!task.deadline) return 'No Date';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(task.deadline);
  const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((taskDay - today) / (1000 * 60 * 60 * 24));
  const deadlineDateTime = getDeadlineDate(task);

  if (task.status !== 'Done' && deadlineDateTime && deadlineDateTime < now) return 'Missed';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return 'This Week';
  if (diffDays <= 31) return 'This Month';
  return 'Later';
}

const GROUP_ORDER = ['Missed', 'Today', 'Tomorrow', 'This Week', 'This Month', 'Later', 'No Date'];
const getGroupColor = (group, theme) => {
  if (group === 'Missed') return '#E53935';
  return theme.primary;
};

function TaskRow({ item, onDone, onDelete, navigation, theme }) {
  const strikeAnim = useRef(new Animated.Value(item.status === 'Done' ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const done = item.status === 'Done';

  const isMissed = item.status !== 'Done' && (() => {
    const deadlineDateTime = getDeadlineDate(item);
    return deadlineDateTime && deadlineDateTime < new Date();
  })();

  useEffect(() => {
    Animated.timing(strikeAnim, { toValue: done ? 1 : 0, duration: 350, useNativeDriver: false }).start();
  }, [done]);

  const handleDone = () => {
    if (isMissed && item.status !== 'Done') {
      shakeAnim.setValue(0);
      flashAnim.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: false }),
          Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        ]),
      ]).start(() => onDone(item));
      return;
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.06, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => onDone(item));
  };

  const catColor = CATEGORY_COLORS[item.category] || '#aaa';
  const titleWidth = strikeAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const flashBg = flashAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(229,57,53,0)', 'rgba(229,57,53,0.18)'] });

  const formatDateTime = () => {
    const parts = [];
    if (item.deadline) {
      const d = new Date(item.deadline);
      parts.push(`${d.getMonth() + 1}/${d.getDate()}`);
    }
    if (item.taskTime) {
      const [h, m] = item.taskTime.split(':');
      const hour = parseInt(h);
      parts.push(`${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`);
    }
    return parts.join('  ');
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateX: shakeAnim }], marginBottom: 8 }}>
      <Animated.View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: flashBg }}>
      <TouchableOpacity
        style={[styles.card, {
          backgroundColor: isMissed ? '#FFF0F0' : theme.card,
          borderColor: isMissed ? '#FF7779' : done ? theme.primaryLight : theme.border,
          borderWidth: isMissed ? 1.5 : 1,
        }]}
        onPress={() => navigation.navigate('TaskDetail', { item })}
        activeOpacity={0.88}
      >
        <TouchableOpacity onPress={handleDone} style={styles.circleWrap} activeOpacity={0.7}>
          <View style={[styles.circle, done
            ? { backgroundColor: theme.primary, borderColor: theme.primary }
            : isMissed
              ? { borderColor: '#E53935', backgroundColor: 'transparent' }
              : { borderColor: theme.primary, backgroundColor: 'transparent' }
          ]}>
            {done && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <View style={{ position: 'relative', flexShrink: 1 }}>
              <Text style={[styles.title, { color: isMissed ? '#E53935' : theme.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Animated.View style={[styles.strikeBar, { width: titleWidth, backgroundColor: theme.primaryDark }]} />
            </View>
            {item.repeat && item.repeat !== 'None' && (
              <Ionicons name="repeat" size={13} color={theme.primary} />
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.catPill, { backgroundColor: catColor + '20' }]}>
              <Text style={[styles.catText, { color: catColor }]}>{item.category}</Text>
            </View>
            {isMissed && (
              <View style={styles.missedBadge}>
                <Text style={styles.missedBadgeText}>Missed</Text>
              </View>
            )}
            {!isMissed && (
              <View style={[styles.statusPill, {
                backgroundColor: done ? theme.primaryLight : item.status === 'In Progress' ? '#FFF4E5' : '#EBF2FF',
              }]}>
                <Text style={[styles.statusPillText, {
                  color: done ? theme.primaryDark : item.status === 'In Progress' ? '#E67E00' : '#1A6FD4',
                }]}>
                  {done ? 'Done' : item.status}
                </Text>
              </View>
            )}
            {formatDateTime() ? (
              <View style={[styles.timePill, { backgroundColor: isMissed ? '#FFEBEE' : theme.primaryLight }]}>
                <Ionicons name="time-outline" size={11} color={isMissed ? '#E53935' : theme.primaryDark} style={{ marginRight: 3 }} />
                <Text style={[styles.timeText, { color: isMissed ? '#E53935' : theme.primaryDark }]}>
                  {formatDateTime()}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={17} color="#E53935" />
        </TouchableOpacity>
      </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function Tasks({ navigation, route }) {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const alertScale = useRef(new Animated.Value(0.85)).current;
  const user = auth.currentUser;

  const toggleFilter = () => {
    const toValue = filterOpen ? 0 : 1;
    setFilterOpen(!filterOpen);
    Animated.spring(filterAnim, { toValue, useNativeDriver: false, tension: 120, friction: 10 }).start();
  };

  const toggleStatus = (st) => {
    setSelectedStatuses(prev =>
      prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]
    );
  };

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const activeFilterCount = selectedStatuses.length + selectedCategories.length;

  useEffect(() => {
    if (!user) return;
    const unsub = db.collection('tasks')
      .where('uid', '==', user.uid)
      .onSnapshot(snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => {
          const aDate = a.deadline || '9999';
          const bDate = b.deadline || '9999';
          return aDate.localeCompare(bDate);
        });
        setTasks(docs);
        setLoading(false);
      }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) resetOverdueRepeatingTasks(user.uid);
      const incoming = route?.params?.statusFilter;
      if (incoming && STATUS_OPTIONS.includes(incoming)) {
        setSelectedStatuses([incoming]);
        navigation.setParams({ statusFilter: undefined });
      }
      return () => {
        setSelectedStatuses([]);
        setSelectedCategories([]);
        setSearch('');
        setFilterOpen(false);
        filterAnim.setValue(0);
      };
    }, [user, route?.params?.statusFilter])
  );

  const markDone = async (item) => {
    if (item.status === 'Done') {
      try {
        await db.collection('tasks').doc(item.id).update({
          status: 'To Do', completedDate: null, nextResetDate: null, updatedAt: new Date().toISOString(),
        });
      } catch (e) {}
      return;
    }
    const update = { status: 'Done', updatedAt: new Date().toISOString() };
    if (item.repeat && item.repeat !== 'None') {
      update.completedDate = todayStr();
      update.nextResetDate = getNextResetDate(item.repeat, item.deadline);
    }
    try {
      await db.collection('tasks').doc(item.id).update(update);
    } catch (e) {}
  };

  const confirmDelete = (id) => {
    setPendingDeleteId(id);
    alertScale.setValue(0.85);
    setAlertVisible(true);
    Animated.spring(alertScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
  };

  const doDelete = async () => {
    const id = pendingDeleteId;
    Animated.timing(alertScale, { toValue: 0.85, duration: 130, useNativeDriver: true }).start(async () => {
      setAlertVisible(false);
      setPendingDeleteId(null);
      if (id) { try { await db.collection('tasks').doc(id).delete(); } catch (e) {} }
    });
  };

  const cancelDelete = () => {
    Animated.timing(alertScale, { toValue: 0.85, duration: 130, useNativeDriver: true }).start(() => {
      setAlertVisible(false);
      setPendingDeleteId(null);
    });
  };

  const filtered = tasks.filter(t => {
    const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(t.category);

    const deadlineDateTime = getDeadlineDate(t);
    const isMissed = t.status !== 'Done' && deadlineDateTime && deadlineDateTime < new Date();
    const hasNoDate = !t.deadline;

    if (selectedStatuses.length === 0) return matchSearch && matchCategory;

    const matchStatus = selectedStatuses.some(st => {
      if (st === 'Missed') return isMissed;
      if (st === 'No Date') return hasNoDate;
      return t.status === st && !isMissed;
    });

    return matchSearch && matchCategory && matchStatus;
  });

  const grouped = GROUP_ORDER.reduce((acc, g) => {
    const items = filtered.filter(t => getGroup(t) === g);
    if (items.length > 0) acc.push({ title: g, data: items });
    return acc;
  }, []);

  const filterPanelHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 148],
  });
  const filterPanelOpacity = filterAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>My Tasks</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('TaskForm', {})}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
        <TextInput
          style={[s.searchInput, { color: theme.text }]}
          placeholder="Search tasks..."
          placeholderTextColor={theme.subtext}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.subtext} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[s.filterBtn, filterOpen && { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
          onPress={toggleFilter}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={17} color={filterOpen ? theme.primary : theme.subtext} />
          {activeFilterCount > 0 && (
            <View style={[s.filterBadge, { backgroundColor: theme.primary }]}>
              <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Animated.View style={[s.filterPanel, { height: filterPanelHeight, opacity: filterPanelOpacity, borderColor: theme.border }]}>
        <View style={s.filterPanelInner}>
          <View style={s.filterCol}>
            {[['To Do', 'Done'], ['In Progress'], ['Missed', 'No Date']].map((row, ri) => (
              <View key={ri} style={s.pillRow}>
                {row.map(st => {
                  const isActive = selectedStatuses.includes(st);
                  const isMissedPill = st === 'Missed';
                  const activeColor = isMissedPill ? '#E53935' : theme.primary;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[s.pill, { borderColor: isActive ? activeColor : theme.border, backgroundColor: isActive ? activeColor + '18' : theme.card, ...(st === 'In Progress' && { width: 105 }) }]}
                      onPress={() => toggleStatus(st)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.pillText, { color: isActive ? activeColor : theme.subtext }]} numberOfLines={1}>{st}</Text>
                      {isActive && <Ionicons name="close" size={10} color={activeColor} style={{ marginLeft: 2 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={[s.filterDivider, { backgroundColor: theme.border }]} />

          <View style={s.filterColCat}>
            {[['School', 'Business'], ['Daily Chores'], ['Health', 'Personal'], ['Other']].map((row, ri) => (
              <View key={ri} style={s.pillRow}>
                {row.map(cat => {
                  const isActive = selectedCategories.includes(cat);
                  const dotColor = CATEGORY_COLORS[cat];
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[s.pillCat, { borderColor: isActive ? dotColor : theme.border, backgroundColor: isActive ? dotColor + '18' : theme.card, ...(cat === 'Daily Chores' && { width: 105 }) }]}
                      onPress={() => toggleCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.pillDot, { backgroundColor: dotColor }]} />
                      <Text style={[s.pillText, { color: isActive ? dotColor : theme.subtext }]} numberOfLines={1}>{cat}</Text>
                      {isActive && <Ionicons name="close" size={10} color={dotColor} style={{ marginLeft: 2 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <SectionList
          sections={grouped}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section: { title, data } }) => (
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: getGroupColor(title, theme) }]} />
              <Text style={[s.sectionTitle, { color: getGroupColor(title, theme) }]}>
                {title}{title === 'Missed' ? ` (${data.length})` : ''}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TaskRow item={item} onDone={markDone} onDelete={confirmDelete} navigation={navigation} theme={theme} />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="folder-open-outline" size={52} color={theme.border} />
              <Text style={s.emptyText}>No tasks found.</Text>
              <TouchableOpacity style={[s.emptyBtn, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('TaskForm', {})}>
                <Text style={s.emptyBtnText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal transparent visible={alertVisible} animationType="none">
        <View style={s.overlay}>
          <Animated.View style={[s.alertBox, { transform: [{ scale: alertScale }] }]}>
            <View style={s.alertIconWrap}>
              <Ionicons name="trash-outline" size={30} color="#E53935" />
            </View>
            <Text style={s.alertTitle}>Delete Task</Text>
            <Text style={s.alertMsg}>This action cannot be undone.</Text>
            <View style={s.alertBtns}>
              <TouchableOpacity style={[s.alertBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={cancelDelete}>
                <Text style={[s.alertBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.alertBtn, { backgroundColor: '#E53935', borderColor: '#E53935' }]} onPress={doDelete}>
                <Text style={[s.alertBtnText, { color: '#fff' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, elevation: 2 },
  circleWrap: { marginRight: 12 },
  circle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  title: { fontSize: 15, fontWeight: '600' },
  strikeBar: { position: 'absolute', top: '50%', height: 2, borderRadius: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  catPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  catText: { fontSize: 11, fontWeight: '700' },
  timePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  timeText: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 6, marginLeft: 4 },
  statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  missedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53935', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  missedBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 14, backgroundColor: theme.headerBg },
  headerTitle: { fontSize: 24, fontWeight: '800', color: theme.primaryDark },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 6, backgroundColor: theme.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: theme.border },
  searchInput: { flex: 1, fontSize: 14 },
  filterBtn: { marginLeft: 8, padding: 6, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', position: 'relative' },
  filterBadge: { position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  filterPanel: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  filterPanelInner: { flexDirection: 'row', padding: 8, gap: 0, alignItems: 'flex-start' },
  filterCol: { gap: 5 },
  filterColCat: { gap: 5 },
  filterDivider: { width: 1, alignSelf: 'stretch', marginHorizontal: 8 },
  pillRow: { flexDirection: 'row', gap: 5 },
  pill: { width: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 5, borderRadius: 20, borderWidth: 1.5 },
  pillCat: { width: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 5, borderRadius: 20, borderWidth: 1.5 },
  pillFixed: { width: 72 },
  pillDot: { width: 6, height: 6, borderRadius: 3, marginRight: 3 },
  pillText: { fontSize: 10, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingTop: 16 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: theme.subtext, marginBottom: 16, marginTop: 14 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: theme.card, borderRadius: 28, padding: 28, width: '82%', alignItems: 'center', elevation: 16 },
  alertIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 8 },
  alertMsg: { fontSize: 14, color: theme.subtext, textAlign: 'center', marginBottom: 24 },
  alertBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  alertBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  alertBtnText: { fontWeight: '700', fontSize: 15 },
});