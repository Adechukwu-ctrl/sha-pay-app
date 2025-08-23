import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Keyboard,
} from 'react-native';
import {
  Searchbar,
  IconButton,
  Chip,
  Surface,
  Text,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';
import { addOpacity } from '../../utils/colorUtils';

const SearchBar = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onSubmit,
  onClear,
  showFilters = false,
  filters = [],
  selectedFilters = [],
  onFilterToggle,
  suggestions = [],
  showSuggestions = false,
  onSuggestionPress,
  autoFocus = false,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showFilterChips, setShowFilterChips] = useState(false);
  const animatedHeight = new Animated.Value(0);
  const animatedOpacity = new Animated.Value(0);

  useEffect(() => {
    if (showFilterChips) {
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 60,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [showFilterChips]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (suggestions.length === 0) {
      Keyboard.dismiss();
    }
  };

  const handleClear = () => {
    onChangeText('');
    onClear && onClear();
  };

  const handleSubmit = () => {
    onSubmit && onSubmit(value);
    Keyboard.dismiss();
  };

  const toggleFilters = () => {
    setShowFilterChips(!showFilterChips);
  };

  const handleFilterToggle = (filter) => {
    onFilterToggle && onFilterToggle(filter);
  };

  const handleSuggestionPress = (suggestion) => {
    onSuggestionPress && onSuggestionPress(suggestion);
    onChangeText(suggestion);
    Keyboard.dismiss();
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Searchbar
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmit}
        autoFocus={autoFocus}
        style={[
          styles.searchBar,
          isFocused && styles.searchBarFocused,
        ]}
        inputStyle={styles.searchInput}
        iconColor={colors.primary}
        placeholderTextColor={addOpacity(colors.onSurface, '60')}
        right={() => (
          <View style={styles.searchActions}>
            {value.length > 0 && (
              <IconButton
                icon="close"
                size={20}
                onPress={handleClear}
                iconColor={addOpacity(colors.onSurface, '80')}
              />
            )}
            {showFilters && (
              <IconButton
                icon={showFilterChips ? 'filter' : 'filter-outline'}
                size={20}
                onPress={toggleFilters}
                iconColor={showFilterChips ? colors.primary : addOpacity(colors.onSurface, '80')}
              />
            )}
          </View>
        )}
      />
    </View>
  );

  const renderFilterChips = () => {
    if (!showFilters || filters.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.filtersContainer,
          {
            height: animatedHeight,
            opacity: animatedOpacity,
          },
        ]}
      >
        <View style={styles.filtersScrollView}>
          {filters.map((filter, index) => {
            const isSelected = selectedFilters.includes(filter.value);
            return (
              <Chip
                key={index}
                mode={isSelected ? 'flat' : 'outlined'}
                selected={isSelected}
                onPress={() => handleFilterToggle(filter.value)}
                style={[
                  styles.filterChip,
                  isSelected && styles.selectedFilterChip,
                ]}
                textStyle={[
                  styles.filterChipText,
                  isSelected && styles.selectedFilterChipText,
                ]}
                icon={filter.icon}
              >
                {filter.label}
              </Chip>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  const renderSuggestions = () => {
    if (!showSuggestions || !isFocused || suggestions.length === 0) {
      return null;
    }

    return (
      <Surface style={styles.suggestionsContainer}>
        {suggestions.map((suggestion, index) => (
          <View key={index} style={styles.suggestionItem}>
            <IconButton
              icon="magnify"
              size={16}
              iconColor={addOpacity(colors.onSurface, '60')}
            />
            <Text
              style={styles.suggestionText}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              {suggestion}
            </Text>
          </View>
        ))}
      </Surface>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderSearchBar()}
      {renderFilterChips()}
      {renderSuggestions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
  },
  searchContainer: {
    marginBottom: spacing.xs,
  },
  searchBar: {
    elevation: 2,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  searchBarFocused: {
    elevation: 4,
    borderWidth: 1,
    borderColor: addOpacity(colors.primary, '40'),
  },
  searchInput: {
    fontSize: 16,
    color: colors.onSurface,
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filtersContainer: {
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  filtersScrollView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  selectedFilterChip: {
    backgroundColor: colors.primaryContainer,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.onSurface,
  },
  selectedFilterChipText: {
    color: colors.onPrimaryContainer,
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 8,
    elevation: 4,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: addOpacity(colors.outline, '20'),
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
    marginLeft: spacing.xs,
  },
});

export default SearchBar;