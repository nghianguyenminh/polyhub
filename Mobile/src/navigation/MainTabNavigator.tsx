import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../constants/theme';
import Feather from '@expo/vector-icons/Feather';

// Real Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { MentorListScreen } from '../screens/mentors/MentorListScreen';
import { BookingListScreen } from '../screens/bookings/BookingListScreen';
import { DocumentListScreen } from '../screens/documents/DocumentListScreen';
import { SavedListScreen } from '../screens/saved/SavedListScreen';

const Icon = Feather as any;
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
        <Tab.Screen name="Mentors" component={MentorListScreen} />
        <Tab.Screen name="Lịch hẹn" component={BookingListScreen} />
        <Tab.Screen name="Tài liệu" component={DocumentListScreen} />
        <Tab.Screen name="Đã lưu" component={SavedListScreen} />
      </Tab.Navigator>
  );
};

import { StyleSheet } from 'react-native';

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

