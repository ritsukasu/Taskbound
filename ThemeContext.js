import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';

const themes = {
  green: {
    primary: '#2E7D32',
    primaryDark: '#1B5E20',
    primaryLight: '#E8F5E9',
    accent: '#388E3C',
    bg: '#F6F9F6',
    card: '#fff',
    text: '#222',
    subtext: '#888',
    border: '#E8E8E8',
    inputBg: '#F7F7F7',
    headerBg: '#fff',
    tabBg: '#fff',
    sectionColor: '#2E7D32',
    btnText: '#fff',
    name: 'green',
  },
  blue: {
    primary: '#8FD9FB',
    primaryDark: '#1A6FA8',
    primaryLight: '#E8F7FF',
    accent: '#5BC8F5',
    bg: '#F0FAFF',
    card: '#fff',
    text: '#1A3A4A',
    subtext: '#6A9AB0',
    border: '#C8EAF8',
    inputBg: '#F0FAFF',
    headerBg: '#fff',
    tabBg: '#fff',
    sectionColor: '#8FD9FB',
    btnText: '#fff',
    name: 'blue',
  },
  pink: {
    primary: '#FFB7CE',
    primaryDark: '#C2185B',
    primaryLight: '#FFF0F5',
    accent: '#FF80AB',
    bg: '#FFF5F8',
    card: '#fff',
    text: '#3A0A1E',
    subtext: '#A05070',
    border: '#FFD6E5',
    inputBg: '#FFF5F8',
    headerBg: '#fff',
    tabBg: '#fff',
    sectionColor: '#FFB7CE',
    btnText: '#fff',
    name: 'pink',
  },
  dark: {
    primary: '#2E7D32',
    primaryDark: '#A5D6A7',
    primaryLight: '#1A2E1A',
    accent: '#388E3C',
    bg: '#000',
    card: '#111',
    text: '#F5F5F5',
    subtext: '#aaa',
    border: '#222',
    inputBg: '#1A1A1A',
    headerBg: '#111',
    tabBg: '#111',
    sectionColor: '#2E7D32',
    btnText: '#fff',
    name: 'dark',
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('green');
  const theme = themes[themeName];

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
          if (doc.exists && doc.data().theme) {
            setThemeName(doc.data().theme);
          } else {
            setThemeName('green');
          }
        }).catch(() => {});
      } else {
        setThemeName('green');
      }
    });
    return () => unsub();
  }, []);
  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}