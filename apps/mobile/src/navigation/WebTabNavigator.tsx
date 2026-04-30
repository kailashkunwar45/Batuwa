import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { Home, CreditCard, History, User, Users, Search } from 'lucide-react-native';
import { THEME } from '../theme/theme';

import HomeScreen from '../screens/HomeScreen';
import PaymentCategoriesScreen from '../screens/PaymentCategoriesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SocialFeedScreen from '../screens/social/SocialFeedScreen';
import VaultsScreen from '../screens/VaultsScreen';

const Tab = createBottomTabNavigator();

function WebTopNavbar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.navContainer}>
      <View style={styles.navContent}>
        <Text style={styles.logo}>Batuwa Web</Text>
        <View style={styles.navLinks}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={index}
                onPress={onPress}
                style={[styles.navItem, isFocused && styles.navItemActive]}
              >
                <Text style={[styles.navText, isFocused && styles.navTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function WebTabNavigator() {
  return (
    <View style={styles.pageContainer}>
      <View style={styles.appContainer}>
        <Tab.Navigator
          tabBar={(props) => <WebTopNavbar {...props} />}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: THEME.colors.background }, // Use sceneStyle instead of sceneContainerStyle in v7
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Vaults" component={VaultsScreen} options={{ tabBarLabel: 'Batuwas' }} />
          <Tab.Screen name="Pay" component={PaymentCategoriesScreen} />
          <Tab.Screen name="Social" component={SocialFeedScreen} />
          <Tab.Screen name="History" component={HistoryScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#050B14', // Very dark background outside the app container
    alignItems: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 1200, // Constrain width for a proper website feel
    backgroundColor: THEME.colors.background,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: THEME.colors.border,
  },
  navContainer: {
    backgroundColor: THEME.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.primary,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navItem: {
    marginLeft: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: 'rgba(79, 124, 255, 0.1)',
  },
  navText: {
    color: THEME.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  navTextActive: {
    color: THEME.colors.primary,
  },
});
