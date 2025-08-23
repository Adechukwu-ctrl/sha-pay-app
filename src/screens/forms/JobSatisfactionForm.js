import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, Title, HelperText, Card, RadioButton, Divider, Paragraph, Snackbar, Chip, Switch } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { satisfyJob } from '../../store/slices/jobsSlice';
import { releasePayment } from '../../store/slices/paymentSlice';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const JobSatisfactionForm = ({ navigation, route }) => {
  const { jobId, jobDetails } = route.params;
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.jobs);
  
  const [rating, setRating] = useState(3);
  const [feedback, setFeedback] = useState('');
  const [isSatisfied, setIsSatisfied] = useState('yes');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [qualityAspects, setQualityAspects] = useState({
    communication: 3,
    timeliness: 3,
    quality: 3,
    professionalism: 3
  });
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [wouldHireAgain, setWouldHireAgain] = useState(true);
  
  const validateForm = () => {
    const errors = {};
    
    if (!feedback.trim()) {
      errors.feedback = 'Feedback is required';
    } else if (feedback.trim().length < 10) {
      errors.feedback = 'Feedback must be at least 10 characters long';
    }
    
    if (isSatisfied === 'no' && !improvementSuggestions.trim()) {
      errors.improvementSuggestions = 'Improvement suggestions are required when not satisfied';
    }
    
    if (rating < 1 || rating > 5) {
      errors.rating = 'Please provide a valid rating';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      setSnackbarMessage('Please fix the errors before submitting');
      setSnackbarVisible(true);
      return;
    }
    
    const actionText = isSatisfied === 'yes' ? 
      'confirm satisfaction and release payment' : 
      'submit feedback and proceed to dispute';
    
    Alert.alert(
      'Confirm Submission',
      `Are you sure you want to ${actionText}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            const satisfactionData = {
              jobId,
              rating,
              feedback,
              isSatisfied: isSatisfied === 'yes',
              improvementSuggestions: isSatisfied === 'no' ? improvementSuggestions : '',
              qualityAspects,
              wouldRecommend,
              wouldHireAgain,
              submissionDate: new Date().toISOString(),
            };
            
            dispatch(satisfyJob(satisfactionData))
              .unwrap()
              .then(() => {
                if (isSatisfied === 'yes') {
                  // If satisfied, release payment
                  dispatch(releasePayment({ jobId }))
                    .unwrap()
                    .then(() => {
                      setSnackbarMessage('Feedback submitted and payment released successfully!');
                      setSnackbarVisible(true);
                      setTimeout(() => {
                        navigation.navigate('MainTabs', { screen: 'Jobs' });
                      }, 2000);
                    })
                    .catch((error) => {
                      setSnackbarMessage('Feedback submitted but payment release failed');
                      setSnackbarVisible(true);
                    });
                } else {
                  setSnackbarMessage('Feedback submitted. Proceeding to dispute resolution.');
                  setSnackbarVisible(true);
                  setTimeout(() => {
                    navigation.navigate('JobDisputeForm', { jobId, jobDetails });
                  }, 2000);
                }
              })
              .catch((error) => {
                setSnackbarMessage('Failed to submit feedback. Please try again.');
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
  
  const renderStars = (currentRating, onRatingChange, size = 36) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= currentRating ? 'star' : 'star-outline'}
            size={size}
            color={star <= currentRating ? '#FFD700' : '#CCCCCC'}
            onPress={() => onRatingChange(star)}
            style={styles.star}
          />
        ))}
      </View>
    );
  };

  const renderQualityAspect = (aspect, label) => {
    return (
      <View style={styles.aspectContainer}>
        <Text style={styles.aspectLabel}>{label}</Text>
        {renderStars(
          qualityAspects[aspect], 
          (rating) => setQualityAspects(prev => ({ ...prev, [aspect]: rating })),
          24
        )}
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.title}>Job Satisfaction</Title>
            <Paragraph style={styles.subtitle}>
              Please rate your satisfaction with the completed job and provide feedback.
            </Paragraph>
          </Card.Content>
        </Card>
      
        <Card style={styles.jobCard}>
          <Card.Content>
            <View style={styles.jobHeader}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
              <Title style={styles.jobTitle}>{jobDetails?.title || 'Job Title'}</Title>
            </View>
            <Paragraph style={styles.jobDescription}>{jobDetails?.description || 'Job description'}</Paragraph>
            
            <Divider style={styles.divider} />
            
            <View style={styles.jobDetail}>
              <Text style={styles.jobDetailLabel}>Amount:</Text>
              <Text style={styles.jobDetailValue}>₦{jobDetails?.amount?.toLocaleString() || '0'}</Text>
            </View>
            
            <View style={styles.jobDetail}>
              <Text style={styles.jobDetailLabel}>Completed on:</Text>
              <Text style={styles.jobDetailValue}>
                {jobDetails?.completedDate ? new Date(jobDetails.completedDate).toLocaleDateString() : 'Recently'}
              </Text>
            </View>
            
            <View style={styles.jobDetail}>
              <Text style={styles.jobDetailLabel}>Status:</Text>
              <Chip mode="outlined" style={styles.statusChip}>Completed</Chip>
            </View>
          </Card.Content>
        </Card>
      
        <Card style={styles.ratingCard}>
          <Card.Content>
            <View style={styles.ratingHeader}>
              <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
              <Text style={styles.sectionTitle}>Overall Rating</Text>
            </View>
            {renderStars(rating, setRating)}
            <Text style={styles.ratingText}>
              {rating === 1 ? 'Poor' : 
               rating === 2 ? 'Fair' : 
               rating === 3 ? 'Good' : 
               rating === 4 ? 'Very Good' : 'Excellent'}
            </Text>
            {validationErrors.rating && (
              <HelperText type="error">{validationErrors.rating}</HelperText>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.aspectsCard}>
          <Card.Content>
            <View style={styles.aspectsHeader}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>Detailed Assessment</Text>
            </View>
            {renderQualityAspect('communication', 'Communication')}
            {renderQualityAspect('timeliness', 'Timeliness')}
            {renderQualityAspect('quality', 'Work Quality')}
            {renderQualityAspect('professionalism', 'Professionalism')}
          </Card.Content>
        </Card>
      
        <Card style={styles.satisfactionCard}>
          <Card.Content>
            <View style={styles.satisfactionHeader}>
              <MaterialCommunityIcons name="thumbs-up-down" size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Overall Satisfaction</Text>
            </View>
            
            <View style={styles.radioOption}>
              <RadioButton
                value="yes"
                status={isSatisfied === 'yes' ? 'checked' : 'unchecked'}
                onPress={() => setIsSatisfied('yes')}
                color="#4CAF50"
              />
              <Text style={styles.radioText}>Yes, I am satisfied</Text>
            </View>
            
            <View style={styles.radioOption}>
              <RadioButton
                value="no"
                status={isSatisfied === 'no' ? 'checked' : 'unchecked'}
                onPress={() => setIsSatisfied('no')}
                color="#F44336"
              />
              <Text style={styles.radioText}>No, I am not satisfied</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.recommendationCard}>
          <Card.Content>
            <View style={styles.recommendationHeader}>
              <MaterialCommunityIcons name="account-heart" size={24} color="#FF9800" />
              <Text style={styles.sectionTitle}>Recommendations</Text>
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Would you recommend this service provider?</Text>
              <Switch
                value={wouldRecommend}
                onValueChange={setWouldRecommend}
                color="#4CAF50"
              />
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Would you hire them again?</Text>
              <Switch
                value={wouldHireAgain}
                onValueChange={setWouldHireAgain}
                color="#4CAF50"
              />
            </View>
          </Card.Content>
        </Card>
      
        <TextInput
          label="Feedback *"
          value={feedback}
          onChangeText={(text) => {
            setFeedback(text);
            if (validationErrors.feedback) {
              setValidationErrors(prev => ({ ...prev, feedback: null }));
            }
          }}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Please provide detailed feedback about the service (minimum 10 characters)"
          error={!!validationErrors.feedback}
        />
        {validationErrors.feedback && (
          <HelperText type="error">{validationErrors.feedback}</HelperText>
        )}
      
        {isSatisfied === 'no' && (
          <TextInput
            label="Improvement Suggestions *"
            value={improvementSuggestions}
            onChangeText={(text) => {
              setImprovementSuggestions(text);
              if (validationErrors.improvementSuggestions) {
                setValidationErrors(prev => ({ ...prev, improvementSuggestions: null }));
              }
            }}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={4}
            placeholder="Please provide specific suggestions for improvement"
            error={!!validationErrors.improvementSuggestions}
          />
        )}
        {validationErrors.improvementSuggestions && (
          <HelperText type="error">{validationErrors.improvementSuggestions}</HelperText>
        )}
      
        {error && <HelperText type="error">{error}</HelperText>}
        
        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          style={styles.button}
          loading={loading}
          disabled={loading}
          icon={isSatisfied === 'yes' ? 'check-circle' : 'alert-circle'}
        >
          {isSatisfied === 'yes' ? 'Submit & Release Payment' : 'Submit & File Dispute'}
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
              <Text style={styles.infoTitle}>Important Information</Text>
            </View>
            <Text style={styles.infoText}>
              • If you are satisfied, payment will be released to the Service Provider immediately
            </Text>
            <Text style={styles.infoText}>
              • If you are not satisfied, you will be directed to file a dispute for resolution
            </Text>
            <Text style={styles.infoText}>
              • Your detailed feedback helps improve our service quality and assists other users
            </Text>
            <Text style={styles.infoText}>
              • This action cannot be undone once submitted
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
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  jobCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
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
    marginVertical: 16,
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
  ratingCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aspectsCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  aspectsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aspectContainer: {
    marginBottom: 12,
  },
  aspectLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  satisfactionCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  satisfactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  star: {
    marginHorizontal: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
    elevation: 2,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  infoCard: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#e3f2fd',
    elevation: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default JobSatisfactionForm;