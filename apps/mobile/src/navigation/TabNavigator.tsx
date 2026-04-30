import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, CreditCard, History, User, Users, Search } from 'lucide-react-native';
import { THEME } from '../theme/theme';

import HomeScreen from '../screens/HomeScreen';
import PaymentCategoriesScreen from '../screens/PaymentCategoriesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SocialFeedScreen from '../screens/social/SocialFeedScreen';
import VaultsScreen from '../screens/VaultsScreen';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: THEME.colors.background,
          borderTopColor: THEME.colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Vaults"
        component={VaultsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
          tabBarLabel: 'Batuwas',
        }}
      />
      <Tab.Screen
        name="Pay"
        component={PaymentCategoriesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialFeedScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

