import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

const CustomDateTimePicker = ({ date, onDateChange, mode = 'date', label = 'Select Date' }) => {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(date || new Date());

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || tempDate;
    setShow(Platform.OS === 'ios');
    setTempDate(currentDate);
    if (onDateChange) {
      onDateChange(currentDate);
    }
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const formatDate = (date) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    if (!date) return 'Select Time';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface} elevation={1}>
        <Text style={styles.label}>{label}</Text>
        <Button
          mode="outlined"
          onPress={showDatepicker}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {mode === 'date' ? formatDate(tempDate) : formatTime(tempDate)}
        </Button>
      </Surface>
      
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={tempDate}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  surface: {
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  button: {
    justifyContent: 'flex-start',
  },
  buttonContent: {
    justifyContent: 'flex-start',
    paddingVertical: 8,
  },
});

export default CustomDateTimePicker;