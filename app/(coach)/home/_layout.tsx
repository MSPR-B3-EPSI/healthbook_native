import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// L'onglet actif est une tuile violette arrondie avec icône blanche (maquette),
// d'où ce wrapper plutôt que la simple teinte d'icône utilisée côté social.
function TabIcon({
  focused,
  name,
  activeName,
}: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  activeName: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      className={`h-10 w-12 items-center justify-center rounded-xl ${
        focused ? 'bg-coach' : ''
      }`}
    >
      <Ionicons
        name={focused ? activeName : name}
        size={21}
        color={focused ? '#FFFFFF' : '#9AA0A6'}
      />
    </View>
  );
}

export default function CoachTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5B2EE5',
        tabBarInactiveTintColor: '#9AA0A6',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E1E4E8',
          borderTopWidth: 1,
          paddingTop: 8,
          // 72px visibles + inset système (cf. (social)/_layout.tsx).
          height: 72 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Séance',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="barbell-outline"
              activeName="barbell"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="restaurant-outline"
              activeName="restaurant"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="bar-chart-outline"
              activeName="bar-chart"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercices',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="book-outline" activeName="book" />
          ),
        }}
      />
      {/* Routes poussées, hors tabs : suivi de séance + détail d'exercice
          (même pattern que (social)/post/[id]). */}
      <Tabs.Screen
        name="session"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="exercise/[id]"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="settings-outline"
              activeName="settings"
            />
          ),
        }}
      />
    </Tabs>
  );
}
