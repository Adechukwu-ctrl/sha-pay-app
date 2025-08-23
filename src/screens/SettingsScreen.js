import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  ThemedHeader,
  ThemedCard,
  ThemedText,
  ThemedButton,
  ThemedListItem,
  ThemedModal,
  ThemedBadge,
  SegmentedControl,
  LoadingSpinner,
} from '../components/ui';
import { colors, spacing } from '../theme';
import {
  updateUserSettings,
  logout,
  deleteAccount,
} from '../store/slices/authSlice';
import { clearAllData } from '../store/slices/appSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const { theme, language } = useSelector((state) => state.app);
  
  const [settings, setSettings] = useState({
    notifications: {
      push: true,
      email: true,
      sms: false,
      jobAlerts: true,
      paymentAlerts: true,
      chatMessages: true,
      marketing: false,
    },
    privacy: {
      profileVisibility: 'public', // public, private, contacts
      showOnlineStatus: true,
      showLastSeen: true,
      allowDirectMessages: true,
    },
    security: {
      twoFactorAuth: false,
      biometricLogin: false,
      sessionTimeout: 30, // minutes
    },
    preferences: {
      theme: 'system', // light, dark, system
      language: 'en',
      currency: 'NGN',
      autoAcceptJobs: false,
      showJobRecommendations: true,
    },
  });
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const themeOptions = [
    { label: 'Light', key: 'light' },
    { label: 'Dark', key: 'dark' },
    { label: 'System', key: 'system' },
  ];
  
  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Hausa', value: 'ha' },
    { label: 'Yoruba', value: 'yo' },
    { label: 'Igbo', value: 'ig' },
  ];
  
  const currencyOptions = [
    { label: 'Nigerian Naira (₦)', value: 'NGN' },
    { label: 'US Dollar ($)', value: 'USD' },
    { label: 'Euro (€)', value: 'EUR' },
  ];
  
  const profileVisibilityOptions = [
    { label: 'Public', key: 'public' },
    { label: 'Private', key: 'private' },
    { label: 'Contacts Only', key: 'contacts' },
  ];
  
  const sessionTimeoutOptions = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: 'Never', value: 0 },
  ];
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const saveSettings = async (newSettings) => {
    try {
      setSaving(true);
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      await dispatch(updateUserSettings(newSettings)).unwrap();
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const updateSetting = (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    };
    saveSettings(newSettings);
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
              await dispatch(clearAllData());
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setShowDeleteModal(true),
        },
      ]
    );
  };
  
  const confirmDeleteAccount = async () => {
    try {
      await dispatch(deleteAccount()).unwrap();
      await dispatch(clearAllData());
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };
  
  const openURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };
  
  const renderAccountSection = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Account
      </ThemedText>
      
      <ThemedListItem
        title="Edit Profile"
        subtitle="Update your personal information"
        leftIcon="user"
        rightIcon="chevron-right"
        onPress={() => navigation.navigate('EditProfile')}
      />
      
      <ThemedListItem
        title="Verification Status"
        subtitle={user?.verified ? 'Verified' : 'Not verified'}
        leftIcon="shield"
        rightComponent={
          <ThemedBadge
            variant={user?.verified ? 'success' : 'warning'}
          >
            {user?.verified ? 'Verified' : 'Pending'}
          </ThemedBadge>
        }
        onPress={() => navigation.navigate('Verification')}
        style={{ marginTop: spacing[2] }}
      />
      
      <ThemedListItem
        title="Payment Methods"
        subtitle="Manage your payment options"
        leftIcon="credit-card"
        rightIcon="chevron-right"
        onPress={() => navigation.navigate('PaymentMethods')}
        style={{ marginTop: spacing[2] }}
      />
    </ThemedCard>
  );
  
  const renderPreferencesSection = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Preferences
      </ThemedText>
      
      <ThemedListItem
        title="Notifications"
        subtitle="Manage notification settings"
        leftIcon="bell"
        rightIcon="chevron-right"
        onPress={() => setShowNotificationModal(true)}
      />
      
      <ThemedListItem
        title="Privacy"
        subtitle="Control your privacy settings"
        leftIcon="lock"
        rightIcon="chevron-right"
        onPress={() => setShowPrivacyModal(true)}
        style={{ marginTop: spacing[2] }}
      />
      
      <ThemedListItem
        title="Security"
        subtitle="Manage security options"
        leftIcon="shield"
        rightIcon="chevron-right"
        onPress={() => setShowSecurityModal(true)}
        style={{ marginTop: spacing[2] }}
      />
      
      <ThemedListItem
        title="App Preferences"
        subtitle="Theme, language, and more"
        leftIcon="settings"
        rightIcon="chevron-right"
        onPress={() => setShowPreferencesModal(true)}
        style={{ marginTop: spacing[2] }}
      />
    </ThemedCard>
  );
  
  const renderSupportSection = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Support & Legal
      </ThemedText>
      
      <ThemedListItem
        title="Help Center"
        subtitle="Get help and support"
        leftIcon="help-circle"
        rightIcon="chevron-right"
        onPress={() => navigation.navigate('Help')}
      />
      
      <ThemedListItem
        title="Contact Support"
        subtitle="Get in touch with our team"
        leftIcon="message-circle"
        rightIcon="chevron-right"
        onPress={() => navigation.navigate('ContactSupport')}
        style={{ marginTop: spacing[2] }}
      />
      
      <ThemedListItem
        title="Terms of Service"
        subtitle="Read our terms and conditions"
        leftIcon="file-text"
        rightIcon="external-link"
        onPress={() => openURL('https://shapay.com/terms')}
        style={{ marginTop: spacing[2] }}
      />
      
      <ThemedListItem
        title="Privacy Policy"
        subtitle="Learn about our privacy practices"
        leftIcon="shield"
        rightIcon="external-link"
        onPress={() => openURL('https://shapay.com/privacy')}
        style={{ marginTop: spacing[2] }}
      />
      
      <ThemedListItem
        title="Rate App"
        subtitle="Rate us on the app store"
        leftIcon="star"
        rightIcon="external-link"
        onPress={() => openURL('https://apps.apple.com/app/shapay')}
        style={{ marginTop: spacing[2] }}
      />
      
      <ThemedListItem
        title="Performance Test"
        subtitle="Test mobile app performance"
        leftIcon="activity"
        rightIcon="chevron-right"
        onPress={() => navigation.navigate('PerformanceTest')}
        style={{ marginTop: spacing[2] }}
      />
    </ThemedCard>
  );
  
  const renderDangerSection = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Account Actions
      </ThemedText>
      
      <ThemedListItem
        title="Logout"
        subtitle="Sign out of your account"
        leftIcon="log-out"
        onPress={handleLogout}
        titleStyle={{ color: colors.warning }}
      />
      
      <ThemedListItem
        title="Delete Account"
        subtitle="Permanently delete your account"
        leftIcon="trash-2"
        onPress={handleDeleteAccount}
        titleStyle={{ color: colors.error }}
        style={{ marginTop: spacing[2] }}
      />
    </ThemedCard>
  );
  
  const renderNotificationModal = () => (
    <ThemedModal
      visible={showNotificationModal}
      onClose={() => setShowNotificationModal(false)}
      title="Notification Settings"
      size="large"
    >
      <ScrollView style={{ maxHeight: 500 }}>
        <View style={styles.modalSection}>
          <ThemedText variant="body1" style={{ marginBottom: spacing[3] }}>
            Push Notifications
          </ThemedText>
          
          <ThemedListItem
            title="Job Alerts"
            subtitle="New job opportunities"
            rightComponent={
              <ThemedButton
                variant={settings.notifications.jobAlerts ? 'primary' : 'outline'}
                size="small"
                onPress={() => updateSetting('notifications', 'jobAlerts', !settings.notifications.jobAlerts)}
              >
                {settings.notifications.jobAlerts ? 'On' : 'Off'}
              </ThemedButton>
            }
          />
          
          <ThemedListItem
            title="Payment Alerts"
            subtitle="Payment confirmations and updates"
            rightComponent={
              <ThemedButton
                variant={settings.notifications.paymentAlerts ? 'primary' : 'outline'}
                size="small"
                onPress={() => updateSetting('notifications', 'paymentAlerts', !settings.notifications.paymentAlerts)}
              >
                {settings.notifications.paymentAlerts ? 'On' : 'Off'}
              </ThemedButton>
            }
            style={{ marginTop: spacing[2] }}
          />
          
          <ThemedListItem
            title="Chat Messages"
            subtitle="New messages from other users"
            rightComponent={
              <ThemedButton
                variant={settings.notifications.chatMessages ? 'primary' : 'outline'}
                size="small"
                onPress={() => updateSetting('notifications', 'chatMessages', !settings.notifications.chatMessages)}
              >
                {settings.notifications.chatMessages ? 'On' : 'Off'}
              </ThemedButton>
            }
            style={{ marginTop: spacing[2] }}
          />
        </View>
      </ScrollView>
    </ThemedModal>
  );
  
  const renderPrivacyModal = () => (
    <ThemedModal
      visible={showPrivacyModal}
      onClose={() => setShowPrivacyModal(false)}
      title="Privacy Settings"
      size="large"
    >
      <ScrollView style={{ maxHeight: 500 }}>
        <View style={styles.modalSection}>
          <ThemedText variant="body2" style={{ marginBottom: spacing[3] }}>
            Profile Visibility
          </ThemedText>
          
          <SegmentedControl
            segments={profileVisibilityOptions}
            selectedIndex={profileVisibilityOptions.findIndex(opt => opt.key === settings.privacy.profileVisibility)}
            onSelectionChange={(index) => updateSetting('privacy', 'profileVisibility', profileVisibilityOptions[index].key)}
          />
          
          <View style={{ marginTop: spacing[4] }}>
            <ThemedListItem
              title="Show Online Status"
              subtitle="Let others see when you're online"
              rightComponent={
                <ThemedButton
                  variant={settings.privacy.showOnlineStatus ? 'primary' : 'outline'}
                  size="small"
                  onPress={() => updateSetting('privacy', 'showOnlineStatus', !settings.privacy.showOnlineStatus)}
                >
                  {settings.privacy.showOnlineStatus ? 'On' : 'Off'}
                </ThemedButton>
              }
            />
            
            <ThemedListItem
              title="Allow Direct Messages"
              subtitle="Allow users to message you directly"
              rightComponent={
                <ThemedButton
                  variant={settings.privacy.allowDirectMessages ? 'primary' : 'outline'}
                  size="small"
                  onPress={() => updateSetting('privacy', 'allowDirectMessages', !settings.privacy.allowDirectMessages)}
                >
                  {settings.privacy.allowDirectMessages ? 'On' : 'Off'}
                </ThemedButton>
              }
              style={{ marginTop: spacing[2] }}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedModal>
  );
  
  const renderPreferencesModal = () => (
    <ThemedModal
      visible={showPreferencesModal}
      onClose={() => setShowPreferencesModal(false)}
      title="App Preferences"
      size="large"
    >
      <ScrollView style={{ maxHeight: 500 }}>
        <View style={styles.modalSection}>
          <ThemedText variant="body2" style={{ marginBottom: spacing[3] }}>
            Theme
          </ThemedText>
          
          <SegmentedControl
            segments={themeOptions}
            selectedIndex={themeOptions.findIndex(opt => opt.key === settings.preferences.theme)}
            onSelectionChange={(index) => updateSetting('preferences', 'theme', themeOptions[index].key)}
          />
          
          <View style={{ marginTop: spacing[4] }}>
            <ThemedText variant="body2" style={{ marginBottom: spacing[3] }}>
              Language
            </ThemedText>
            
            {languageOptions.map((lang, index) => (
              <ThemedListItem
                key={index}
                title={lang.label}
                rightComponent={
                  settings.preferences.language === lang.value ? (
                    <ThemedBadge variant="primary">✓</ThemedBadge>
                  ) : null
                }
                onPress={() => updateSetting('preferences', 'language', lang.value)}
                style={index > 0 ? { marginTop: spacing[1] } : {}}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedModal>
  );
  
  return (
    <View style={styles.container}>
      <ThemedHeader
        title="Settings"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderAccountSection()}
        {renderPreferencesSection()}
        {renderSupportSection()}
        {renderDangerSection()}
        
        {/* App Version */}
        <View style={styles.versionContainer}>
          <ThemedText variant="caption" style={styles.versionText}>
            Sha Pay! v1.0.0
          </ThemedText>
        </View>
      </ScrollView>
      
      {/* Modals */}
      {renderNotificationModal()}
      {renderPrivacyModal()}
      {renderPreferencesModal()}
      
      {/* Delete Account Confirmation */}
      <ThemedModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="medium"
      >
        <View style={styles.deleteContent}>
          <ThemedText variant="body1" style={{ marginBottom: spacing[4] }}>
            This action cannot be undone. All your data, including:
          </ThemedText>
          
          <View style={styles.deleteList}>
            <ThemedText variant="body2">• Profile information</ThemedText>
            <ThemedText variant="body2">• Job history</ThemedText>
            <ThemedText variant="body2">• Payment records</ThemedText>
            <ThemedText variant="body2">• Chat messages</ThemedText>
            <ThemedText variant="body2">• Reviews and ratings</ThemedText>
          </View>
          
          <ThemedText variant="body1" style={{ marginTop: spacing[4], marginBottom: spacing[4] }}>
            Will be permanently deleted.
          </ThemedText>
          
          <View style={styles.deleteActions}>
            <ThemedButton
              variant="outline"
              onPress={() => setShowDeleteModal(false)}
              style={{ flex: 1, marginRight: spacing[2] }}
            >
              Cancel
            </ThemedButton>
            
            <ThemedButton
              variant="error"
              onPress={confirmDeleteAccount}
              style={{ flex: 1 }}
              loading={loading}
            >
              Delete Account
            </ThemedButton>
          </View>
        </View>
      </ThemedModal>
      
      {saving && (
        <View style={styles.savingOverlay}>
          <LoadingSpinner size="small" />
          <ThemedText variant="caption" style={{ marginTop: spacing[2] }}>
            Saving...
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    flex: 1,
  },
  card: {
    margin: spacing[4],
    marginBottom: spacing[3],
  },
  modalSection: {
    paddingVertical: spacing[2],
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  versionText: {
    color: colors.text.secondary,
  },
  deleteContent: {
    paddingVertical: spacing[2],
  },
  deleteList: {
    paddingLeft: spacing[3],
  },
  deleteActions: {
    flexDirection: 'row',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingsScreen;