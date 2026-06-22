import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '../constants/theme';
const Icon = Feather as any;

import { HomeScreen } from '../screens/home/HomeScreen';

// Create empty dummy screens for other tabs
const DummyScreen = () => <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = 'home';
            if (route.name === 'Trang chủ') iconName = 'home';
            else if (route.name === 'Mentors') iconName = 'award';
            else if (route.name === 'Lịch hẹn') iconName = 'calendar';
            else if (route.name === 'Tài liệu') iconName = 'book';
            else if (route.name === 'Đã lưu') iconName = 'bookmark';

            return <Icon name={iconName} size={24} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: theme.typography.fontFamily.medium,
            marginTop: -4,
          }
        })}
      >
        <Tab.Screen name="Trang chủ" component={HomeScreen} />
        <Tab.Screen name="Mentors" component={DummyScreen} />
        <Tab.Screen name="Lịch hẹn" component={DummyScreen} />
        <Tab.Screen name="Tài liệu" component={DummyScreen} />
        <Tab.Screen name="Đã lưu" component={DummyScreen} />
      </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    height: 60,
    paddingBottom: 5,
    paddingTop: 5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
});
