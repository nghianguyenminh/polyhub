import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 1. Tham số cho Stack Authentication (Login, Register...)
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string } | undefined;
  VerifyOtp: { email: string; purpose: 'register' | 'forgot_password' };
};

// 2. Tham số cho Bottom Tab Main Screens
export type MainTabParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
  MentorTab: undefined;
  DocumentTab: undefined;
  SavedTab: undefined;
};

// 3. Tham số cho Root Stack (Quản lý toàn bộ App)
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  
  // Các màn hình chi tiết nhảy từ Tab hoặc Auth ra ngoài
  Profile: { username: string };
  EditProfile: undefined;
  ChatRoom: { roomId: string; receiverName: string };
  VideoCall: { callId: string; role: 'host' | 'audience' };
  MentorDetail: { mentorId: string };
  Booking: { mentorId: string };
  DocumentDetail: { docId: string };
};

// 4. Custom Hook helper type (Dành cho việc gọi useNavigation trong component con).
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
