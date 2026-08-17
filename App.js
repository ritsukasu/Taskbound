import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider, useTheme } from './ThemeContext';
import Login from './Login';
import Register from './Register';
import Onboarding from './Onboarding';
import MainTabs from './MainTabs';
import TaskForm from './TaskForm';
import TaskDetail from './TaskDetail';

const Stack = createStackNavigator();

function AppNavigator() {
  const { theme } = useTheme();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="TaskForm"
          component={TaskForm}
          options={{
            headerShown: true,
            title: 'Task',
            headerTintColor: theme.primaryDark,
            headerStyle: { backgroundColor: theme.headerBg },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="TaskDetail"
          component={TaskDetail}
          options={{
            headerShown: true,
            title: 'Task Details',
            headerTintColor: theme.primaryDark,
            headerStyle: { backgroundColor: theme.headerBg },
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}