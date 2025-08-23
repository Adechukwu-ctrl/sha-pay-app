import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Title, HelperText, Card, Divider, RadioButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { createDispute } from '../../store/slices/jobsSlice';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const JobDisputeForm = ({ navigation, route }) => {
  const { jobId, jobDetails } = route.params;
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.jobs);
  const { user } = useSelector(state => state.auth);
  
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeType, setDisputeType] = useState('quality');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [proposedResolution, setProposedResolution] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEvidenceImages([...evidenceImages, result.assets[0].uri]);
    }
  };
  
  const handleSubmit = () => {
    const disputeData = {
      jobId,
      disputeReason,
      disputeType,
      disputeDescription,
      proposedResolution,
      evidenceImages,
      initiatedBy: user.id,
      initiatorType: user.userType, // 'service_provider' or 'service_requirer'
      createdAt: new Date().toISOString(),
    };
    
    dispatch(createDispute(disputeData))
      .unwrap()
      .then(() => {
        navigation.navigate('MainTabs', { screen: 'Jobs' });
      });
  };
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Title style={styles.title}>Job Dispute</Title>
        <Text style={styles.subtitle}>File a dispute for this job</Text>
      </View>
      
      <Card style={styles.jobCard}>
        <Card.Content>
          <Title style={styles.jobTitle}>{jobDetails.title}</Title>
          <Text style={styles.jobDescription}>{jobDetails.description}</Text>
          
          <Divider style={styles.divider} />
          
          <View style={styles.jobDetail}>
            <Text style={styles.jobDetailLabel}>Amount:</Text>
            <Text style={styles.jobDetailValue}>₦{jobDetails.amount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.jobDetail}>
            <Text style={styles.jobDetailLabel}>Status:</Text>
            <Text style={styles.jobDetailValue}>{jobDetails.status}</Text>
          </View>
        </Card.Content>
      </Card>
      
      <View style={styles.disputeTypeContainer}>
        <Text style={styles.sectionTitle}>Dispute Type</Text>
        
        <View style={styles.radioOption}>
          <RadioButton
            value="quality"
            status={disputeType === 'quality' ? 'checked' : 'unchecked'}
            onPress={() => setDisputeType('quality')}
            color="#007AFF"
          />
          <Text>Quality Issues</Text>
        </View>
        
        <View style={styles.radioOption}>
          <RadioButton
            value="incomplete"
            status={disputeType === 'incomplete' ? 'checked' : 'unchecked'}
            onPress={() => setDisputeType('incomplete')}
            color="#007AFF"
          />
          <Text>Incomplete Work</Text>
        </View>
        
        <View style={styles.radioOption}>
          <RadioButton
            value="payment"
            status={disputeType === 'payment' ? 'checked' : 'unchecked'}
            onPress={() => setDisputeType('payment')}
            color="#007AFF"
          />
          <Text>Payment Issues</Text>
        </View>
        
        <View style={styles.radioOption}>
          <RadioButton
            value="other"
            status={disputeType === 'other' ? 'checked' : 'unchecked'}
            onPress={() => setDisputeType('other')}
            color="#007AFF"
          />
          <Text>Other</Text>
        </View>
      </View>
      
      <TextInput
        label="Dispute Reason"
        value={disputeReason}
        onChangeText={setDisputeReason}
        mode="outlined"
        style={styles.input}
        placeholder="Brief reason for the dispute"
      />
      
      <TextInput
        label="Detailed Description"
        value={disputeDescription}
        onChangeText={setDisputeDescription}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={4}
        placeholder="Provide a detailed description of the issue"
      />
      
      <TextInput
        label="Proposed Resolution"
        value={proposedResolution}
        onChangeText={setProposedResolution}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={3}
        placeholder="How would you like this dispute to be resolved?"
      />
      
      <View style={styles.imageSection}>
        <Text style={styles.sectionTitle}>Evidence (Optional)</Text>
        <Text style={styles.imageHelper}>Upload images as evidence for your dispute</Text>
        
        <View style={styles.imagesContainer}>
          {evidenceImages.map((image, index) => (
            <View key={index} style={styles.imagePreview}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <Icon 
                name="close-circle" 
                size={24} 
                color="#FF3B30" 
                style={styles.removeIcon}
                onPress={() => {
                  const newImages = [...evidenceImages];
                  newImages.splice(index, 1);
                  setEvidenceImages(newImages);
                }}
              />
            </View>
          ))}
          
          {evidenceImages.length < 5 && (
            <Button 
              mode="outlined" 
              onPress={pickImage} 
              style={styles.imageButton}
              icon="camera"
            >
              Add Evidence
            </Button>
          )}
        </View>
      </View>
      
      {error && <HelperText type="error">{error}</HelperText>}
      
      <Button 
        mode="contained" 
        onPress={handleSubmit} 
        style={styles.button}
        loading={loading}
        disabled={loading || !disputeReason || !disputeDescription || !proposedResolution}
      >
        Submit Dispute
      </Button>
      
      <Button 
        mode="outlined" 
        onPress={() => navigation.goBack()} 
        style={styles.cancelButton}
      >
        Cancel
      </Button>
      
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.infoTitle}>Dispute Resolution Process</Text>
          <Text style={styles.infoText}>
            • Your dispute will be reviewed by our support team within 48 hours
          </Text>
          <Text style={styles.infoText}>
            • Both parties will be contacted for additional information if needed
          </Text>
          <Text style={styles.infoText}>
            • A resolution will be proposed based on the evidence provided
          </Text>
          <Text style={styles.infoText}>
            • Payment will be held in escrow until the dispute is resolved
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerContainer: {
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
  jobTitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  jobDescription: {
    color: '#555',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 10,
  },
  jobDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  jobDetailLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  jobDetailValue: {
    color: '#333',
  },
  disputeTypeContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageHelper: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  removeIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  imageButton: {
    marginTop: 10,
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 8,
  },
  infoCard: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#f5f9ff',
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  infoText: {
    marginBottom: 8,
    fontSize: 14,
    color: '#555',
  },
});

export default JobDisputeForm;