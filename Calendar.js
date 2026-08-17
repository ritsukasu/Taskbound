import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from './firebaseConfig';
import { useTheme } from './ThemeContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const CATEGORY_COLORS = {
  Work: '#3B82F6',
  Personal: '#8B5CF6',
  Health: '#EC4899',
  Study: '#F59E0B',
  Other: '#6B7280',
};

const fmtDate = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

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

export default function CalendarScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const user = auth.currentUser;

  const [sortOrder, setSortOrder] = useState('asc');

  const todayStr = fmtDate(now.getFullYear(), now.getMonth(), now.getDate());

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const prevMonthRef = useRef(prevMonth);
  const nextMonthRef = useRef(nextMonth);
  useEffect(() => { prevMonthRef.current = prevMonth; });
  useEffect(() => { nextMonthRef.current = nextMonth; });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) nextMonthRef.current();
        else if (g.dx > 40) prevMonthRef.current();
      },
    })
  ).current;

  useFocusEffect(
    useCallback(() => {
      const incoming = route?.params?.sortOrder;
      if (incoming === 'asc' || incoming === 'desc') {
        setSortOrder(incoming);
        navigation.setParams({ sortOrder: undefined });
      }
      return () => {
        const n = new Date();
        setViewYear(n.getFullYear());
        setViewMonth(n.getMonth());
        setSelectedDate(null);
      };
    }, [route?.params?.sortOrder])
  );

  useEffect(() => {
    if (!user) return;
    const unsub = db
      .collection('tasks')
      .where('uid', '==', user.uid)
      .onSnapshot(
        (snap) => {
          setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        () => setLoading(false)
      );
    return () => unsub();
  }, [user]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const tasksByDate = tasks.reduce((acc, t) => {
    if (!t.deadline && !(t.repeat && t.repeat !== 'None')) return acc;

    const addToDate = (dateKey) => {
      acc[dateKey] = acc[dateKey] || [];
      if (!acc[dateKey].find(x => x.id === t.id)) acc[dateKey].push(t);
    };

    const monthStart = new Date(viewYear, viewMonth, 1);
    const monthEnd = new Date(viewYear, viewMonth + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    if (t.deadline) {
      const deadlineDate = new Date(t.deadline);
      if (deadlineDate >= monthStart && deadlineDate <= monthEnd) {
        addToDate(t.deadline);
      }
    }

    if (t.repeat && t.repeat !== 'None') {
      const originStr = t.deadline ? t.deadline : todayStr;
      const [oy, om, od] = originStr.split('-').map(Number);
      const origin = new Date(oy, om - 1, od);

      const advanceCursor = (d) => {
        const next = new Date(d);
        if (t.repeat === 'Daily') next.setDate(next.getDate() + 1);
        else if (t.repeat === 'Weekly') next.setDate(next.getDate() + 7);
        else if (t.repeat === 'Monthly') next.setMonth(next.getMonth() + 1);
        return next;
      };

      if (!t.deadline && origin >= monthStart && origin <= monthEnd) {
        addToDate(originStr);
      }

      let cursor = new Date(origin);
      let safety = 0;

      while (cursor <= monthEnd && safety < 400) {
        cursor = advanceCursor(cursor);
        safety++;
        if (cursor > monthEnd) break;
        if (cursor >= monthStart) {
          addToDate(fmtDate(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
        }
      }
    }

    return acc;
  }, {});

  const handleDayPress = (dateStr) => {
    if (selectedDate === dateStr) {
      setSelectedDate(null);
    } else {
      setSelectedDate(dateStr);
    }
  };

  const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

  const formatTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Check calendar for tasks</Text>
        <Text style={s.headerSub}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
      </View>

      <View style={s.calendarCard} {...panResponder.panHandlers}>
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
            <Ionicons name="chevron-back" size={18} color={theme.primary} />
          </TouchableOpacity>
          <Text style={s.monthLabel}>
            {MONTHS[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
            <Ionicons name="chevron-forward" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={s.dayLabels}>
          {DAYS.map((d) => (
            <Text key={d} style={s.dayLabel}>
              {d}
            </Text>
          ))}
        </View>

        <View style={s.grid}>
          {Array(firstDay)
            .fill(null)
            .map((_, i) => (
              <View key={`e${i}`} style={s.dayCell} />
            ))}
          {Array(daysInMonth)
            .fill(null)
            .map((_, i) => {
              const day = i + 1;
              const dateStr = fmtDate(viewYear, viewMonth, day);
              const dayTasks = tasksByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const isPast = dateStr < todayStr;

              return (
                <TouchableOpacity
                  key={day}
                  style={s.dayCell}
                  onPress={() => handleDayPress(dateStr)}
                  activeOpacity={1}>
                  <View style={[
                    s.dayCellInner,
                    isToday && !isSelected && { borderWidth: 1.5, borderColor: theme.primary },
                    isSelected && { backgroundColor: theme.primary },
                  ]}>
                    <Text
                      style={[
                        s.dayNum,
                        {
                          color: isSelected
                            ? '#fff'
                            : isToday
                            ? theme.primary
                            : isPast
                            ? theme.subtext
                            : theme.text,
                        },
                      ]}>
                      {day}
                    </Text>
                    {dayTasks.length > 0 && (
                      <View style={s.dotRow}>
                        {dayTasks.slice(0, 5).map((t, j) => {
                          const cellDeadline = new Date(dateStr + 'T00:00');
                          if (t.taskTime) {
                            const [h, m] = t.taskTime.split(':');
                            cellDeadline.setHours(parseInt(h), parseInt(m), 0, 0);
                          } else {
                            cellDeadline.setHours(23, 59, 59, 999);
                          }
                          const isOriginalDate = t.deadline ? t.deadline === dateStr : dateStr === todayStr;
                          const effectiveDone = t.status === 'Done' && isOriginalDate;
                          const isMissed = !effectiveDone && cellDeadline < now;
                          const dotColor = isSelected
                            ? 'rgba(255,255,255,0.9)'
                            : effectiveDone
                            ? '#22C55E'
                            : isMissed
                            ? '#EF4444'
                            : '#F59E0B';
                          return (
                            <View
                              key={j}
                              style={[s.taskDot, { backgroundColor: dotColor }]}
                            />
                          );
                        })}
                        {dayTasks.length > 5 && (
                          <Text style={[s.dotOverflow, { color: isSelected ? 'rgba(255,255,255,0.85)' : theme.subtext }]}>
                            +{dayTasks.length - 5}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>

        <View style={s.legend}>
          {[
            { color: '#F59E0B', label: 'Upcoming' },
            { color: '#22C55E', label: 'Done' },
            { color: '#EF4444', label: 'Missed' },
          ].map(({ color, label }) => (
            <View key={label} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: color }]} />
              <Text style={s.legendText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
      ) : selectedDate ? (
        <ScrollView style={s.listArea} showsVerticalScrollIndicator={false}>
          <View style={s.listHeader}>
            <Text style={s.listTitle}>
              {selectedDate === todayStr ? 'Today' : `Date: ${selectedDate}`}
            </Text>
            <View style={s.listHeaderRight}>
              <Text style={s.taskCount}>
                {selectedTasks.length} task
                {selectedTasks.length !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity
                style={[s.addDayBtn, { backgroundColor: theme.primary }]}
                onPress={() =>
                  navigation.navigate('TaskForm', { selectedDate })
                }>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.addDayBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {selectedTasks.length === 0 ? (
            <View style={s.emptyDay}>
              <Ionicons
                name="calendar-outline"
                size={40}
                color={theme.border}
              />
              <Text style={[s.emptyDayText, { color: theme.subtext }]}>
                No tasks on this day
              </Text>
            </View>
          ) : (
            selectedTasks.map((task) => {
              const cellDeadline = new Date(selectedDate + 'T00:00');
              if (task.taskTime) {
                const [h, m] = task.taskTime.split(':');
                cellDeadline.setHours(parseInt(h), parseInt(m), 0, 0);
              } else {
                cellDeadline.setHours(23, 59, 59, 999);
              }
              const isOriginalDate = task.deadline ? task.deadline === selectedDate : selectedDate === todayStr;
              const effectiveDone = task.status === 'Done' && isOriginalDate;
              const isOverdue = !effectiveDone && cellDeadline < now;
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    s.taskCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                  onPress={() =>
                    navigation.navigate('TaskDetail', { item: task })
                  }
                  activeOpacity={0.75}>
                  <View
                    style={[
                      s.taskColorBar,
                      {
                        backgroundColor:
                          CATEGORY_COLORS[task.category] || theme.primary,
                      },
                    ]}
                  />
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <Text
                      style={[
                        s.taskTitle,
                        { color: isOverdue ? '#EF4444' : theme.text },
                        effectiveDone && {
                          textDecorationLine: 'line-through',
                          color: theme.subtext,
                        },
                      ]}
                      numberOfLines={1}>
                      {task.title}
                    </Text>
                    <View style={s.taskMeta}>
                      <Text
                        style={[
                          s.taskCat,
                          {
                            color:
                              CATEGORY_COLORS[task.category] || theme.primary,
                          },
                        ]}>
                        {task.category}
                      </Text>
                      {task.taskTime && (
                        <View style={s.timePill}>
                          <Ionicons
                            name="time-outline"
                            size={10}
                            color={theme.subtext}
                          />
                          <Text style={[s.timeText, { color: theme.subtext }]}>
                            {' '}
                            {formatTime(task.taskTime)}
                          </Text>
                        </View>
                      )}
                      {task.repeat && task.repeat !== 'None' && (
                        <Ionicons
                          name="repeat"
                          size={12}
                          color={theme.primary}
                        />
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      s.statusPill,
                      {
                        backgroundColor: effectiveDone
                          ? '#D1FAE5'
                          : isOverdue
                          ? '#FEE2E2'
                          : theme.primaryLight,
                      },
                    ]}>
                    <Text
                      style={[
                        s.statusText,
                        {
                          color: effectiveDone
                            ? '#065F46'
                            : isOverdue
                            ? '#991B1B'
                            : theme.primaryDark,
                        },
                      ]}>
                      {effectiveDone ? 'Done' : isOverdue ? 'Missed' : task.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <ScrollView style={s.listArea} showsVerticalScrollIndicator={false}>
          <View style={s.upcomingHeader}>
            <Text style={[s.upcomingTitle, { color: theme.text }]}>
              Upcoming Tasks
            </Text>
            <TouchableOpacity
              style={[s.sortBtn, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
              onPress={() => {
                setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
              }}
              activeOpacity={0.75}>
              <Ionicons
                name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                size={13}
                color={theme.primaryDark}
              />
              <Text style={[s.sortBtnText, { color: theme.primaryDark }]}>
                {sortOrder === 'asc' ? 'Closest deadline' : 'Farthest deadline'}
              </Text>
            </TouchableOpacity>
          </View>
          {Object.entries(tasksByDate)
            .filter(([d]) => d >= todayStr)
            .sort(([a], [b]) => sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a))
            .slice(0, 12)
            .map(([date, dayTasks]) => (
              <TouchableOpacity
                key={date}
                style={s.upcomingGroup}
                onPress={() => setSelectedDate(date)}
                activeOpacity={1}>
                <View
                  style={[
                    s.upcomingDateBadge,
                    {
                      backgroundColor:
                        date === todayStr ? theme.primary : theme.primaryLight,
                    },
                  ]}>
                  <Text
                    style={[
                      s.upcomingDateDay,
                      {
                        color: date === todayStr ? '#fff' : theme.primaryDark,
                      },
                    ]}>
                    {new Date(date + 'T00:00').toLocaleDateString('en', {
                      weekday: 'short',
                    })}
                  </Text>
                  <Text
                    style={[
                      s.upcomingDateNum,
                      {
                        color: date === todayStr ? '#fff' : theme.primaryDark,
                      },
                    ]}>
                    {parseInt(date.split('-')[2])}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  {dayTasks.slice(0, 2).map((t) => (
                    <View
                      key={t.id}
                      style={[
                        s.upcomingTask,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                      ]}>
                      <View
                        style={[
                          s.upcomingDot,
                          {
                            backgroundColor:
                              CATEGORY_COLORS[t.category] || theme.primary,
                          },
                        ]}
                      />
                      <Text
                        style={[s.upcomingTaskTitle, { color: theme.text }]}
                        numberOfLines={1}>
                        {t.title}
                      </Text>
                    </View>
                  ))}
                  {dayTasks.length > 2 && (
                    <Text style={[s.moreTasks, { color: theme.subtext }]}>
                      +{dayTasks.length - 2} more
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

          {Object.keys(tasksByDate).filter((d) => d >= todayStr).length ===
            0 && (
            <View style={s.emptyDay}>
              <Ionicons
                name="calendar-outline"
                size={44}
                color={theme.border}
              />
              <Text style={[s.emptyDayText, { color: theme.subtext }]}>
                No upcoming tasks
              </Text>
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },

    header: {
      backgroundColor: theme.headerBg,
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 14,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: theme.primaryDark },
    headerSub: { fontSize: 13, color: theme.subtext, marginTop: 2 },

    calendarCard: {
      backgroundColor: theme.card,
      marginHorizontal: 14,
      marginTop: 12,
      borderRadius: 20,
      padding: 14,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.border,
    },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    navBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthLabel: { fontSize: 15, fontWeight: '700', color: theme.text },

    dayLabels: { flexDirection: 'row', marginBottom: 6 },
    dayLabel: {
      flex: 1,
      textAlign: 'center',
      fontSize: 10,
      fontWeight: '700',
      color: theme.subtext,
    },

    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: {
      width: '14.28%',
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCellInner: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    dayNum: { fontSize: 13, fontWeight: '600' },
    dotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: 2, justifyContent: 'center', maxWidth: 34 },
    taskDot: { width: 4, height: 4, borderRadius: 2 },
    dotOverflow: { fontSize: 7, fontWeight: '700', lineHeight: 8 },

    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 7, height: 7, borderRadius: 3.5 },
    legendText: { fontSize: 11, color: theme.subtext, fontWeight: '600' },

    listArea: { flex: 1, paddingHorizontal: 14, paddingTop: 12 },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    listTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    listHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    taskCount: { fontSize: 12, color: theme.subtext },
    addDayBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    addDayBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

    taskCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      marginBottom: 9,
      overflow: 'hidden',
      elevation: 1,
      borderWidth: 1,
      paddingVertical: 12,
      paddingRight: 12,
    },
    taskColorBar: { width: 4, alignSelf: 'stretch' },
    taskTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    taskCat: { fontSize: 11, fontWeight: '700' },
    timePill: { flexDirection: 'row', alignItems: 'center' },
    timeText: { fontSize: 11 },
    statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '700' },

    emptyDay: { alignItems: 'center', paddingTop: 28, gap: 10 },
    emptyDayText: { fontSize: 14 },
    emptyAddBtn: {
      paddingHorizontal: 22,
      paddingVertical: 10,
      borderRadius: 12,
      marginTop: 4,
    },
    emptyAddBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    upcomingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    upcomingTitle: { fontSize: 15, fontWeight: '700' },
    sortBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
    },
    sortBtnText: { fontSize: 11, fontWeight: '700' },
    upcomingGroup: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 14,
      alignItems: 'flex-start',
    },
    upcomingDateBadge: {
      width: 46,
      borderRadius: 12,
      alignItems: 'center',
      paddingVertical: 7,
    },
    upcomingDateDay: { fontSize: 10, fontWeight: '700' },
    upcomingDateNum: { fontSize: 20, fontWeight: '900' },
    upcomingTask: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 9,
      borderRadius: 10,
      gap: 8,
      elevation: 1,
      borderWidth: 1,
    },
    upcomingDot: { width: 8, height: 8, borderRadius: 4 },
    upcomingTaskTitle: { flex: 1, fontSize: 13, fontWeight: '600' },
    moreTasks: { fontSize: 12, paddingLeft: 4 },
  });