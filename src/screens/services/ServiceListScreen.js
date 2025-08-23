import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  Text,
  Surface,
  IconButton,
  Menu,
  Divider,
  Badge,
  Avatar,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { colors, spacing } from '../../theme';
import { fetchServices, setFilters } from '../../store/slices/servicesSlice';

const { width: screenWidth } = Dimensions.get('window');

const ServiceListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { services, loading, filters, pagination } = useSelector(state => state.services);
  const { user } = useSelector(state => state.auth);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  const categories = [
    'Cleaning',
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Painting',
    'Gardening',
    'Moving',
    'Tutoring',
    'Photography',
    'Catering',
    'Beauty',
    'Fitness',
  ];
  
  const sortOptions = [
    { label: 'Most Recent', value: 'created_at' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Rating', value: 'rating' },
    { label: 'Distance', value: 'distance' },
  ];
  
  useEffect(() => {
    loadServices();
  }, [filters]);
  
  const loadServices = useCallback(async () => {
    try {
      await dispatch(fetchServices({ 
        ...filters,
        search: searchQuery,
        categories: selectedCategories,
        priceMin: priceRange.min,
        priceMax: priceRange.max,
      })).unwrap();
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }, [dispatch, filters, searchQuery, selectedCategories, priceRange]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  }, [loadServices]);
  
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    // Debounce search
    const timeoutId = setTimeout(() => {
      loadServices();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [loadServices]);
  
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      return newCategories;
    });
  };
  
  const handleSortChange = (sortValue) => {
    dispatch(setFilters({ ...filters, sort: sortValue }));
    setSortMenuVisible(false);
  };
  
  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange({ min: '', max: '' });
    setSearchQuery('');
    dispatch(setFilters({}));
  };
  
  const renderServiceCard = ({ item }) => (
    <Card 
      style={styles.serviceCard}
      onPress={() => navigation.navigate('ServiceDetails', { serviceId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Avatar.Image 
            size={40} 
            source={{ uri: item.provider?.avatar || 'https://via.placeholder.com/40' }}
          />
          <View style={styles.providerInfo}>
            <Title style={styles.serviceTitle} numberOfLines={2}>
              {item.title}
            </Title>
            <Text style={styles.providerName}>
              by {item.provider?.name}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Badge style={styles.ratingBadge}>
              ⭐ {item.rating?.toFixed(1) || 'New'}
            </Badge>
          </View>
        </View>
        
        <Paragraph style={styles.description} numberOfLines={3}>
          {item.description}
        </Paragraph>
        
        <View style={styles.cardFooter}>
          <Chip 
            mode="outlined" 
            style={styles.categoryChip}
            textStyle={styles.chipText}
          >
            {item.category}
          </Chip>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.price}>
              ₦{item.basePrice?.toLocaleString()}
            </Text>
          </View>
        </View>
        
        {item.isUrgent && (
          <Chip 
            mode="flat" 
            style={styles.urgentChip}
            textStyle={styles.urgentText}
            icon="clock-fast"
          >
            Urgent
          </Chip>
        )}
      </Card.Content>
    </Card>
  );
  
  const renderHeader = () => (
    <View style={styles.header}>
      <Searchbar
        placeholder="Search services..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={colors.primary}
      />
      
      <View style={styles.filterRow}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          {categories.map((category) => (
            <Chip
              key={category}
              mode={selectedCategories.includes(category) ? 'flat' : 'outlined'}
              selected={selectedCategories.includes(category)}
              onPress={() => handleCategoryToggle(category)}
              style={styles.categoryFilter}
              textStyle={{
                color: selectedCategories.includes(category) 
                  ? colors.surface 
                  : colors.primary
              }}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
        
        <View style={styles.actionButtons}>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <IconButton
                icon="sort"
                mode="outlined"
                onPress={() => setSortMenuVisible(true)}
                style={styles.actionButton}
              />
            }
          >
            {sortOptions.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => handleSortChange(option.value)}
                title={option.label}
              />
            ))}
          </Menu>
          
          <IconButton
            icon="filter-variant"
            mode="outlined"
            onPress={() => setFilterMenuVisible(true)}
            style={styles.actionButton}
          />
        </View>
      </View>
      
      {(selectedCategories.length > 0 || searchQuery) && (
        <View style={styles.activeFilters}>
          <Text style={styles.resultsText}>
            {services.length} services found
          </Text>
          <Button 
            mode="text" 
            onPress={clearFilters}
            compact
            labelStyle={styles.clearFiltersText}
          >
            Clear filters
          </Button>
        </View>
      )}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (pagination.hasMore && !loading) {
            // Load more services
            dispatch(fetchServices({ 
              ...filters, 
              page: pagination.currentPage + 1 
            }));
          }
        }}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  searchBar: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoriesScroll: {
    flex: 1,
    marginRight: spacing.sm,
  },
  categoryFilter: {
    marginRight: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: spacing.xs,
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  resultsText: {
    color: colors.onSurface,
    fontSize: 14,
  },
  clearFiltersText: {
    color: colors.primary,
    fontSize: 12,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  serviceCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  providerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  providerName: {
    fontSize: 12,
    color: colors.onSurface + '80',
    marginTop: 2,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    backgroundColor: colors.primary + '20',
  },
  description: {
    fontSize: 14,
    color: colors.onSurface + 'CC',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.primaryContainer,
  },
  chipText: {
    fontSize: 12,
    color: colors.onPrimaryContainer,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    color: colors.onSurface + '80',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  urgentChip: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error + '20',
  },
  urgentText: {
    color: colors.error,
    fontSize: 10,
  },
});

export default ServiceListScreen;