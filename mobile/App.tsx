import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AppNavigator } from './src/navigation';
import { I18nProvider } from './src/i18n';

export default function App() {
  const scheme = useColorScheme();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { SecureStore.getItemAsync('meal-planner-token').then(token => setSignedIn(Boolean(token))); }, []);
  return <I18nProvider><NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}><AppNavigator signedIn={signedIn} onSignedIn={() => setSignedIn(true)} onSignOut={() => setSignedIn(false)} /></NavigationContainer></I18nProvider>;
}
