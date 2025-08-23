import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Title, Avatar, Divider, Switch, List, TextInput, Chip, Dialog, Portal } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile, updateUserProfile, switchUserCategory } from '../../store/slices/userSlice';
import { logout } from '../../store/slices/authSlice';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { profile, currentCategory, loading, skills } = useSelector(state => state.user);
  
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  
  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);
  
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || '');
      setBio(profile.bio || '');
    }
  }, [profile]);
  
  const handleSaveProfile = () => {
    const updatedProfile = {
      fullName,
      phone,
      email,
      bio,
    };
    
    dispatch(updateUserProfile(updatedProfile))
      .unwrap()
      .then(() => {
        setIsEditing(false);
      });
  };
  
  const handleSwitchCategory = (newCategory) => {
    dispatch(switchUserCategory(newCategory))
      .unwrap()
      .then(() => {
        setShowCategoryDialog(false);
      });
  };
  
  const handleLogout = () => {
    dispatch(logout());
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };
  
  const renderProfileHeader = () => (
    <Card style={styles.profileHeaderCard}>
      <Card.Content>
        <View style={styles.profileHeader}>
          <Avatar.Text 
            size={80} 
            label={profile?.fullName?.substring(0, 2).toUpperCase() || user?.fullName?.substring(0, 2).toUpperCase() || '??'} 
            backgroundColor="#007AFF"
          />
          <View style={styles.profileInfo}>
            <Title style={styles.profileName}>{profile?.fullName || user?.fullName}</Title>
            <Chip 
              icon="account" 
              style={styles.categoryChip}
            >
              {currentCategory === 'service_provider' ? 'Service Provider' : 'Service Requirer'}
            </Chip>
            <Button 
              mode="text" 
              icon="swap-horizontal" 
              onPress={() => setShowCategoryDialog(true)}
              style={styles.switchButton}
            >
              Switch Category
            </Button>
          </View>
        </View>
        
        <View style={styles.verificationContainer}>
          <View style={styles.verificationStatus}>
            <Text style={styles.verificationLabel}>Verification Status:</Text>
            <Chip 
              icon={profile?.isVerified ? "check-circle" : "alert-circle"}
              style={[styles.verificationChip, {backgroundColor: profile?.isVerified ? '#E8F5E9' : '#FFEBEE'}]}
            >
              {profile?.isVerified ? 'Verified' : 'Not Verified'}
            </Chip>
          </View>
          
          {!profile?.isVerified && (
            <Button 
              mode="outlined" 
              icon="shield-account" 
              onPress={() => navigation.navigate('VerificationScreen')}
              style={styles.verifyButton}
            >
              Complete Verification
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
  
  const renderProfileDetails = () => (
    <Card style={styles.profileDetailsCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Profile Information</Title>
          {!isEditing && (
            <Button 
              mode="text" 
              icon="pencil" 
              onPress={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </View>
        
        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
            />
            
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
            />
            
            <TextInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.actionButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setIsEditing(false)} 
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              
              <Button 
                mode="contained" 
                onPress={handleSaveProfile} 
                style={styles.saveButton}
                loading={loading}
                disabled={loading}
              >
                Save
              </Button>
            </View>
          </View>
        ) : (
          <View>
            <List.Item
              title="Full Name"
              description={profile?.fullName || 'Not set'}
              left={props => <List.Icon {...props} icon="account" />}
            />
            
            <Divider />
            
            <List.Item
              title="Phone Number"
              description={profile?.phone || 'Not set'}
              left={props => <List.Icon {...props} icon="phone" />}
            />
            
            <Divider />
            
            <List.Item
              title="Email"
              description={profile?.email || 'Not set'}
              left={props => <List.Icon {...props} icon="email" />}
            />
            
            <Divider />
            
            <List.Item
              title="Bio"
              description={profile?.bio || 'No bio provided'}
              left={props => <List.Icon {...props} icon="text" />}
              descriptionNumberOfLines={3}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
  
  const renderSkillsSection = () => {
    // Only show for service providers
    if (currentCategory !== 'service_provider') return null;
    
    return (
      <Card style={styles.skillsCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Professional Skills</Title>
            <Button 
              mode="text" 
              icon="pencil" 
              onPress={() => navigation.navigate('EditSkills')}
            >
              Edit
            </Button>
          </View>
          
          {skills && skills.length > 0 ? (
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <Chip key={index} style={styles.skillChip}>
                  {skill}
                </Chip>
              ))}
            </View>
          ) : (
            <Text style={styles.noSkillsText}>
              No skills added yet. Add your professional skills to help clients find you.
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  const renderSettingsSection = () => (
    <Card style={styles.settingsCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Settings</Title>
        
        <List.Item
          title="Notifications"
          description="Manage your notification preferences"
          left={props => <List.Icon {...props} icon="bell" />}
          right={props => <Switch value={true} />}
          onPress={() => {}}
        />
        
        <Divider />
        
        <List.Item
          title="Payment Methods"
          description="Manage your payment methods"
          left={props => <List.Icon {...props} icon="credit-card" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('PaymentMethods')}
        />
        
        <Divider />
        
        <List.Item
          title="Security"
          description="Update password and security settings"
          left={props => <List.Icon {...props} icon="shield-lock" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('SecuritySettings')}
        />
        
        <Divider />
        
        <List.Item
          title="Help & Support"
          description="Get help and contact support"
          left={props => <List.Icon {...props} icon="help-circle" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Support')}
        />
        
        <Divider />
        
        <List.Item
          title="About"
          description="App information and legal"
          left={props => <List.Icon {...props} icon="information" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('About')}
        />
        
        <Divider />
        
        <List.Item
          title="Logout"
          description="Sign out of your account"
          left={props => <List.Icon {...props} icon="logout" color="#FF3B30" />}
          onPress={handleLogout}
          titleStyle={{ color: '#FF3B30' }}
        />
      </Card.Content>
    </Card>
  );
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderProfileHeader()}
        {renderProfileDetails()}
        {renderSkillsSection()}
        {renderSettingsSection()}
      </ScrollView>
      
      <Portal>
        <Dialog visible={showCategoryDialog} onDismiss={() => setShowCategoryDialog(false)}>
          <Dialog.Title>Switch User Category</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              You are currently a {currentCategory === 'service_provider' ? 'Service Provider' : 'Service Requirer'}.
              Would you like to switch to {currentCategory === 'service_provider' ? 'Service Requirer' : 'Service Provider'}?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCategoryDialog(false)}>Cancel</Button>
            <Button 
              onPress={() => handleSwitchCategory(
                currentCategory === 'service_provider' ? 'service_requirer' : 'service_provider'
              )}
            >
              Switch
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  categoryChip: {
    marginTop: 8,
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-start',
  },
  switchButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  verificationContainer: {
    marginTop: 8,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#555',
  },
  verificationChip: {
    height: 30,
  },
  verifyButton: {
    marginTop: 8,
  },
  profileDetailsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editForm: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  skillsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    margin: 4,
    backgroundColor: '#F0F0F0',
  },
  noSkillsText: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  settingsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  dialogText: {
    lineHeight: 22,
  },
});

export default ProfileScreen;