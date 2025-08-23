import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { TextInput, Button, Text, Title, HelperText, Card, Divider, Checkbox, Paragraph, Snackbar, Switch, Chip } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { completeJob } from '../../store/slices/jobsSlice';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const JobCompletionForm = ({ navigation, route }) => {
  const { jobId, jobDetails } = route.params;
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.jobs);
  
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionImages, setCompletionImages] = useState([]);
  const [additionalWork, setAdditionalWork] = useState('');
  const [confirmCompletion, setConfirmCompletion] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [workQuality, setWorkQuality] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [challengesFaced, setChallengesFaced] = useState('');
  const [requestPayment, setRequestPayment] = useState(true);
  
  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera roll permission is needed to upload images.',
        [{ text: 'OK' }]
      );
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!completionNotes.trim()) {
      errors.completionNotes = 'Completion notes are required';
    }
    
    if (!timeSpent.trim()) {
      errors.timeSpent = 'Time spent is required';
    }
    
    if (!workQuality) {
      errors.workQuality = 'Work quality assessment is required';
    }
    
    if (!confirmCompletion) {
      errors.confirmCompletion = 'You must confirm completion to proceed';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCompletionImages([...completionImages, result.assets[0].uri]);
        setSnackbarMessage('Image added successfully');
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage('Failed to pick image');
      setSnackbarVisible(true);
    }
  };

  const removeImage = (index) => {
    const newImages = [...completionImages];
    newImages.splice(index, 1);
    setCompletionImages(newImages);
    setSnackbarMessage('Image removed');
    setSnackbarVisible(true);
  };
  
  const handleSubmit = () => {
    if (!validateForm()) {
      setSnackbarMessage('Please fix the errors before submitting');
      setSnackbarVisible(true);
      return;
    }
    
    Alert.alert(
      'Confirm Job Completion',
      'Are you sure you want to mark this job as completed? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            const completionData = {
              jobId,
              completionNotes,
              completionImages,
              additionalWork,
              workQuality,
              timeSpent,
              challengesFaced,
              requestPayment,
              completionDate: new Date().toISOString(),
            };
            
            dispatch(completeJob(completionData))
              .unwrap()
              .then(() => {
                setSnackbarMessage('Job marked as completed successfully!');
                setSnackbarVisible(true);
                setTimeout(() => {
                  navigation.navigate('MainTabs', { screen: 'Jobs' });
                }, 2000);
              })
              .catch((error) => {
                setSnackbarMessage('Failed to complete job. Please try again.');
                setSnackbarVisible(true);
              });
          },
        },
      ]
    );
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
            <Title style={styles.title}>Job Completion</Title>
            <Paragraph style={styles.subtitle}>
              Provide details about the completed work and request payment release.
            </Paragraph>
          </Card.Content>
        </Card>
      
        <Card style={styles.jobCard}>
          <Card.Content>
            <View style={styles.jobHeader}>
              <MaterialCommunityIcons name="briefcase-check" size={24} color="#4CAF50" />
              <Title style={styles.jobTitle}>{jobDetails?.title || 'Job Title'}</Title>
            </View>
            <Paragraph style={styles.jobDescription}>{jobDetails?.description || 'Job description'}</Paragraph>
            
            <Divider style={styles.divider} />
            
            <View style={styles.jobDetail}>
              <Text style={styles.jobDetailLabel}>Amount:</Text>
              <Text style={styles.jobDetailValue}>₦{jobDetails?.amount?.toLocaleString() || '0'}</Text>
            </View>
            
            <View style={styles.jobDetail}>
              <Text style={styles.jobDetailLabel}>Deadline:</Text>
              <Text style={styles.jobDetailValue}>
                {jobDetails?.deadline ? new Date(jobDetails.deadline).toLocaleDateString() : 'Not specified'}
              </Text>
            </View>
            
            <View style={styles.jobDetail}>
              <Text style={styles.jobDetailLabel}>Status:</Text>
              <Chip mode="outlined" style={styles.statusChip}>In Progress</Chip>
            </View>
          </Card.Content>
        </Card>
      
        <TextInput
          label="Completion Notes *"
          value={completionNotes}
          onChangeText={(text) => {
            setCompletionNotes(text);
            if (validationErrors.completionNotes) {
              setValidationErrors(prev => ({ ...prev, completionNotes: null }));
            }
          }}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Describe how you completed the job and any key deliverables"
          error={!!validationErrors.completionNotes}
        />
        {validationErrors.completionNotes && (
          <HelperText type="error">{validationErrors.completionNotes}</HelperText>
        )}

        <TextInput
          label="Time Spent *"
          value={timeSpent}
          onChangeText={(text) => {
            setTimeSpent(text);
            if (validationErrors.timeSpent) {
              setValidationErrors(prev => ({ ...prev, timeSpent: null }));
            }
          }}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., 3 days, 8 hours, 2 weeks"
          error={!!validationErrors.timeSpent}
          left={<TextInput.Icon icon="clock-outline" />}
        />
        {validationErrors.timeSpent && (
          <HelperText type="error">{validationErrors.timeSpent}</HelperText>
        )}

        <View style={styles.qualitySection}>
          <Text style={styles.sectionTitle}>Work Quality Assessment *</Text>
          <View style={styles.qualityOptions}>
            {['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'].map((quality) => (
              <Chip
                key={quality}
                mode={workQuality === quality ? 'flat' : 'outlined'}
                selected={workQuality === quality}
                onPress={() => {
                  setWorkQuality(quality);
                  if (validationErrors.workQuality) {
                    setValidationErrors(prev => ({ ...prev, workQuality: null }));
                  }
                }}
                style={styles.qualityChip}
              >
                {quality}
              </Chip>
            ))}
          </View>
          {validationErrors.workQuality && (
            <HelperText type="error">{validationErrors.workQuality}</HelperText>
          )}
        </View>

        <TextInput
          label="Challenges Faced (Optional)"
          value={challengesFaced}
          onChangeText={setChallengesFaced}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
          placeholder="Describe any challenges encountered and how you overcame them"
        />
      
        <TextInput
          label="Additional Work (Optional)"
          value={additionalWork}
          onChangeText={setAdditionalWork}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
          placeholder="Describe any additional work done beyond the original scope"
        />
      
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Completion Evidence (Optional)</Text>
          <Paragraph style={styles.imageHelper}>
            Upload up to 5 images showing the completed work. This helps build trust with clients.
          </Paragraph>
          
          <View style={styles.imagesContainer}>
            {completionImages.map((image, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <MaterialCommunityIcons 
                  name="close-circle" 
                  size={24} 
                  color="#FF3B30" 
                  style={styles.removeIcon}
                  onPress={() => removeImage(index)}
                />
              </View>
            ))}
          
            {completionImages.length < 5 && (
              <Button 
                mode="outlined" 
                onPress={pickImage} 
                style={styles.imageButton}
                icon="camera"
              >
                Add Image ({completionImages.length}/5)
              </Button>
            )}
          </View>
        </View>

        <Card style={styles.paymentCard}>
          <Card.Content>
            <View style={styles.paymentHeader}>
              <MaterialCommunityIcons name="cash" size={24} color="#4CAF50" />
              <Text style={styles.paymentTitle}>Payment Request</Text>
            </View>
            <View style={styles.paymentOption}>
              <Switch
                value={requestPayment}
                onValueChange={setRequestPayment}
              />
              <Text style={styles.paymentText}>
                Request immediate payment release upon client approval
              </Text>
            </View>
          </Card.Content>
        </Card>
      
        <Card style={styles.confirmationCard}>
          <Card.Content>
            <View style={styles.confirmationHeader}>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.confirmationTitle}>Completion Confirmation</Text>
            </View>
            <View style={styles.confirmationContainer}>
              <Checkbox
                status={confirmCompletion ? 'checked' : 'unchecked'}
                onPress={() => {
                  setConfirmCompletion(!confirmCompletion);
                  if (validationErrors.confirmCompletion) {
                    setValidationErrors(prev => ({ ...prev, confirmCompletion: null }));
                  }
                }}
                color="#4CAF50"
              />
              <Text style={styles.confirmationText}>
                I confirm that I have completed this job according to the requirements
                and the information provided is accurate.
              </Text>
            </View>
            {validationErrors.confirmCompletion && (
              <HelperText type="error">{validationErrors.confirmCompletion}</HelperText>
            )}
          </Card.Content>
        </Card>
      
        {error && <HelperText type="error">{error}</HelperText>}
        
        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          style={styles.button}
          loading={loading}
          disabled={loading}
          icon="check-circle"
        >
          Mark as Completed
        </Button>
        
        <Button 
          mode="outlined" 
          onPress={() => navigation.goBack()} 
          style={styles.cancelButton}
          icon="close"
        >
          Cancel
        </Button>
      
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="information-outline" size={24} color="#2196F3" />
              <Text style={styles.infoTitle}>What happens next?</Text>
            </View>
            <Text style={styles.infoText}>
              • The Service Requirer will be notified that you've completed the job
            </Text>
            <Text style={styles.infoText}>
              • They will review your work and submit a Job Satisfaction Form
            </Text>
            <Text style={styles.infoText}>
              • Once they confirm satisfaction, payment will be released to your account
            </Text>
            <Text style={styles.infoText}>
              • If there are issues, they may request revisions or initiate a dispute
            </Text>
          </Card.Content>
        </Card>
        
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
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    marginBottom: 20,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  jobCard: {
    marginBottom: 20,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  jobDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  divider: {
    marginVertical: 12,
  },
  jobDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  jobDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  statusChip: {
    backgroundColor: '#E8F5E8',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  qualitySection: {
    marginBottom: 20,
  },
  qualityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  qualityChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  imageHelper: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imagePreview: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  imageButton: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  paymentCard: {
    marginBottom: 20,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
  confirmationCard: {
    marginBottom: 20,
    elevation: 2,
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  confirmationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  confirmationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    lineHeight: 20,
  },
  button: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  cancelButton: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  infoCard: {
    marginBottom: 20,
    elevation: 1,
    backgroundColor: '#E3F2FD',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default JobCompletionForm;