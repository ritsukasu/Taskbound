import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Animated, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, auth } from './firebaseConfig';
import { useTheme } from './ThemeContext';

const CATEGORIES = ['School', 'Business', 'Daily Chores', 'Health', 'Personal', 'Other'];
const STATUSES = ['To Do', 'In Progress', 'Done'];
const REPEAT_OPTIONS = ['None', 'Daily', 'Weekly', 'Monthly'];
const CATEGORY_COLORS = {
  School: '#4CAF50',
  Business: '#2196F3',
  'Daily Chores': '#FF9800',
  Health: '#E91E63',
  Personal: '#9C27B0',
  Other: '#607D8B',
};

export default function TaskForm({ route, navigation }) {
  const { theme } = useTheme();
  const item = route.params?.item;
  const preselectedDate = route.params?.selectedDate || '';
  const isEdit = !!item;

  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || 'School');
  const [status, setStatus] = useState(item?.status || 'To Do');
  const [deadline, setDeadline] = useState(item?.deadline || preselectedDate);
  const [taskTime, setTaskTime] = useState(item?.taskTime || '');
  const [repeat, setRepeat] = useState(item?.repeat || 'None');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const initPickerDate = item?.deadline
    ? new Date(item.deadline)
    : preselectedDate
      ? new Date(preselectedDate)
      : new Date();
  const [pickerDate, setPickerDate] = useState(initPickerDate);
  const [pickerTime, setPickerTime] = useState(() => {
    if (item?.taskTime) {
      const [h, m] = item.taskTime.split(':');
      const d = new Date(); d.setHours(parseInt(h)); d.setMinutes(parseInt(m));
      return d;
    }
    return new Date();
  });
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const alertScale = useRef(new Animated.Value(0.85)).current;

  const showAlert = (msg) => {
    setAlertMsg(msg);
    alertScale.setValue(0.85);
    setAlertVisible(true);
    Animated.spring(alertScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
  };

  const hideAlert = () => {
    Animated.timing(alertScale, { toValue: 0.85, duration: 130, useNativeDriver: true }).start(() => setAlertVisible(false));
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      setPickerDate(selectedDate);
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setDeadline(`${yyyy}-${mm}-${dd}`);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedTime) {
      setPickerTime(selectedTime);
      const h = String(selectedTime.getHours()).padStart(2, '0');
      const m = String(selectedTime.getMinutes()).padStart(2, '0');
      setTaskTime(`${h}:${m}`);
    }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const handleSave = async () => {
    if (!title.trim()) { showAlert('Please enter a task title.'); return; }
    setLoading(true);
    const payload = {
      title: title.trim(), description: description.trim(),
      category, status, deadline, taskTime, repeat,
      uid: auth.currentUser?.uid, updatedAt: new Date().toISOString(),
    };
    try {
      if (isEdit) {
        await db.collection('tasks').doc(item.id).update(payload);
      } else {
        await db.collection('tasks').add({ ...payload, createdAt: new Date().toISOString() });
      }
      navigation.goBack();
    } catch (e) {
      showAlert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(theme);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>
          <Text style={s.label}>Task Title *</Text>
          <TextInput style={s.input} placeholder="What needs to be done?" placeholderTextColor={theme.subtext} value={title} onChangeText={setTitle} maxLength={80} />

          <Text style={s.label}>Description</Text>
          <TextInput style={[s.input, s.textArea]} placeholder="Add details..." placeholderTextColor={theme.subtext} value={description} onChangeText={setDescription} multiline numberOfLines={3} />

          <Text style={s.label}>Category</Text>
          <View style={s.chipRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[s.chip, category === cat && { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] }]} onPress={() => setCategory(cat)}>
                <Text style={[s.chipText, { color: theme.subtext }, category === cat && { color: '#fff' }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Status</Text>
          <View style={s.chipRow}>
            {STATUSES.map(st => {
              const sc = { 'To Do': '#1565C0', 'In Progress': '#F57C00', 'Done': '#2E7D32' }[st];
              return (
                <TouchableOpacity key={st} style={[s.chip, status === st && { backgroundColor: sc, borderColor: sc }]} onPress={() => setStatus(st)}>
                  <Text style={[s.chipText, { color: theme.subtext }, status === st && { color: '#fff' }]}>{st}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.label}>Date & Time</Text>
          <View style={s.dateTimeRow}>
            <TouchableOpacity style={[s.dateBtn, { flex: 1, marginRight: 8 }]} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[s.dateBtnText, !deadline && { color: theme.subtext }]}>{deadline || 'Date'}</Text>
              {deadline ? (
                <TouchableOpacity onPress={() => setDeadline('')} style={{ marginLeft: 4 }}>
                  <Ionicons name="close-circle" size={16} color={theme.subtext} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity style={[s.dateBtn, { flex: 1 }]} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[s.dateBtnText, !taskTime && { color: theme.subtext }]}>{taskTime ? formatTime(taskTime) : 'Time'}</Text>
              {taskTime ? (
                <TouchableOpacity onPress={() => setTaskTime('')} style={{ marginLeft: 4 }}>
                  <Ionicons name="close-circle" size={16} color={theme.subtext} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker value={pickerDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={onDateChange} minimumDate={new Date()} />
          )}
          {Platform.OS === 'ios' && showDatePicker && (
            <TouchableOpacity style={[s.doneBtn, { backgroundColor: theme.primary }]} onPress={() => setShowDatePicker(false)}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Done</Text>
            </TouchableOpacity>
          )}

          {showTimePicker && (
            <DateTimePicker value={pickerTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} />
          )}
          {Platform.OS === 'ios' && showTimePicker && (
            <TouchableOpacity style={[s.doneBtn, { backgroundColor: theme.primary }]} onPress={() => setShowTimePicker(false)}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Done</Text>
            </TouchableOpacity>
          )}

          <Text style={s.label}>Repeat</Text>
          <View style={s.chipRow}>
            {REPEAT_OPTIONS.map(r => (
              <TouchableOpacity
                key={r}
                style={[s.chip, repeat === r && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setRepeat(r)}
              >
                {r !== 'None' && <Ionicons name="repeat" size={13} color={repeat === r ? '#fff' : theme.subtext} style={{ marginRight: 4 }} />}
                <Text style={[s.chipText, { color: theme.subtext }, repeat === r && { color: '#fff' }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[s.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name={isEdit ? 'checkmark-circle-outline' : 'add-circle-outline'} size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.saveBtnText}>{isEdit ? 'Update Task' : 'Add Task'}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={[s.cancelBtnText, { color: theme.subtext }]}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <Modal transparent visible={alertVisible} animationType="none">
        <View style={s.overlay}>
          <Animated.View style={[s.alertBox, { transform: [{ scale: alertScale }] }]}>
            <Ionicons name="alert-circle" size={32} color={theme.primary} style={{ marginBottom: 10 }} />
            <Text style={s.alertTitle}>Heads up</Text>
            <Text style={s.alertMsg}>{alertMsg}</Text>
            <TouchableOpacity style={[s.alertBtn, { backgroundColor: theme.primary }]} onPress={hideAlert}>
              <Text style={s.alertBtnText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  inner: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: theme.primaryDark, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.card, borderRadius: 12, padding: 14, fontSize: 15, color: theme.text, borderWidth: 1, borderColor: theme.border, marginBottom: 4 },
  textArea: { height: 90, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.card },
  chipText: { fontSize: 13, fontWeight: '600' },
  dateTimeRow: { flexDirection: 'row', gap: 8 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border },
  dateBtnText: { fontSize: 14, color: theme.text, flex: 1 },
  doneBtn: { alignSelf: 'flex-end', marginTop: 8, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 12, borderRadius: 14, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 24, elevation: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: theme.card, borderRadius: 28, padding: 28, width: '82%', alignItems: 'center', elevation: 16 },
  alertTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
  alertMsg: { fontSize: 14, color: theme.subtext, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  alertBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  alertBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});