import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { MainTabNavigator } from './MainTabNavigator';
import { CreatePostScreen } from '../screens/post/CreatePostScreen';
import { NotificationScreen } from '../screens/notification/NotificationScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ChatDetailScreen } from '../screens/chat/ChatDetailScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { EditProfileScreen } from '../screens/settings/EditProfileScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main Tabs */}
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        
        {/* Modals & Full Screens */}
        <Stack.Screen 
          name="CreatePost" 
          component={CreatePostScreen} 
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationScreen} 
        />
        <Stack.Screen 
          name="ChatList" 
          component={ChatListScreen} 
        />
        <Stack.Screen 
          name="ChatDetail" 
          component={ChatDetailScreen} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
