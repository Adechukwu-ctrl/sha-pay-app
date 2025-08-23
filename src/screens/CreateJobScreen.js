import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  ThemedHeader,
  ThemedCard,
  ThemedText,
  ThemedButton,
  ThemedInput,
  ThemedBadge,
  ThemedModal,
  SegmentedControl,
  LoadingSpinner,
} from '../components/ui';
import { colors, spacing } from '../theme';
import { createJob } from '../store/slices/jobsSlice';
import { selectUser } from '../store/slices/authSlice';

const CreateJobScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { loading } = useSelector((state) => state.jobs);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: '',
    urgency: 0, // 0: Normal, 1: Medium, 2: Urgent
    requirements: [],
    skills: [],
    duration: '',
    contactMethod: 0, // 0: In-app, 1: Phone, 2: Both
  });
  
  const [errors, setErrors] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [newRequirement, setNewRequirement] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const urgencyOptions = [
    { label: 'Normal', key: 'normal' },
    { label: 'Medium', key: 'medium' },
    { label: 'Urgent', key: 'urgent' },
  ];
  
  const contactOptions = [
    { label: 'In-App Only', key: 'app' },
    { label: 'Phone Only', key: 'phone' },
    { label: 'Both', key: 'both' },
  ];
  
  const categories = [
    'Home Services',
    'Technology',
    'Transportation',
    'Education',
    'Health & Wellness',
    'Business Services',
    'Creative Services',
    'Manual Labor',
    'Personal Care',
    'Event Services',
    'Other',
  ];
  
  const commonSkills = [
    'Communication',
    'Problem Solving',
    'Time Management',
    'Technical Skills',
    'Customer Service',
    'Physical Strength',
    'Attention to Detail',
    'Reliability',
    'Flexibility',
    'Experience',
  ];
  
  useEffect(() => {
    // Pre-fill user location if available
    if (user?.location) {
      setFormData(prev => ({ ...prev, location: user.location }));
    }
  }, [user]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Job title must be at least 10 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Job description must be at least 50 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!formData.budget.trim()) {
      newErrors.budget = 'Budget is required';
    } else if (isNaN(formData.budget) || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Please enter a valid budget amount';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
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
  
  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()],
      }));
      setNewRequirement('');
    }
  };
  
  const handleRemoveRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };
  
  const handleAddSkill = (skill) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
    }
  };
  
  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const jobData = {
        ...formData,
        budget: parseFloat(formData.budget),
        urgency: urgencyOptions[formData.urgency].key,
        contactMethod: contactOptions[formData.contactMethod].key,
        clientId: user.id,
        status: 'open',
      };
      
      const result = await dispatch(createJob(jobData)).unwrap();
      
      Alert.alert(
        'Job Posted Successfully',
        'Your job has been posted and is now visible to service providers.',
        [
          {
            text: 'View Job',
            onPress: () => {
              navigation.replace('JobDetails', { jobId: result.id });
            },
          },
          {
            text: 'Post Another',
            onPress: () => {
              // Reset form
              setFormData({
                title: '',
                description: '',
                category: '',
                budget: '',
                location: user?.location || '',
                urgency: 0,
                requirements: [],
                skills: [],
                duration: '',
                contactMethod: 0,
              });
              setErrors({});
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('Error creating job:', error);
      Alert.alert('Error', 'Failed to create job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleBackPress = () => {
    if (formData.title || formData.description) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };
  
  const renderBasicInfo = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Basic Information
      </ThemedText>
      
      <ThemedInput
        label="Job Title *"
        placeholder="e.g., Need help moving furniture"
        value={formData.title}
        onChangeText={(value) => handleInputChange('title', value)}
        error={errors.title}
        maxLength={100}
        style={{ marginBottom: spacing[4] }}
      />
      
      <ThemedInput
        label="Description *"
        placeholder="Describe what you need help with in detail..."
        value={formData.description}
        onChangeText={(value) => handleInputChange('description', value)}
        error={errors.description}
        multiline
        numberOfLines={6}
        maxLength={1000}
        style={{ marginBottom: spacing[4] }}
      />
      
      <ThemedInput
        label="Category *"
        placeholder="Select a category"
        value={formData.category}
        onPress={() => setShowCategoryModal(true)}
        rightIcon="chevron-down"
        editable={false}
        error={errors.category}
        style={{ marginBottom: spacing[4] }}
      />
      
      <View style={styles.row}>
        <ThemedInput
          label="Budget (₦) *"
          placeholder="0"
          value={formData.budget}
          onChangeText={(value) => handleInputChange('budget', value)}
          error={errors.budget}
          keyboardType="numeric"
          style={{ flex: 1, marginRight: spacing[2] }}
        />
        
        <ThemedInput
          label="Duration"
          placeholder="e.g., 2 hours"
          value={formData.duration}
          onChangeText={(value) => handleInputChange('duration', value)}
          style={{ flex: 1 }}
        />
      </View>
      
      <ThemedInput
        label="Location *"
        placeholder="Where is this job located?"
        value={formData.location}
        onChangeText={(value) => handleInputChange('location', value)}
        error={errors.location}
        leftIcon="map-marker"
      />
    </ThemedCard>
  );
  
  const renderJobDetails = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Job Details
      </ThemedText>
      
      <View style={{ marginBottom: spacing[4] }}>
        <ThemedText variant="body2" style={{ marginBottom: spacing[2] }}>
          Urgency Level
        </ThemedText>
        <SegmentedControl
          segments={urgencyOptions}
          selectedIndex={formData.urgency}
          onSelectionChange={(index) => handleInputChange('urgency', index)}
        />
      </View>
      
      <View style={{ marginBottom: spacing[4] }}>
        <ThemedText variant="body2" style={{ marginBottom: spacing[2] }}>
          Preferred Contact Method
        </ThemedText>
        <SegmentedControl
          segments={contactOptions}
          selectedIndex={formData.contactMethod}
          onSelectionChange={(index) => handleInputChange('contactMethod', index)}
        />
      </View>
      
      <View style={{ marginBottom: spacing[4] }}>
        <ThemedText variant="body2" style={{ marginBottom: spacing[2] }}>
          Requirements
        </ThemedText>
        
        <View style={styles.addItemContainer}>
          <ThemedInput
            placeholder="Add a requirement"
            value={newRequirement}
            onChangeText={setNewRequirement}
            style={{ flex: 1, marginRight: spacing[2] }}
            onSubmitEditing={handleAddRequirement}
          />
          <ThemedButton
            variant="primary"
            size="small"
            onPress={handleAddRequirement}
            disabled={!newRequirement.trim()}
          >
            Add
          </ThemedButton>
        </View>
        
        {formData.requirements.length > 0 && (
          <View style={styles.itemsList}>
            {formData.requirements.map((requirement, index) => (
              <View key={index} style={styles.itemRow}>
                <ThemedText variant="body2" style={{ flex: 1 }}>
                  • {requirement}
                </ThemedText>
                <ThemedButton
                  variant="text"
                  size="small"
                  onPress={() => handleRemoveRequirement(index)}
                >
                  Remove
                </ThemedButton>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <View>
        <View style={styles.skillsHeader}>
          <ThemedText variant="body2">
            Required Skills
          </ThemedText>
          <ThemedButton
            variant="text"
            size="small"
            onPress={() => setShowSkillsModal(true)}
          >
            Add Skills
          </ThemedButton>
        </View>
        
        {formData.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {formData.skills.map((skill, index) => (
              <ThemedBadge
                key={index}
                variant="primary"
                style={styles.skillBadge}
                onPress={() => handleRemoveSkill(skill)}
              >
                {skill} ×
              </ThemedBadge>
            ))}
          </View>
        )}
      </View>
    </ThemedCard>
  );
  
  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <ThemedButton
        variant="outline"
        onPress={handleBackPress}
        style={{ flex: 1, marginRight: spacing[3] }}
        disabled={submitting}
      >
        Cancel
      </ThemedButton>
      
      <ThemedButton
        variant="primary"
        onPress={handleSubmit}
        style={{ flex: 2 }}
        loading={submitting}
        disabled={submitting}
      >
        Post Job
      </ThemedButton>
    </View>
  );
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedHeader
        title="Create Job"
        onLeftPress={handleBackPress}
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderBasicInfo()}
        {renderJobDetails()}
        
        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        {renderActionButtons()}
      </View>
      
      {/* Category Selection Modal */}
      <ThemedModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Select Category"
        size="medium"
      >
        <ScrollView style={{ maxHeight: 400 }}>
          {categories.map((category, index) => (
            <ThemedButton
              key={index}
              variant={formData.category === category ? 'primary' : 'text'}
              onPress={() => {
                handleInputChange('category', category);
                setShowCategoryModal(false);
              }}
              style={{
                justifyContent: 'flex-start',
                marginBottom: spacing[2],
              }}
            >
              {category}
            </ThemedButton>
          ))}
        </ScrollView>
      </ThemedModal>
      
      {/* Skills Selection Modal */}
      <ThemedModal
        visible={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        title="Add Skills"
        size="medium"
      >
        <View style={{ marginBottom: spacing[4] }}>
          <ThemedInput
            placeholder="Add custom skill"
            value={newSkill}
            onChangeText={setNewSkill}
            onSubmitEditing={() => {
              if (newSkill.trim()) {
                handleAddSkill(newSkill.trim());
                setNewSkill('');
              }
            }}
            rightIcon="plus"
            onRightIconPress={() => {
              if (newSkill.trim()) {
                handleAddSkill(newSkill.trim());
                setNewSkill('');
              }
            }}
          />
        </View>
        
        <ThemedText variant="body2" style={{ marginBottom: spacing[3] }}>
          Common Skills:
        </ThemedText>
        
        <View style={styles.skillsGrid}>
          {commonSkills.map((skill, index) => (
            <ThemedBadge
              key={index}
              variant={formData.skills.includes(skill) ? 'primary' : 'outline'}
              style={styles.skillOption}
              onPress={() => {
                if (formData.skills.includes(skill)) {
                  handleRemoveSkill(skill);
                } else {
                  handleAddSkill(skill);
                }
              }}
            >
              {skill}
            </ThemedBadge>
          ))}
        </View>
      </ThemedModal>
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
  card: {
    margin: spacing[4],
    marginBottom: spacing[3],
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing[3],
  },
  itemsList: {
    marginTop: spacing[2],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  skillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing[2],
  },
  skillBadge: {
    marginRight: spacing[2],
    marginBottom: spacing[2],
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillOption: {
    marginRight: spacing[2],
    marginBottom: spacing[2],
  },
  bottomActions: {
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButtons: {
    flexDirection: 'row',
  },
});

export default CreateJobScreen;