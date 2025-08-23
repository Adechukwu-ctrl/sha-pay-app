import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, Title, HelperText, Divider, Card, Paragraph, Snackbar, Chip, Switch } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { acceptJob } from '../../store/slices/jobsSlice';
import DateTimePicker from '../../components/DateTimePicker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const JobAcceptanceForm = ({ navigation, route }) => {
  const { jobId } = route.params;
  const dispatch = useDispatch();
  const { jobs, loading, error } = useSelector(state => state.jobs);
  const { serviceChargeRate } = useSelector(state => state.payment);
  
  // Find the job from the store
  const job = jobs.find(j => j.id === jobId) || {};
  
  const [agreedAmount, setAgreedAmount] = useState(job.amount?.toString() || '');
  const [estimatedCompletion, setEstimatedCompletion] = useState(
    job.deadline ? new Date(job.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [serviceCharge, setServiceCharge] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [negotiateAmount, setNegotiateAmount] = useState(false);
  
  useEffect(() => {
    if (job.amount) {
      setAgreedAmount(job.amount.toString());
    }
    if (job.deadline) {
      setEstimatedCompletion(new Date(job.deadline));
    }
  }, [job]);

  useEffect(() => {
    if (agreedAmount) {
      const amount = parseFloat(agreedAmount);
      const charge = amount * serviceChargeRate;
      const net = amount - charge;
      setServiceCharge(charge);
      setNetAmount(net);
    } else {
      setServiceCharge(0);
      setNetAmount(0);
    }
  }, [agreedAmount, serviceChargeRate]);

  const validateForm = () => {
    const errors = {};
    
    if (!agreedAmount || parseFloat(agreedAmount) <= 0) {
      errors.agreedAmount = 'Valid amount is required';
    }
    
    if (!estimatedCompletion) {
      errors.estimatedCompletion = 'Completion date is required';
    }
    
    // Check if completion date is in the future
    if (estimatedCompletion && new Date(estimatedCompletion) <= new Date()) {
      errors.estimatedCompletion = 'Completion date must be in the future';
    }
    
    if (!termsAccepted) {
      errors.termsAccepted = 'You must accept the terms to proceed';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleAccept = () => {
    if (!validateForm()) {
      setSnackbarMessage('Please fix the errors before proceeding');
      setSnackbarVisible(true);
      return;
    }
    
    Alert.alert(
      'Confirm Job Acceptance',
      `Are you sure you want to accept this job for ₦${parseFloat(agreedAmount).toLocaleString()}? You will receive ₦${netAmount.toLocaleString()} after the 2.5% service fee.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: () => {
            const acceptanceData = {
              jobId,
              agreedAmount: parseFloat(agreedAmount),
              estimatedCompletion,
              additionalNotes,
              serviceCharge,
              netAmount,
            };
            
            dispatch(acceptJob(acceptanceData))
              .unwrap()
              .then(() => {
                setSnackbarMessage('Job accepted successfully!');
                setSnackbarVisible(true);
                setTimeout(() => {
                  navigation.navigate('PaymentDetails', { jobId });
                }, 2000);
              })
              .catch((error) => {
                setSnackbarMessage('Failed to accept job. Please try again.');
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
            <Title style={styles.title}>Accept Job Request</Title>
            <Paragraph style={styles.subtitle}>
              Review and confirm job details. A 2.5% service fee will be deducted from your earnings.
            </Paragraph>
          </Card.Content>
        </Card>
      
      <Card style={styles.jobCard}>
          <Card.Content>
            <Title>{job.title}</Title>
            <Paragraph style={styles.jobDescription}>{job.description}</Paragraph>
            
            <Divider style={styles.divider} />
            
            <View style={styles.jobDetail}>
              <Text style={styles.detailLabel}>Requested Budget:</Text>
              <Text style={styles.detailValue}>₦{job.amount?.toLocaleString()}</Text>
            </View>
            
            <View style={styles.jobDetail}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{job.location}</Text>
            </View>
            
            <View style={styles.jobDetail}>
              <Text style={styles.detailLabel}>Deadline:</Text>
              <Text style={styles.detailValue}>{job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Not specified'}</Text>
            </View>
            
            <View style={styles.jobDetail}>
              <Text style={styles.detailLabel}>Requested by:</Text>
              <Text style={styles.detailValue}>{job.requesterName || 'Client'}</Text>
            </View>
            
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <View style={styles.skillsSection}>
                <Text style={styles.detailLabel}>Required Skills:</Text>
                <View style={styles.skillsContainer}>
                  {job.requiredSkills.map((skill, index) => (
                    <Chip key={index} style={styles.skillChip} compact>
                      {skill}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      
        <View style={styles.formContainer}>
          <View style={styles.negotiateContainer}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.switchContainer}>
              <Text>Negotiate Amount</Text>
              <Switch
                value={negotiateAmount}
                onValueChange={setNegotiateAmount}
              />
            </View>
          </View>
          
          <TextInput
            label="Agreed Amount (₦)"
            value={agreedAmount}
            onChangeText={(text) => {
              setAgreedAmount(text);
              if (validationErrors.agreedAmount) {
                setValidationErrors(prev => ({ ...prev, agreedAmount: null }));
              }
            }}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            editable={negotiateAmount}
            error={!!validationErrors.agreedAmount}
            left={<TextInput.Icon icon="currency-ngn" />}
          />
          {validationErrors.agreedAmount && (
            <HelperText type="error">{validationErrors.agreedAmount}</HelperText>
          )}
          
          {agreedAmount && (
            <Card style={styles.earningsCard}>
              <Card.Content>
                <Text style={styles.earningsTitle}>Earnings Breakdown</Text>
                <View style={styles.earningsRow}>
                  <Text>Job Amount:</Text>
                  <Text>₦{parseFloat(agreedAmount || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.earningsRow}>
                  <Text>Service Fee (2.5%):</Text>
                  <Text style={styles.feeText}>-₦{serviceCharge.toLocaleString()}</Text>
                </View>
                <Divider style={styles.earningsDivider} />
                <View style={[styles.earningsRow, styles.netRow]}>
                  <Text style={styles.netText}>You'll Receive:</Text>
                  <Text style={styles.netText}>₦{netAmount.toLocaleString()}</Text>
                </View>
              </Card.Content>
            </Card>
          )}
        
          <Text style={styles.sectionTitle}>Estimated Completion Date</Text>
          <DateTimePicker 
            date={estimatedCompletion} 
            onDateChange={(date) => {
              setEstimatedCompletion(date);
              if (validationErrors.estimatedCompletion) {
                setValidationErrors(prev => ({ ...prev, estimatedCompletion: null }));
              }
            }}
          />
          {validationErrors.estimatedCompletion && (
            <HelperText type="error">{validationErrors.estimatedCompletion}</HelperText>
          )}
        
          <TextInput
            label="Additional Notes (Optional)"
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            placeholder="Any additional information or requirements..."
          />
        
          <Card style={styles.termsCard}>
            <Card.Content>
              <View style={styles.termsHeader}>
                <MaterialCommunityIcons 
                  name="file-document-outline" 
                  size={24} 
                  color="#666" 
                />
                <Text style={styles.termsTitle}>Terms & Conditions</Text>
              </View>
              
              <Text style={styles.termsText}>
                I agree to complete this job as described, by the estimated completion date, 
                for the agreed amount. I understand that payment will be released after the 
                client confirms job completion, and a 2.5% service fee will be deducted.
              </Text>
              
              <View style={styles.termsCheckContainer}>
                <Switch
                  value={termsAccepted}
                  onValueChange={(value) => {
                    setTermsAccepted(value);
                    if (validationErrors.termsAccepted) {
                      setValidationErrors(prev => ({ ...prev, termsAccepted: null }));
                    }
                  }}
                />
                <Text style={styles.termsCheckText}>I accept these terms and conditions</Text>
              </View>
              
              {validationErrors.termsAccepted && (
                <HelperText type="error">{validationErrors.termsAccepted}</HelperText>
              )}
            </Card.Content>
          </Card>
        
          {error && <HelperText type="error">{error}</HelperText>}
          
          <Button 
            mode="contained" 
            onPress={handleAccept} 
            style={styles.button}
            loading={loading}
            disabled={loading}
            icon="check-circle"
          >
            Accept Job and Proceed
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.goBack()} 
            style={styles.cancelButton}
            icon="close"
          >
            Cancel
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
  jobCard: {
    marginBottom: 20,
  },
  jobDescription: {
    marginTop: 8,
    marginBottom: 15,
  },
  divider: {
    marginVertical: 15,
  },
  jobDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  detailValue: {
    color: '#333',
  },
  skillsSection: {
    marginTop: 15,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  skillChip: {
    margin: 4,
  },
  formContainer: {
    width: '100%',
  },
  negotiateContainer: {
    marginBottom: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
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
  earningsCard: {
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  feeText: {
    color: '#e74c3c',
  },
  earningsDivider: {
    marginVertical: 10,
  },
  netRow: {
    marginTop: 5,
  },
  netText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#27ae60',
  },
  termsCard: {
    marginVertical: 20,
    backgroundColor: '#f8f9fa',
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  termsCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsCheckText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 8,
  },
});

export default JobAcceptanceForm;