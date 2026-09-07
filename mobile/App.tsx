import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AppNavigator } from './src/navigation';

export default function App() {
  const scheme = useColorScheme();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { SecureStore.getItemAsync('meal-planner-token').then(token => setSignedIn(Boolean(token))); }, []);
  return <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}><AppNavigator signedIn={signedIn} onSignedIn={() => setSignedIn(true)} onSignOut={() => setSignedIn(false)} /></NavigationContainer>;
}
