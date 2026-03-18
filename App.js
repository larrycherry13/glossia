import './polyfills';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { Home, Trophy, User, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { auth } from './services/firebase';
import { AuthContext } from './services/AuthContext';
import { LanguageProvider } from './services/LanguageContext';
import AuthScreen from './screens/AuthScreen';
import FeedScreen from './screens/FeedScreen';
import FriendProfileScreen from './screens/FriendProfileScreen';
import FriendsScreen from './screens/FriendsScreen';
import HomeScreen from './screens/HomeScreen';
import LandingScreen from './screens/LandingScreen';
import ProfileScreen from './screens/ProfileScreen';
import ResultScreen from './screens/ResultScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const C = { bg: '#111111', border: '#2C2C2C', text: '#FFFFFF', muted: '#818384' };

const screenOpts = {
  headerShown: false,
  contentStyle: { backgroundColor: C.bg },
  animation: 'slide_from_right',
};

// Guest: Landing → Home → Result (no tabs, Auth reachable from Landing)
function GuestStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Home"    component={HomeScreen} />
      <Stack.Screen name="Result"  component={ResultScreen} />
      <Stack.Screen name="Auth"    component={AuthScreen} />
    </Stack.Navigator>
  );
}

// Logged-in: game stack inside Jouer tab
function GameStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="Home"   component={HomeScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
}

function FriendsStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="Friends"       component={FriendsScreen} />
      <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
    </Stack.Navigator>
  );
}

// Logged-in: full tab bar
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.bg, borderTopColor: C.border, borderTopWidth: 1,
          paddingTop: 8, paddingBottom: 16, paddingHorizontal: 8,
        },
        tabBarActiveTintColor: C.text,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Jouer')  return <Home    color={color} size={size} />;
          if (route.name === 'Feed')   return <Trophy  color={color} size={size} />;
          if (route.name === 'Amis')   return <Users   color={color} size={size} />;
          if (route.name === 'Profil') return <User    color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Jouer"  component={GameStack} />
      <Tab.Screen name="Feed"   component={FeedScreen} />
      <Tab.Screen name="Amis"   component={FriendsStack} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  if (user === undefined) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <LanguageProvider>
      <AuthContext.Provider value={user}>
        <NavigationContainer>
          <StatusBar style="light" />
          {user ? <MainTabs /> : <GuestStack />}
        </NavigationContainer>
      </AuthContext.Provider>
    </LanguageProvider>
  );
}
