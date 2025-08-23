import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, View, Text, ActivityIndicator } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AuthVerificationScreen from '../screens/auth/VerificationScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import JobDetailsScreen from '../screens/JobDetailsScreen';
import ChatScreen from '../screens/ChatScreen';
import CreateJobScreen from '../screens/CreateJobScreen';
import JobFiltersScreen from '../screens/JobFiltersScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MyJobsScreen from '../screens/MyJobsScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SupportScreen from '../screens/SupportScreen';
import VerificationScreen from '../screens/VerificationScreen';
import PerformanceTestScreen from '../screens/PerformanceTestScreen';

// Legacy Main Screens (keeping for compatibility)
import LegacyHomeScreen from '../screens/main/HomeScreen';
import LegacyProfileScreen from '../screens/main/ProfileScreen';
import JobsScreen from '../screens/main/JobsScreen';
import LegacyChatScreen from '../screens/main/ChatScreen';
import PaymentScreen from '../screens/main/PaymentScreen';
import LegacyJobDetailsScreen from '../screens/main/JobDetailsScreen';
import PaymentDetailsScreen from '../screens/main/PaymentDetailsScreen';

// Forms
import JobRequestForm from '../screens/forms/JobRequestForm';
import JobAcceptanceForm from '../screens/forms/JobAcceptanceForm';
import JobCompletionForm from '../screens/forms/JobCompletionForm';
import JobSatisfactionForm from '../screens/forms/JobSatisfactionForm';
import JobDisputeForm from '../screens/forms/JobDisputeForm';
import PaymentDetailsForm from '../screens/forms/PaymentDetailsForm';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main screens
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Jobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarBadge: undefined,
        }}
      />
      <Tab.Screen 
        name="Jobs" 
        component={MyJobsScreen}
        options={{
          tabBarLabel: 'My Jobs',
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge: undefined, // This can be dynamically set based on unread messages
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator for main app flow
const MainStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="JobDetails" 
        component={JobDetailsScreen}
        options={{
          title: 'Job Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="JobRequest" 
        component={JobRequestForm}
        options={{
          title: 'Create Job Request',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="JobAcceptance" 
        component={JobAcceptanceForm}
        options={{
          title: 'Accept Job',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="JobCompletion" 
        component={JobCompletionForm}
        options={{
          title: 'Complete Job',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="JobSatisfaction" 
        component={JobSatisfactionForm}
        options={{
          title: 'Job Feedback',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="JobDispute" 
        component={JobDisputeForm}
        options={{
          title: 'File Dispute',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{
          title: 'Payment',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="PaymentDetails" 
        component={PaymentDetailsForm}
        options={{
          title: 'Payment Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="PaymentDetailsScreen" 
        component={PaymentDetailsScreen}
        options={{
          title: 'Payment Information',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="CreateJob" 
        component={CreateJobScreen}
        options={{
          title: 'Create Job',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="JobFilters" 
        component={JobFiltersScreen}
        options={{
          title: 'Filter Jobs',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="PaymentHistory" 
        component={PaymentHistoryScreen}
        options={{
          title: 'Payment History',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Support" 
        component={SupportScreen}
        options={{
          title: 'Support',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Verification" 
        component={VerificationScreen}
        options={{
          title: 'Identity Verification',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="PerformanceTest" 
        component={PerformanceTestScreen}
        options={{
          title: 'Performance Test',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Auth Stack Navigator
const AuthStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          title: 'Create Account',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="AuthVerification" 
        component={AuthVerificationScreen}
        options={{
          title: 'Verify Identity',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const isLoading = useSelector(state => state.auth.loading);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="MainApp" component={MainStackNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStackNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;