import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BookOpen, CalendarDays, House, ShoppingBasket, UserRound } from 'lucide-react-native';
import { HomeScreen, RecipesScreen, PlannerScreen, ShoppingScreen, ProfileScreen, LoginScreen } from './screens';

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const icons = { Home: House, Recipes: BookOpen, Planner: CalendarDays, Shopping: ShoppingBasket, Profile: UserRound } as const;
export function AppNavigator({ signedIn, onSignedIn, onSignOut }: { signedIn: boolean; onSignedIn: () => void; onSignOut: () => void }) {
  if (!signedIn) return <Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="Login" options={{ headerShown: false }}>{() => <LoginScreen onSignedIn={onSignedIn} />}</Stack.Screen></Stack.Navigator>;
  return <Tabs.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: '#16715b', tabBarInactiveTintColor: '#91a09a', tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }, tabBarStyle: { height: 72, paddingTop: 8, borderTopColor: '#e4ebe4', backgroundColor: '#fffdf8' }, tabBarIcon: ({ color, size }) => { const Icon = icons[route.name as keyof typeof icons]; return <Icon color={color} size={size} strokeWidth={2.2} />; } })}>
    <Tabs.Screen name="Home" component={HomeScreen} /><Tabs.Screen name="Recipes" component={RecipesScreen} /><Tabs.Screen name="Planner" component={PlannerScreen} /><Tabs.Screen name="Shopping" component={ShoppingScreen} /><Tabs.Screen name="Profile">{() => <ProfileScreen onSignOut={onSignOut} />}</Tabs.Screen>
  </Tabs.Navigator>;
}
