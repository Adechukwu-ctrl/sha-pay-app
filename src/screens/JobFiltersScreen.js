import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  ThemedHeader,
  ThemedCard,
  ThemedText,
  ThemedButton,
  ThemedInput,
  ThemedBadge,
  SegmentedControl,
  ThemedListItem,
} from '../components/ui';
import { colors, spacing } from '../theme';
import { setJobFilters, clearJobFilters } from '../store/slices/jobsSlice';

const JobFiltersScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { currentFilters } = useSelector((state) => state.jobs);
  
  const [filters, setFilters] = useState({
    category: '',
    minBudget: '',
    maxBudget: '',
    location: '',
    urgency: '', // '', 'normal', 'medium', 'urgent'
    sortBy: 0, // 0: Recent, 1: Budget (Low to High), 2: Budget (High to Low), 3: Distance
    radius: 10, // km
    skills: [],
    jobType: '', // '', 'one-time', 'recurring'
    ...currentFilters,
  });
  
  const [tempSkill, setTempSkill] = useState('');
  
  const categories = [
    'All Categories',
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
  
  const urgencyLevels = [
    { label: 'Any', value: '' },
    { label: 'Normal', value: 'normal' },
    { label: 'Medium', value: 'medium' },
    { label: 'Urgent', value: 'urgent' },
  ];
  
  const sortOptions = [
    { label: 'Recent', key: 'recent' },
    { label: 'Budget ↑', key: 'budget_asc' },
    { label: 'Budget ↓', key: 'budget_desc' },
    { label: 'Distance', key: 'distance' },
  ];
  
  const radiusOptions = [5, 10, 25, 50, 100]; // km
  
  const jobTypeOptions = [
    { label: 'Any', value: '' },
    { label: 'One-time', value: 'one-time' },
    { label: 'Recurring', value: 'recurring' },
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
    'Cleaning',
    'Cooking',
    'Driving',
    'Tutoring',
    'Repair',
    'Installation',
    'Design',
    'Writing',
    'Photography',
    'Event Planning',
  ];
  
  useEffect(() => {
    // Initialize with current filters
    if (currentFilters) {
      setFilters(prev => ({ ...prev, ...currentFilters }));
    }
  }, [currentFilters]);
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleAddSkill = (skill) => {
    if (!filters.skills.includes(skill)) {
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
    }
  };
  
  const handleRemoveSkill = (skill) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };
  
  const handleAddCustomSkill = () => {
    if (tempSkill.trim() && !filters.skills.includes(tempSkill.trim())) {
      handleAddSkill(tempSkill.trim());
      setTempSkill('');
    }
  };
  
  const handleApplyFilters = () => {
    // Clean up filters (remove empty values)
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          acc[key] = value;
        } else if (!Array.isArray(value)) {
          acc[key] = value;
        }
      }
      return acc;
    }, {});
    
    dispatch(setJobFilters(cleanFilters));
    navigation.goBack();
  };
  
  const handleClearFilters = () => {
    setFilters({
      category: '',
      minBudget: '',
      maxBudget: '',
      location: '',
      urgency: '',
      sortBy: 0,
      radius: 10,
      skills: [],
      jobType: '',
    });
    dispatch(clearJobFilters());
  };
  
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category && filters.category !== 'All Categories') count++;
    if (filters.minBudget || filters.maxBudget) count++;
    if (filters.location) count++;
    if (filters.urgency) count++;
    if (filters.skills.length > 0) count++;
    if (filters.jobType) count++;
    return count;
  };
  
  const renderCategoryFilter = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Category
      </ThemedText>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryContainer}>
          {categories.map((category, index) => (
            <ThemedBadge
              key={index}
              variant={filters.category === category ? 'primary' : 'outline'}
              style={styles.categoryBadge}
              onPress={() => handleFilterChange('category', category === 'All Categories' ? '' : category)}
            >
              {category}
            </ThemedBadge>
          ))}
        </View>
      </ScrollView>
    </ThemedCard>
  );
  
  const renderBudgetFilter = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Budget Range (₦)
      </ThemedText>
      
      <View style={styles.budgetContainer}>
        <ThemedInput
          label="Min Budget"
          placeholder="0"
          value={filters.minBudget}
          onChangeText={(value) => handleFilterChange('minBudget', value)}
          keyboardType="numeric"
          style={{ flex: 1, marginRight: spacing[2] }}
        />
        
        <ThemedInput
          label="Max Budget"
          placeholder="No limit"
          value={filters.maxBudget}
          onChangeText={(value) => handleFilterChange('maxBudget', value)}
          keyboardType="numeric"
          style={{ flex: 1 }}
        />
      </View>
    </ThemedCard>
  );
  
  const renderLocationFilter = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Location & Distance
      </ThemedText>
      
      <ThemedInput
        label="Location"
        placeholder="Enter city or area"
        value={filters.location}
        onChangeText={(value) => handleFilterChange('location', value)}
        leftIcon="map-marker"
        style={{ marginBottom: spacing[4] }}
      />
      
      <ThemedText variant="body2" style={{ marginBottom: spacing[2] }}>
        Search Radius: {filters.radius} km
      </ThemedText>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.radiusContainer}>
          {radiusOptions.map((radius, index) => (
            <ThemedBadge
              key={index}
              variant={filters.radius === radius ? 'primary' : 'outline'}
              style={styles.radiusBadge}
              onPress={() => handleFilterChange('radius', radius)}
            >
              {radius} km
            </ThemedBadge>
          ))}
        </View>
      </ScrollView>
    </ThemedCard>
  );
  
  const renderJobDetailsFilter = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Job Details
      </ThemedText>
      
      <View style={{ marginBottom: spacing[4] }}>
        <ThemedText variant="body2" style={{ marginBottom: spacing[2] }}>
          Urgency Level
        </ThemedText>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.urgencyContainer}>
            {urgencyLevels.map((level, index) => (
              <ThemedBadge
                key={index}
                variant={filters.urgency === level.value ? 'primary' : 'outline'}
                style={styles.urgencyBadge}
                onPress={() => handleFilterChange('urgency', level.value)}
              >
                {level.label}
              </ThemedBadge>
            ))}
          </View>
        </ScrollView>
      </View>
      
      <View>
        <ThemedText variant="body2" style={{ marginBottom: spacing[2] }}>
          Job Type
        </ThemedText>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.jobTypeContainer}>
            {jobTypeOptions.map((type, index) => (
              <ThemedBadge
                key={index}
                variant={filters.jobType === type.value ? 'primary' : 'outline'}
                style={styles.jobTypeBadge}
                onPress={() => handleFilterChange('jobType', type.value)}
              >
                {type.label}
              </ThemedBadge>
            ))}
          </View>
        </ScrollView>
      </View>
    </ThemedCard>
  );
  
  const renderSkillsFilter = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Required Skills
      </ThemedText>
      
      <View style={styles.addSkillContainer}>
        <ThemedInput
          placeholder="Add custom skill"
          value={tempSkill}
          onChangeText={setTempSkill}
          style={{ flex: 1, marginRight: spacing[2] }}
          onSubmitEditing={handleAddCustomSkill}
        />
        <ThemedButton
          variant="primary"
          size="small"
          onPress={handleAddCustomSkill}
          disabled={!tempSkill.trim()}
        >
          Add
        </ThemedButton>
      </View>
      
      {filters.skills.length > 0 && (
        <View style={styles.selectedSkillsContainer}>
          <ThemedText variant="body2" style={{ marginBottom: spacing[2] }}>
            Selected Skills:
          </ThemedText>
          <View style={styles.skillsGrid}>
            {filters.skills.map((skill, index) => (
              <ThemedBadge
                key={index}
                variant="primary"
                style={styles.selectedSkillBadge}
                onPress={() => handleRemoveSkill(skill)}
              >
                {skill} ×
              </ThemedBadge>
            ))}
          </View>
        </View>
      )}
      
      <ThemedText variant="body2" style={{ marginBottom: spacing[2] }}>
        Common Skills:
      </ThemedText>
      
      <View style={styles.skillsGrid}>
        {commonSkills.map((skill, index) => (
          <ThemedBadge
            key={index}
            variant={filters.skills.includes(skill) ? 'primary' : 'outline'}
            style={styles.skillBadge}
            onPress={() => {
              if (filters.skills.includes(skill)) {
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
    </ThemedCard>
  );
  
  const renderSortFilter = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Sort By
      </ThemedText>
      
      <SegmentedControl
        segments={sortOptions}
        selectedIndex={filters.sortBy}
        onSelectionChange={(index) => handleFilterChange('sortBy', index)}
      />
    </ThemedCard>
  );
  
  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <ThemedButton
        variant="outline"
        onPress={handleClearFilters}
        style={{ flex: 1, marginRight: spacing[3] }}
      >
        Clear All
      </ThemedButton>
      
      <ThemedButton
        variant="primary"
        onPress={handleApplyFilters}
        style={{ flex: 2 }}
      >
        Apply Filters ({getActiveFiltersCount()})
      </ThemedButton>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <ThemedHeader
        title="Filter Jobs"
        onLeftPress={() => navigation.goBack()}
        rightComponent={
          <ThemedButton
            variant="text"
            size="small"
            onPress={handleClearFilters}
          >
            Clear All
          </ThemedButton>
        }
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderCategoryFilter()}
        {renderBudgetFilter()}
        {renderLocationFilter()}
        {renderJobDetailsFilter()}
        {renderSkillsFilter()}
        {renderSortFilter()}
        
        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        {renderActionButtons()}
      </View>
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
  card: {
    margin: spacing[4],
    marginBottom: spacing[3],
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingRight: spacing[4],
  },
  categoryBadge: {
    marginRight: spacing[2],
  },
  budgetContainer: {
    flexDirection: 'row',
  },
  radiusContainer: {
    flexDirection: 'row',
    paddingRight: spacing[4],
  },
  radiusBadge: {
    marginRight: spacing[2],
  },
  urgencyContainer: {
    flexDirection: 'row',
    paddingRight: spacing[4],
  },
  urgencyBadge: {
    marginRight: spacing[2],
  },
  jobTypeContainer: {
    flexDirection: 'row',
    paddingRight: spacing[4],
  },
  jobTypeBadge: {
    marginRight: spacing[2],
  },
  addSkillContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing[4],
  },
  selectedSkillsContainer: {
    marginBottom: spacing[4],
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    marginRight: spacing[2],
    marginBottom: spacing[2],
  },
  selectedSkillBadge: {
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

export default JobFiltersScreen;