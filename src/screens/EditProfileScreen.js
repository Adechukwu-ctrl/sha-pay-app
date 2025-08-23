import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  ThemedHeader,
  ThemedCard,
  ThemedText,
  ThemedInput,
  ThemedButton,
  ThemedAvatar,
  ThemedBadge,
  ThemedModal,
  SegmentedControl,
  LoadingSpinner,
} from '../components/ui';
import { colors, spacing } from '../theme';
import {
  updateProfile,
  uploadProfileImage,
  updateSkills,
  updateLocation,
} from '../store/slices/authSlice';
import { selectUser } from '../store/slices/authSlice';
// import { launchImageLibrary } from 'react-native-image-picker'; // Not available in web

const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { loading } = useSelector((state) => state.auth);
  
  // Profile form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    linkedIn: user?.socialLinks?.linkedIn || '',
    twitter: user?.socialLinks?.twitter || '',
    instagram: user?.socialLinks?.instagram || '',
  });
  
  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [errors, setErrors] = useState({});
  
  const availableSkills = [
    'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design',
    'Content Writing', 'Digital Marketing', 'SEO', 'Social Media Management',
    'Data Analysis', 'Photography', 'Video Editing', 'Translation',
    'Virtual Assistant', 'Customer Service', 'Accounting', 'Legal Services',
    'Tutoring', 'Consulting', 'Project Management', 'Sales',
  ];
  
  useEffect(() => {
    // Update form data when user data changes
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        linkedIn: user.socialLinks?.linkedIn || '',
        twitter: user.socialLinks?.twitter || '',
        instagram: user.socialLinks?.instagram || '',
      });
      setSkills(user.skills || []);
    }
  }, [user]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number is invalid';
    }
    
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website URL must start with http:// or https://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };
    
    // Web-compatible image picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const imageData = {
          uri: URL.createObjectURL(file),
          type: file.type,
          name: file.name,
          size: file.size
        };
        handleImageUpload(imageData);
      }
    };
    input.click();
  };
  
  const handleImageUpload = async (image) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('image', {
        uri: image.uri,
        type: image.type,
        name: image.fileName || 'profile.jpg',
      });
      
      await dispatch(uploadProfileImage({
        userId: user.id,
        imageData: formData,
      })).unwrap();
      
      Alert.alert('Success', 'Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    if (skills.includes(newSkill.trim())) {
      Alert.alert('Error', 'Skill already added');
      return;
    }
    
    if (skills.length >= 10) {
      Alert.alert('Error', 'Maximum 10 skills allowed');
      return;
    }
    
    setSkills(prev => [...prev, newSkill.trim()]);
    setNewSkill('');
    setShowSkillModal(false);
  };
  
  const handleRemoveSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors before saving');
      return;
    }
    
    try {
      setSaving(true);
      
      const profileData = {
        ...formData,
        socialLinks: {
          linkedIn: formData.linkedIn,
          twitter: formData.twitter,
          instagram: formData.instagram,
        },
      };
      
      await dispatch(updateProfile({
        userId: user.id,
        profileData,
      })).unwrap();
      
      await dispatch(updateSkills({
        userId: user.id,
        skills,
      })).unwrap();
      
      Alert.alert(
        'Success',
        'Profile updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const renderProfileImage = () => (
    <View style={styles.imageSection}>
      <ThemedAvatar
        source={user?.profileImage}
        name={`${user?.firstName} ${user?.lastName}`}
        size={100}
        style={styles.profileImage}
      />
      
      <ThemedButton
        variant="outline"
        size="small"
        onPress={handleImagePicker}
        loading={uploading}
        disabled={uploading}
        style={styles.changeImageButton}
      >
        {uploading ? 'Uploading...' : 'Change Photo'}
      </ThemedButton>
    </View>
  );
  
  const renderBasicInfo = () => (
    <ThemedCard style={styles.section}>
      <ThemedText variant="h6" style={styles.sectionTitle}>
        Basic Information
      </ThemedText>
      
      <View style={styles.row}>
        <ThemedInput
          label="First Name"
          placeholder="Enter first name"
          value={formData.firstName}
          onChangeText={(value) => handleInputChange('firstName', value)}
          error={errors.firstName}
          style={[styles.input, { marginRight: spacing[2] }]}
        />
        
        <ThemedInput
          label="Last Name"
          placeholder="Enter last name"
          value={formData.lastName}
          onChangeText={(value) => handleInputChange('lastName', value)}
          error={errors.lastName}
          style={styles.input}
        />
      </View>
      
      <ThemedInput
        label="Email"
        placeholder="Enter email address"
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      
      <ThemedInput
        label="Phone Number"
        placeholder="Enter phone number"
        value={formData.phone}
        onChangeText={(value) => handleInputChange('phone', value)}
        error={errors.phone}
        keyboardType="phone-pad"
        style={styles.input}
      />
      
      <ThemedInput
        label="Location"
        placeholder="Enter your location"
        value={formData.location}
        onChangeText={(value) => handleInputChange('location', value)}
        style={styles.input}
      />
      
      <ThemedInput
        label="Bio"
        placeholder="Tell us about yourself..."
        value={formData.bio}
        onChangeText={(value) => handleInputChange('bio', value)}
        multiline
        numberOfLines={4}
        style={styles.input}
      />
    </ThemedCard>
  );
  
  const renderSkillsSection = () => (
    <ThemedCard style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="h6" style={styles.sectionTitle}>
          Skills
        </ThemedText>
        
        <ThemedButton
          variant="outline"
          size="small"
          onPress={() => setShowSkillModal(true)}
          disabled={skills.length >= 10}
        >
          Add Skill
        </ThemedButton>
      </View>
      
      {skills.length === 0 ? (
        <ThemedText variant="body2" style={styles.emptyText}>
          No skills added yet. Add your skills to attract more clients.
        </ThemedText>
      ) : (
        <View style={styles.skillsContainer}>
          {skills.map((skill, index) => (
            <ThemedBadge
              key={index}
              variant="outline"
              style={styles.skillBadge}
              onPress={() => handleRemoveSkill(skill)}
            >
              {skill} ×
            </ThemedBadge>
          ))}
        </View>
      )}
      
      <ThemedText variant="caption" style={styles.skillsNote}>
        Maximum 10 skills. Tap on a skill to remove it.
      </ThemedText>
    </ThemedCard>
  );
  
  const renderSocialLinks = () => (
    <ThemedCard style={styles.section}>
      <ThemedText variant="h6" style={styles.sectionTitle}>
        Social Links & Website
      </ThemedText>
      
      <ThemedInput
        label="Website"
        placeholder="https://yourwebsite.com"
        value={formData.website}
        onChangeText={(value) => handleInputChange('website', value)}
        error={errors.website}
        keyboardType="url"
        autoCapitalize="none"
        style={styles.input}
      />
      
      <ThemedInput
        label="LinkedIn"
        placeholder="https://linkedin.com/in/username"
        value={formData.linkedIn}
        onChangeText={(value) => handleInputChange('linkedIn', value)}
        keyboardType="url"
        autoCapitalize="none"
        style={styles.input}
      />
      
      <ThemedInput
        label="Twitter"
        placeholder="https://twitter.com/username"
        value={formData.twitter}
        onChangeText={(value) => handleInputChange('twitter', value)}
        keyboardType="url"
        autoCapitalize="none"
        style={styles.input}
      />
      
      <ThemedInput
        label="Instagram"
        placeholder="https://instagram.com/username"
        value={formData.instagram}
        onChangeText={(value) => handleInputChange('instagram', value)}
        keyboardType="url"
        autoCapitalize="none"
        style={styles.input}
      />
    </ThemedCard>
  );
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedHeader
        title="Edit Profile"
        onLeftPress={() => navigation.goBack()}
        rightComponent={
          <ThemedButton
            variant="text"
            size="small"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          >
            Save
          </ThemedButton>
        }
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderProfileImage()}
        {renderBasicInfo()}
        {renderSkillsSection()}
        {renderSocialLinks()}
        
        <View style={styles.saveButtonContainer}>
          <ThemedButton
            variant="primary"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            Save Changes
          </ThemedButton>
        </View>
      </ScrollView>
      
      {/* Add Skill Modal */}
      <ThemedModal
        visible={showSkillModal}
        onClose={() => {
          setShowSkillModal(false);
          setNewSkill('');
        }}
        title="Add Skill"
        size="medium"
      >
        <View style={styles.skillModalContent}>
          <ThemedInput
            label="Skill Name"
            placeholder="Enter skill name"
            value={newSkill}
            onChangeText={setNewSkill}
            style={{ marginBottom: spacing[4] }}
          />
          
          <ThemedText variant="body2" style={{ marginBottom: spacing[3] }}>
            Popular Skills:
          </ThemedText>
          
          <View style={styles.popularSkills}>
            {availableSkills
              .filter(skill => !skills.includes(skill))
              .slice(0, 8)
              .map((skill, index) => (
                <ThemedBadge
                  key={index}
                  variant="outline"
                  style={styles.popularSkillBadge}
                  onPress={() => setNewSkill(skill)}
                >
                  {skill}
                </ThemedBadge>
              ))
            }
          </View>
          
          <View style={styles.skillModalActions}>
            <ThemedButton
              variant="outline"
              onPress={() => {
                setShowSkillModal(false);
                setNewSkill('');
              }}
              style={{ flex: 1, marginRight: spacing[2] }}
            >
              Cancel
            </ThemedButton>
            
            <ThemedButton
              variant="primary"
              onPress={handleAddSkill}
              style={{ flex: 1 }}
              disabled={!newSkill.trim()}
            >
              Add Skill
            </ThemedButton>
          </View>
        </View>
      </ThemedModal>
      
      {loading && <LoadingSpinner overlay />}
    </KeyboardAvoidingView>
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
  imageSection: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  profileImage: {
    marginBottom: spacing[4],
  },
  changeImageButton: {
    paddingHorizontal: spacing[4],
  },
  section: {
    margin: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    marginBottom: spacing[4],
    color: colors.text.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  row: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    marginBottom: spacing[4],
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing[3],
  },
  skillBadge: {
    marginRight: spacing[2],
    marginBottom: spacing[2],
    backgroundColor: colors.primary.light + '20',
    borderColor: colors.primary.main,
  },
  skillsNote: {
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginVertical: spacing[4],
  },
  saveButtonContainer: {
    padding: spacing[4],
    paddingTop: spacing[2],
  },
  saveButton: {
    width: '100%',
  },
  skillModalContent: {
    paddingVertical: spacing[2],
  },
  popularSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing[4],
  },
  popularSkillBadge: {
    marginRight: spacing[2],
    marginBottom: spacing[2],
    backgroundColor: colors.background.surface,
    borderColor: colors.border.main,
  },
  skillModalActions: {
    flexDirection: 'row',
  },
});

export default EditProfileScreen;