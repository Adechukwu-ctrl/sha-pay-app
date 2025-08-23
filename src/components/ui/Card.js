import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Surface,
  Text,
  IconButton,
  Chip,
  Divider,
} from 'react-native-paper';
import { colors, spacing, typography } from '../../theme';

const Card = ({
  children,
  title,
  subtitle,
  description,
  image,
  imageStyle,
  headerAction,
  footerActions,
  tags = [],
  onPress,
  style,
  contentStyle,
  elevation = 2,
  variant = 'elevated', // 'elevated', 'outlined', 'filled'
  padding = spacing.md,
  borderRadius = 12,
}) => {
  const cardStyles = [
    styles.card,
    {
      padding,
      borderRadius,
    },
    variant === 'elevated' && { elevation },
    variant === 'outlined' && styles.outlined,
    variant === 'filled' && styles.filled,
    style,
  ];

  const CardContent = () => (
    <View style={[styles.content, contentStyle]}>
      {/* Header */}
      {(title || subtitle || headerAction) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && (
              <Text variant="titleMedium" style={styles.title}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text variant="bodyMedium" style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>
          {headerAction && (
            <View style={styles.headerAction}>
              {headerAction}
            </View>
          )}
        </View>
      )}

      {/* Image */}
      {image && (
        <View style={styles.imageContainer}>
          <Image
            source={typeof image === 'string' ? { uri: image } : image}
            style={[styles.image, imageStyle]}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Description */}
      {description && (
        <Text variant="bodyMedium" style={styles.description}>
          {description}
        </Text>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <Chip
              key={index}
              mode="outlined"
              compact
              style={styles.tag}
              textStyle={styles.tagText}
            >
              {tag}
            </Chip>
          ))}
        </View>
      )}

      {/* Custom Children */}
      {children}

      {/* Footer Actions */}
      {footerActions && (
        <>
          <Divider style={styles.divider} />
          <View style={styles.footerActions}>
            {footerActions}
          </View>
        </>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Surface style={cardStyles}>
          <CardContent />
        </Surface>
      </TouchableOpacity>
    );
  }

  return (
    <Surface style={cardStyles}>
      <CardContent />
    </Surface>
  );
};

// Specialized Card Components
const ServiceCard = ({
  service,
  onPress,
  onFavorite,
  style,
}) => {
  const handleFavorite = () => {
    onFavorite && onFavorite(service);
  };

  return (
    <Card
      title={service.title}
      subtitle={`${service.provider?.name} • ${service.location}`}
      description={service.description}
      image={service.images?.[0]}
      tags={[service.category, `₦${service.price}`]}
      onPress={() => onPress && onPress(service)}
      headerAction={
        <IconButton
          icon={service.isFavorite ? 'heart' : 'heart-outline'}
          iconColor={service.isFavorite ? colors.error : colors.onSurface}
          size={20}
          onPress={handleFavorite}
        />
      }
      style={style}
    />
  );
};

const JobCard = ({
  job,
  onPress,
  onApply,
  style,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'completed':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.onSurface;
    }
  };

  return (
    <Card
      title={job.title}
      subtitle={`${job.client?.name} • ${job.location}`}
      description={job.description}
      tags={[
        job.category,
        `₦${job.budget}`,
        job.urgency,
      ]}
      onPress={() => onPress && onPress(job)}
      headerAction={
        <Chip
          mode="flat"
          textStyle={{
            color: getStatusColor(job.status),
            fontSize: 12,
            fontWeight: '600',
          }}
          style={{
            backgroundColor: getStatusColor(job.status) + '20',
          }}
        >
          {job.status.toUpperCase()}
        </Chip>
      }
      footerActions={
        job.status === 'active' && (
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => onApply && onApply(job)}
          >
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
        )
      }
      style={style}
    />
  );
};

const BookingCard = ({
  booking,
  onPress,
  onCancel,
  onContact,
  style,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'completed':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.onSurface;
    }
  };

  return (
    <Card
      title={booking.service?.title}
      subtitle={`${booking.provider?.name} • ${booking.scheduledDate}`}
      description={`${booking.service?.description?.substring(0, 100)}...`}
      tags={[
        booking.service?.category,
        `₦${booking.totalAmount}`,
      ]}
      onPress={() => onPress && onPress(booking)}
      headerAction={
        <Chip
          mode="flat"
          textStyle={{
            color: getStatusColor(booking.status),
            fontSize: 12,
            fontWeight: '600',
          }}
          style={{
            backgroundColor: getStatusColor(booking.status) + '20',
          }}
        >
          {booking.status.toUpperCase()}
        </Chip>
      }
      footerActions={
        <View style={styles.bookingActions}>
          {booking.status === 'confirmed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.contactButton]}
              onPress={() => onContact && onContact(booking)}
            >
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          )}
          {['pending', 'confirmed'].includes(booking.status) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => onCancel && onCancel(booking)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      }
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginVertical: spacing.xs,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.outline,
    elevation: 0,
  },
  filled: {
    backgroundColor: colors.surfaceVariant,
    elevation: 0,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerAction: {
    alignItems: 'flex-end',
  },
  title: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.onSurface + '80',
    fontSize: 14,
  },
  imageContainer: {
    marginVertical: spacing.sm,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  description: {
    color: colors.onSurface,
    lineHeight: 20,
    marginVertical: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  tag: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontSize: 12,
  },
  divider: {
    marginVertical: spacing.md,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  applyButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
  },
  contactButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  contactButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: colors.error,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Card;
export { ServiceCard, JobCard, BookingCard };