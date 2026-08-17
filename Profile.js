import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Image, Modal, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from './firebaseConfig';
import { useTheme } from './ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { theme, themeName, setThemeName } = useTheme();
  const [userData, setUserData] = useState(null);
  const [taskStats, setTaskStats] = useState({ total: 0, done: 0 });
  const [photoURL, setPhotoURL] = useState('');
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const [editingField, setEditingField] = useState(null);
  const [editName, setEditName] = useState('');

  const [fieldLoading, setFieldLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    icon: 'information-circle', iconBg: '#E3F2FD', iconColor: '#1565C0',
    title: '', msg: '', btnLabel: 'OK', onOk: null,
  });
  const alertScale = useRef(new Animated.Value(0.85)).current;
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        setUserData(data);
        setEditName(data.name || '');
        setPhotoURL(data.photoURL || user.photoURL || '');
      }
    });
    db.collection('tasks').where('uid', '==', user.uid).get().then(snap => {
      const tasks = snap.docs.map(d => d.data());
      setTaskStats({ total: tasks.length, done: tasks.filter(t => t.status === 'Done').length });
    });
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setAppearanceOpen(false);
        setEditProfileOpen(false);
        setEditingField(null);
      };
    }, [])
  );

  const openAlert = (config) => {
    setAlertConfig(config);
    alertScale.setValue(0.85);
    setAlertVisible(true);
    Animated.spring(alertScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
  };

  const closeAlert = () => {
    Animated.timing(alertScale, { toValue: 0.85, duration: 130, useNativeDriver: true }).start(() => {
      setAlertVisible(false);
      if (alertConfig.onOk) alertConfig.onOk();
    });
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      openAlert({ icon: 'images-outline', iconBg: theme.primaryLight, iconColor: theme.primary, title: 'Permission Needed', msg: 'Allow access to your photos to change your profile picture.', btnLabel: 'OK' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const base64 = 'data:image/jpeg;base64,' + result.assets[0].base64;
      setPhotoURL(base64);
      await db.collection('users').doc(user.uid).update({ photoURL: base64 });
    }
  };

  const handleLogout = () => {
    openAlert({
      icon: 'log-out-outline', iconBg: theme.primaryLight, iconColor: theme.primary,
      title: 'Log Out', msg: 'Are you sure you want to log out?',
      btnLabel: 'Log Out',
      onOk: async () => { await auth.signOut(); navigation.replace('Login'); },
      showCancel: true,
    });
  };

  const saveName = async () => {
    if (!editName.trim()) { openAlert({ icon: 'alert-circle', iconBg: theme.primaryLight, iconColor: theme.primary, title: 'Name Empty', msg: 'Name cannot be empty.', btnLabel: 'OK' }); return; }
    setFieldLoading(true);
    try {
      await db.collection('users').doc(user.uid).update({ name: editName.trim() });
      setUserData(d => ({ ...d, name: editName.trim() }));
      setEditingField(null);
    } catch (e) {
      openAlert({ icon: 'alert-circle', iconBg: theme.primaryLight, iconColor: theme.primary, title: 'Error', msg: e.message, btnLabel: 'OK' });
    } finally { setFieldLoading(false); }
  };

  const initials = userData?.name
    ? userData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const themeOptions = [
    { key: 'green', color: '#2E7D32', label: 'Green' },
    { key: 'blue', color: '#1A6FA8', label: 'Blue' },
    { key: 'pink', color: '#C2185B', label: 'Pink' },
    { key: 'dark', color: '#333333', label: 'Dark' },
  ];

  const s = makeStyles(theme);

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const settingsItems = [
    { icon: 'person-circle-outline', label: 'Profile Details', isEditProfile: true },
    { icon: 'color-palette-outline', label: 'Appearance', isAppearance: true },
    {
      icon: 'information-circle-outline', label: 'About TaskBound',
      onPress: () => openAlert({ icon: 'information-circle', iconBg: theme.primaryLight, iconColor: theme.primary, title: 'About TaskBound', msg: 'TaskBound v1.6\nBuilt with React Native + Firebase', btnLabel: 'OK' }),
    },
    {
      icon: 'shield-checkmark-outline', label: 'Privacy Policy',
      onPress: () => openAlert({ icon: 'shield-checkmark', iconBg: theme.primaryLight, iconColor: theme.primary, title: 'Privacy Policy', msg: 'Your data is securely stored in Firebase Firestore and is private to your account.', btnLabel: 'Got it' }),
    },
    {
      icon: 'help-circle-outline', label: 'Help & Support',
      onPress: () => openAlert({ icon: 'help-circle', iconBg: theme.primaryLight, iconColor: theme.primary, title: 'Help & Support', msg: 'Tap + to add a task\nTap a task to view details\nUse the circle checkbox to mark done\nChange themes in Appearance', btnLabel: 'OK' }),
    },
  ];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.banner}>
        <TouchableOpacity onPress={handlePickPhoto} style={s.avatarWrap}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={s.avatarImg} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={s.cameraOverlay}>
            <Ionicons name="camera" size={13} color="#fff" />
          </View>
        </TouchableOpacity>
        <View style={s.bannerInfo}>
          <Text style={s.bannerName}>{userData?.name || 'User'}</Text>
          <Text style={s.bannerUsername}>{userData?.username || '—'}</Text>
        </View>
      </View>

      <View style={s.card}>
        {settingsItems.map(({ icon, label, isEditProfile, isAppearance, onPress }, idx) => {
          const isLast = idx === settingsItems.length - 1;

          if (isEditProfile) {
            return (
              <View key={label}>
                <TouchableOpacity
                  style={[s.settingRow, isLast && { borderBottomWidth: 0 }]}
                  onPress={() => { setEditProfileOpen(o => !o); setEditingField(null); }}
                  activeOpacity={0.7}
                >
                  <View style={s.settingLeft}>
                    <View style={[s.settingIconBox, { backgroundColor: theme.primaryLight }]}>
                      <Ionicons name={icon} size={17} color={theme.primary} />
                    </View>
                    <Text style={s.settingText}>{label}</Text>
                  </View>
                  <Ionicons name={editProfileOpen ? 'chevron-up' : 'chevron-down'} size={15} color={theme.subtext} />
                </TouchableOpacity>

                {editProfileOpen && (
                  <View style={s.editProfilePanel}>
                    <ProfileField
                      fieldKey="name"
                      label="Display Name"
                      icon="person-outline"
                      displayValue={userData?.name || '—'}
                      onSave={saveName}
                      editingField={editingField}
                      setEditingField={setEditingField}
                      fieldLoading={fieldLoading}
                      theme={theme}
                      s={s}
                      editContent={
                        <TextInput
                          style={[s.pfInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                          value={editName}
                          onChangeText={setEditName}
                          placeholder="Display name"
                          placeholderTextColor={theme.subtext}
                        />
                      }
                    />
                    <View style={s.profileFieldWrap}>
                      <View style={s.profileFieldRow}>
                        <View style={[s.pfIconBox, { backgroundColor: theme.primaryLight }]}>
                          <Ionicons name="at-outline" size={16} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.pfLabel}>Username</Text>
                          <Text style={s.pfValue} numberOfLines={1}>{userData?.username || '—'}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={s.profileFieldWrap}>
                      <View style={s.profileFieldRow}>
                        <View style={[s.pfIconBox, { backgroundColor: theme.primaryLight }]}>
                          <Ionicons name="mail-outline" size={16} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.pfLabel}>Email</Text>
                          <Text style={s.pfValue} numberOfLines={1}>{userData?.email || user?.email || '—'}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={s.profileFieldWrap}>
                      <View style={s.profileFieldRow}>
                        <View style={[s.pfIconBox, { backgroundColor: theme.primaryLight }]}>
                          <Ionicons name="lock-closed-outline" size={16} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.pfLabel}>Password</Text>
                          <Text style={s.pfValue} numberOfLines={1}>••••••••</Text>
                        </View>
                      </View>
                    </View>
                    <View style={s.profileFieldWrap}>
                      <View style={s.profileFieldRow}>
                        <View style={[s.pfIconBox, { backgroundColor: theme.primaryLight }]}>
                          <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.pfLabel}>Account Created</Text>
                          <Text style={s.pfValue}>{formatDate(userData?.createdAt)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          }

          if (isAppearance) {
            return (
              <View key={label}>
                <TouchableOpacity
                  style={[s.settingRow, isLast && { borderBottomWidth: 0 }]}
                  onPress={() => setAppearanceOpen(o => !o)}
                  activeOpacity={0.7}
                >
                  <View style={s.settingLeft}>
                    <View style={[s.settingIconBox, { backgroundColor: theme.primaryLight }]}>
                      <Ionicons name={icon} size={17} color={theme.primary} />
                    </View>
                    <Text style={s.settingText}>{label}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[s.activeSwatch, { backgroundColor: themeOptions.find(t => t.key === themeName)?.color }]} />
                    <Ionicons name={appearanceOpen ? 'chevron-up' : 'chevron-down'} size={15} color={theme.subtext} />
                  </View>
                </TouchableOpacity>
                {appearanceOpen && (
                  <View style={s.swatchRow}>
                    {themeOptions.map(t => (
                      <TouchableOpacity
                        key={t.key}
                        style={[s.swatch, { backgroundColor: t.color }, themeName === t.key && s.swatchActive]}
                        onPress={() => {
                          setThemeName(t.key);
                          db.collection('users').doc(user.uid).update({ theme: t.key }).catch(() => {});
                        }}
                        activeOpacity={0.8}
                      >
                        {themeName === t.key && <Ionicons name="checkmark" size={16} color="#fff" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          }

          return (
            <TouchableOpacity key={label} style={[s.settingRow, isLast && { borderBottomWidth: 0 }]} onPress={onPress}>
              <View style={s.settingLeft}>
                <View style={[s.settingIconBox, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name={icon} size={17} color={theme.primary} />
                </View>
                <Text style={s.settingText}>{label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={theme.border} />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={17} color="#EF5350" style={{ marginRight: 8 }} />
        <Text style={s.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={s.version}>TaskBound v1.6  ·  Made with React</Text>
      <View style={{ height: 100 }} />

      <Modal transparent visible={alertVisible} animationType="none">
        <View style={s.overlay}>
          <Animated.View style={[s.alertBox, { transform: [{ scale: alertScale }] }]}>
            <View style={[s.alertIconWrap, { backgroundColor: alertConfig.iconBg }]}>
              <Ionicons name={alertConfig.icon} size={28} color={alertConfig.iconColor} />
            </View>
            <Text style={s.alertTitle}>{alertConfig.title}</Text>
            <Text style={s.alertMsg}>{alertConfig.msg}</Text>
            {alertConfig.showCancel ? (
              <View style={s.alertBtns}>
                <TouchableOpacity
                  style={[s.alertBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                  onPress={() => {
                    Animated.timing(alertScale, { toValue: 0.85, duration: 130, useNativeDriver: true })
                      .start(() => setAlertVisible(false));
                  }}
                >
                  <Text style={[s.alertBtnText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.alertBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]} onPress={closeAlert}>
                  <Text style={[s.alertBtnText, { color: '#fff' }]}>{alertConfig.btnLabel}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[s.alertBtnFull, { backgroundColor: alertConfig.iconColor }]} onPress={closeAlert}>
                <Text style={s.alertBtnText}>{alertConfig.btnLabel}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ProfileField({ fieldKey, label, icon, displayValue, editContent, onSave, editingField, setEditingField, fieldLoading, theme, s }) {
  const isEditing = editingField === fieldKey;
  return (
    <View style={s.profileFieldWrap}>
      <View style={s.profileFieldRow}>
        <View style={[s.pfIconBox, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name={icon} size={16} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.pfLabel}>{label}</Text>
          {!isEditing && <Text style={s.pfValue} numberOfLines={1}>{displayValue}</Text>}
        </View>
        {!isEditing ? (
          <TouchableOpacity
            style={s.pfEditBtn}
            onPress={() => setEditingField(fieldKey)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil" size={14} color={theme.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.pfCancelBtn}
            onPress={() => setEditingField(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color={theme.subtext} />
          </TouchableOpacity>
        )}
      </View>
      {isEditing && (
        <View style={s.pfEditArea}>
          {editContent}
          <TouchableOpacity
            style={[s.pfSaveBtn, { backgroundColor: theme.primary }]}
            onPress={onSave}
            disabled={fieldLoading}
          >
            {fieldLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.pfSaveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },

  banner: { backgroundColor: theme.primary, paddingTop: 54, paddingHorizontal: 22, paddingBottom: 32, flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarImg: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: 'rgba(255,255,255,0.6)' },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText: { fontSize: 38, fontWeight: '800', color: '#fff' },
  cameraOverlay: { position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  bannerInfo: { flex: 1, justifyContent: 'center' },
  bannerName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerUsername: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },

  card: { marginHorizontal: 16, marginTop: 14, backgroundColor: theme.card, borderRadius: 16, paddingHorizontal: 16, elevation: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingText: { fontSize: 14, color: theme.text, fontWeight: '500' },
  activeSwatch: { width: 16, height: 16, borderRadius: 8 },
  swatchRow: { flexDirection: 'row', gap: 12, paddingBottom: 14, paddingTop: 10 },
  swatch: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  swatchActive: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)', elevation: 5 },

  editProfilePanel: { paddingBottom: 8 },
  profileFieldWrap: { borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 12 },
  profileFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pfIconBox: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  pfLabel: { fontSize: 11, fontWeight: '600', color: theme.subtext, textTransform: 'uppercase', letterSpacing: 0.4 },
  pfValue: { fontSize: 14, color: theme.text, fontWeight: '500', marginTop: 1 },
  pfEditBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center' },
  pfCancelBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center' },
  pfEditArea: { marginTop: 10, gap: 8 },
  pfInput: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  pfInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  pfInputFlex: { flex: 1, fontSize: 14 },
  pfSaveBtn: { paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  pfSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 14, paddingVertical: 13, borderRadius: 14, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  logoutText: { color: '#EF5350', fontWeight: '600', fontSize: 14 },
  version: { textAlign: 'center', color: theme.subtext, fontSize: 11, marginTop: 12 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: theme.card, borderRadius: 24, padding: 26, width: '82%', alignItems: 'center', elevation: 16 },
  alertIconWrap: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  alertTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 6, textAlign: 'center' },
  alertMsg: { fontSize: 13, color: theme.subtext, textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  alertBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  alertBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  alertBtnFull: { width: '100%', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  alertBtnText: { fontWeight: '700', fontSize: 14, color: '#fff' },
});