import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import {
  ThemedHeader,
  ThemedCard,
  ThemedText,
  ThemedButton,
  ThemedBadge,
  LoadingSpinner,
} from '../components/ui';
import { colors, spacing } from '../theme';
import { runMobilePerformanceTest } from '../utils/performanceTest';

const { width: screenWidth } = Dimensions.get('window');

const PerformanceTestScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [testSummary, setTestSummary] = useState(null);

  const runTests = async () => {
    setIsLoading(true);
    try {
      const { results, summary } = await runMobilePerformanceTest();
      setTestResults(results);
      setTestSummary(summary);
    } catch (error) {
      console.error('Performance test failed:', error);
      Alert.alert('Test Failed', 'Unable to run performance tests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS':
        return colors.success;
      case 'WARNING':
        return colors.warning;
      case 'FAIL':
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS':
        return 'check-circle';
      case 'WARNING':
        return 'alert-circle';
      case 'FAIL':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderDeviceInfo = () => {
    if (!testResults?.deviceInfo) return null;

    const { deviceInfo } = testResults;
    
    return (
      <ThemedCard style={styles.card}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          📱 Device Information
        </ThemedText>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <ThemedText variant="caption" style={styles.infoLabel}>Device</ThemedText>
            <ThemedText variant="body2">{deviceInfo.deviceName}</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText variant="caption" style={styles.infoLabel}>Platform</ThemedText>
            <ThemedText variant="body2">{deviceInfo.platform} {deviceInfo.systemVersion}</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText variant="caption" style={styles.infoLabel}>Screen Size</ThemedText>
            <ThemedText variant="body2">{deviceInfo.windowWidth} × {deviceInfo.windowHeight}</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText variant="caption" style={styles.infoLabel}>Pixel Ratio</ThemedText>
            <ThemedText variant="body2">{deviceInfo.pixelRatio}x</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText variant="caption" style={styles.infoLabel}>Screen Class</ThemedText>
            <ThemedText variant="body2">{deviceInfo.screenSizeClass}</ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <ThemedText variant="caption" style={styles.infoLabel}>Density</ThemedText>
            <ThemedText variant="body2">{deviceInfo.densityClass}</ThemedText>
          </View>
        </View>
      </ThemedCard>
    );
  };

  const renderTestSummary = () => {
    if (!testSummary) return null;

    const { summary } = testSummary;
    const scoreColor = summary.percentage >= 80 ? colors.success : 
                      summary.percentage >= 60 ? colors.warning : colors.error;

    return (
      <ThemedCard style={styles.card}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          📊 Test Summary
        </ThemedText>
        
        <View style={styles.summaryContainer}>
          <View style={styles.scoreContainer}>
            <ThemedText variant="h1" style={[styles.score, { color: scoreColor }]}>
              {summary.percentage}%
            </ThemedText>
            <ThemedText variant="caption" style={styles.scoreLabel}>
              Overall Score
            </ThemedText>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText variant="h3" style={{ color: colors.success }}>
                {summary.passed}
              </ThemedText>
              <ThemedText variant="caption">Passed</ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText variant="h3" style={{ color: colors.error }}>
                {summary.failed}
              </ThemedText>
              <ThemedText variant="caption">Failed</ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedText variant="h3" style={styles.totalTests}>
                {summary.total}
              </ThemedText>
              <ThemedText variant="caption">Total</ThemedText>
            </View>
          </View>
        </View>
      </ThemedCard>
    );
  };

  const renderTestResults = () => {
    if (!testSummary?.tests) return null;

    return (
      <ThemedCard style={styles.card}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          🧪 Test Results
        </ThemedText>
        
        {testSummary.tests.map((test, index) => (
          <View key={index} style={styles.testItem}>
            <View style={styles.testHeader}>
              <ThemedBadge
                icon={getStatusIcon(test.status)}
                variant={test.status === 'PASS' ? 'success' : 
                        test.status === 'WARNING' ? 'warning' : 'error'}
                size="small"
              />
              <ThemedText variant="body1" style={styles.testName}>
                {test.name}
              </ThemedText>
            </View>
            <ThemedText variant="caption" style={styles.testDetails}>
              {test.details}
            </ThemedText>
          </View>
        ))}
      </ThemedCard>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!testResults?.performanceMetrics) return null;

    const { performanceMetrics } = testResults;
    const { memoryUsage, renderTime } = performanceMetrics;

    return (
      <ThemedCard style={styles.card}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          ⚡ Performance Metrics
        </ThemedText>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <ThemedText variant="caption" style={styles.metricLabel}>Render Time</ThemedText>
            <ThemedText variant="h3" style={{
              color: renderTime < 16 ? colors.success : colors.warning
            }}>
              {renderTime}ms
            </ThemedText>
            <ThemedText variant="caption">Target: &lt;16ms</ThemedText>
          </View>
          
          <View style={styles.metricItem}>
            <ThemedText variant="caption" style={styles.metricLabel}>Memory Usage</ThemedText>
            <ThemedText variant="h3" style={{
              color: memoryUsage.percentage < 80 ? colors.success : colors.warning
            }}>
              {memoryUsage.percentage.toFixed(1)}%
            </ThemedText>
            <ThemedText variant="caption">Target: &lt;80%</ThemedText>
          </View>
          
          <View style={styles.metricItem}>
            <ThemedText variant="caption" style={styles.metricLabel}>Available Memory</ThemedText>
            <ThemedText variant="h3">
              {(memoryUsage.available / 1024 / 1024 / 1024).toFixed(1)}GB
            </ThemedText>
            <ThemedText variant="caption">Free</ThemedText>
          </View>
        </View>
      </ThemedCard>
    );
  };

  return (
    <View style={styles.container}>
      <ThemedHeader
        title="Performance Test"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText variant="body1" style={styles.description}>
            Test your app's mobile performance and UI/UX responsiveness across different devices and screen sizes.
          </ThemedText>
          
          <ThemedButton
            title={isLoading ? "Running Tests..." : "Run Performance Test"}
            onPress={runTests}
            disabled={isLoading}
            style={styles.testButton}
            icon={isLoading ? undefined : "play-circle"}
          />
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" />
              <ThemedText variant="caption" style={styles.loadingText}>
                Analyzing device performance...
              </ThemedText>
            </View>
          )}
        </View>
        
        {testResults && (
          <>
            {renderTestSummary()}
            {renderDeviceInfo()}
            {renderTestResults()}
            {renderPerformanceMetrics()}
          </>
        )}
      </ScrollView>
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
  section: {
    margin: spacing[4],
  },
  description: {
    marginBottom: spacing[4],
    color: colors.text.secondary,
    textAlign: 'center',
  },
  testButton: {
    marginBottom: spacing[4],
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  loadingText: {
    marginTop: spacing[2],
    color: colors.text.secondary,
  },
  card: {
    margin: spacing[4],
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: spacing[4],
    color: colors.text.primary,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: spacing[3],
  },
  infoLabel: {
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    flex: 1,
    alignItems: 'center',
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  totalTests: {
    color: colors.text.primary,
  },
  testItem: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  testName: {
    marginLeft: spacing[2],
    flex: 1,
  },
  testDetails: {
    color: colors.text.secondary,
    marginLeft: spacing[8],
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
});

export default PerformanceTestScreen;