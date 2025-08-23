import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Title, HelperText, Chip, Divider, Switch, Card, Paragraph, Snackbar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { createJobRequest } from '../../store/slices/jobsSlice';
import { setTemporaryCategory } from '../../store/slices/userSlice';
import DateTimePicker from '../../components/DateTimePicker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const JobRequestForm = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default: 1 week from now
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [switchCategory, setSwitchCategory] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [serviceCharge, setServiceCharge] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.jobs);
  const { currentCategory } = useSelector(state => state.user);
  const serviceChargeRate = 0.025; // 2.5% service charge
  
  // Handle category switching if user is a service provider
  const handleCategorySwitch = (value) => {
    setSwitchCategory(value);
    if (value) {
      dispatch(setTemporaryCategory('requirer'));
    } else {
      dispatch(setTemporaryCategory(currentCategory));
    }
  };
  
  useEffect(() => {
    if (amount) {
      const charge = parseFloat(amount) * serviceChargeRate;
      const total = parseFloat(amount) + charge;
      setServiceCharge(charge);
      setTotalAmount(total);
    } else {
      setServiceCharge(0);
      setTotalAmount(0);
    }
  }, [amount]);

  const validateForm = () => {
    const errors = {};
    
    if (!title.trim()) errors.title = 'Job title is required';
    if (!description.trim()) errors.description = 'Job description is required';
    if (!amount || parseFloat(amount) <= 0) errors.amount = 'Valid amount is required';
    if (!deadline) errors.deadline = 'Deadline is required';
    if (!location.trim()) errors.location = 'Location is required';
    if (skills.length === 0) errors.skills = 'At least one skill is required';
    
    // Check if deadline is in the future
    if (deadline && new Date(deadline) <= new Date()) {
      errors.deadline = 'Deadline must be in the future';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
      // Clear skills validation error if exists
      if (validationErrors.skills) {
        setValidationErrors(prev => ({ ...prev, skills: null }));
      }
    }
  };
  
  const removeSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
  };
  
  const handleSubmit = () => {
    if (!validateForm()) {
      setSnackbarMessage('Please fix the errors before submitting');
      setSnackbarVisible(true);
      return;
    }
    
    const jobData = {
      title,
      description,
      amount: parseFloat(amount),
      deadline,
      location,
      requiredSkills: skills,
      serviceCharge,
      totalAmount
    };
    
    dispatch(createJobRequest(jobData))
      .unwrap()
      .then(() => {
        // Navigate to payment page
        navigation.navigate('Payment', { amount: totalAmount });
      });
  };

  const handleDismissSnackbar = () => {
    setSnackbarVisible(false);
  };
  
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.title}>Request a Service</Title>
            <Paragraph style={styles.subtitle}>
              Describe the job you need done. A 2.5% service fee will be added.
            </Paragraph>
          </Card.Content>
        </Card>
      
      {currentCategory === 'provider' && (
        <View style={styles.switchContainer}>
          <Text>Switch to Service Requirer for this job</Text>
          <Switch 
            value={switchCategory} 
            onValueChange={handleCategorySwitch} 
          />
        </View>
      )}
      
      <Divider style={styles.divider} />
      
      <View style={styles.formContainer}>
        <TextInput
          label="Job Title"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (validationErrors.title) {
              setValidationErrors(prev => ({ ...prev, title: null }));
            }
          }}
          mode="outlined"
          style={styles.input}
          error={!!validationErrors.title}
        />
        {validationErrors.title && (
          <HelperText type="error">{validationErrors.title}</HelperText>
        )}
        
        <TextInput
          label="Job Description"
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            if (validationErrors.description) {
              setValidationErrors(prev => ({ ...prev, description: null }));
            }
          }}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={4}
          error={!!validationErrors.description}
        />
        {validationErrors.description && (
          <HelperText type="error">{validationErrors.description}</HelperText>
        )}
        
        <TextInput
          label="Budget Amount (₦)"
          value={amount}
          onChangeText={(text) => {
            setAmount(text);
            if (validationErrors.amount) {
              setValidationErrors(prev => ({ ...prev, amount: null }));
            }
          }}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          error={!!validationErrors.amount}
        />
        {validationErrors.amount && (
          <HelperText type="error">{validationErrors.amount}</HelperText>
        )}
        
        {amount && (
          <Card style={styles.costBreakdownCard}>
            <Card.Content>
              <Text style={styles.costTitle}>Cost Breakdown</Text>
              <View style={styles.costRow}>
                <Text>Job Amount:</Text>
                <Text>₦{parseFloat(amount || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.costRow}>
                <Text>Service Fee (2.5%):</Text>
                <Text>₦{serviceCharge.toLocaleString()}</Text>
              </View>
              <Divider style={styles.costDivider} />
              <View style={[styles.costRow, styles.totalRow]}>
                <Text style={styles.totalText}>Total Amount:</Text>
                <Text style={styles.totalText}>₦{totalAmount.toLocaleString()}</Text>
              </View>
            </Card.Content>
          </Card>
        )}
        
        <Text style={styles.sectionTitle}>Deadline</Text>
        <DateTimePicker 
          date={deadline} 
          onDateChange={setDeadline} 
        />
        
        <TextInput
          label="Location"
          value={location}
          onChangeText={(text) => {
            setLocation(text);
            if (validationErrors.location) {
              setValidationErrors(prev => ({ ...prev, location: null }));
            }
          }}
          mode="outlined"
          style={styles.input}
          error={!!validationErrors.location}
          left={<TextInput.Icon icon="map-marker" />}
        />
        {validationErrors.location && (
          <HelperText type="error">{validationErrors.location}</HelperText>
        )}
        
        <Text style={styles.sectionTitle}>Required Skills</Text>
        <View style={styles.skillsInputContainer}>
          <TextInput
            label="Add Skill"
            value={skillInput}
            onChangeText={setSkillInput}
            mode="outlined"
            style={styles.skillInput}
            onSubmitEditing={addSkill}
            error={!!validationErrors.skills}
          />
          <Button 
            mode="contained" 
            onPress={addSkill}
            style={styles.addButton}
            disabled={!skillInput.trim()}
          >
            Add
          </Button>
        </View>
        {validationErrors.skills && (
          <HelperText type="error">{validationErrors.skills}</HelperText>
        )}
        
        <View style={styles.skillsContainer}>
          {skills.map((skill, index) => (
            <Chip 
              key={index} 
              onClose={() => removeSkill(skill)}
              style={styles.chip}
            >
              {skill}
            </Chip>
          ))}
        </View>
        
        {error && <HelperText type="error">{error}</HelperText>}
        
        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          style={styles.button}
          loading={loading}
          disabled={loading}
          icon="credit-card"
        >
          Submit and Proceed to Payment
        </Button>
      </View>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={handleDismissSnackbar}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: handleDismissSnackbar,
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerCard: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  divider: {
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 5,
  },
  skillsInputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  skillInput: {
    flex: 1,
    marginRight: 10,
  },
  addButton: {
    justifyContent: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  chip: {
    margin: 4,
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
  },
  costBreakdownCard: {
    marginTop: 10,
    marginBottom: 15,
  },
  costTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  costDivider: {
    marginVertical: 10,
  },
  totalRow: {
    marginTop: 5,
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default JobRequestForm;