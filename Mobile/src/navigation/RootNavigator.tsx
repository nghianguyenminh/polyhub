import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { SplashScreen } from '../components/SplashScreen';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../store/themeStore';

// Navigation Stack Components
import { MainTabNavigator } from './MainTabNavigator';
import { CreatePostScreen } from '../screens/post/CreatePostScreen';
import { NotificationScreen } from '../screens/notification/NotificationScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ChatDetailScreen } from '../screens/chat/ChatDetailScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { EditProfileScreen } from '../screens/settings/EditProfileScreen';
import { MentorBusyScreen } from '../screens/settings/MentorBusyScreen';
import { MentorDetailScreen } from '../screens/mentors/MentorDetailScreen';
import { BookingScreen } from '../screens/mentors/BookingScreen';
import { VideoCallScreen } from '../screens/chat/VideoCallScreen';

// Auth Screen Components
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OTPScreen } from '../screens/auth/OTPScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated, loading, isTransitioning, checkAuth } = useAuthStore();
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  const { theme, styles } = useAppTheme(createStyles);

  useEffect(() => {
    // Check credentials on startup
    checkAuth().then(() => {
      // Small buffer to allow startup screen smooth entry before potential transition
    });
  }, []);

  const handleStartupSplashEnd = () => {
    setShowStartupSplash(false);
  };

  // If checkAuth is still loading and startup splash is active, show the splash screen
  if (showStartupSplash) {
    return <SplashScreen onAnimationEnd={handleStartupSplashEnd} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={{
        ...(theme.isDark ? DarkTheme : DefaultTheme),
        dark: theme.isDark,
        colors: {
          ...(theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.textMain,
          border: theme.colors.border,
          notification: theme.colors.primary,
        }
      }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            // App Stack (Authenticated)
            <>
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
                options={{ animation: 'slide_from_left' }}
              />
              <Stack.Screen 
                name="EditProfile" 
                component={EditProfileScreen} 
              />
              <Stack.Screen 
                name="MentorBusy" 
                component={MentorBusyScreen} 
              />
              <Stack.Screen 
                name="MentorDetail" 
                component={MentorDetailScreen} 
              />
              <Stack.Screen 
                name="Booking" 
                component={BookingScreen} 
              />
              <Stack.Screen 
                name="VideoCall" 
                component={VideoCallScreen}
                options={{
                  headerShown: false,
                  animation: 'none',
                }}
              />
            </>
          ) : (
            // Auth Stack (Unauthenticated)
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="OTP" component={OTPScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      
      {/* Centralized transition overlay (for Login/Logout actions) */}
      {isTransitioning && <SplashScreen />}
    </View>
  );
};


const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
