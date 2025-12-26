/**
 * Image Compare Component
 * 
 * Shows before/after comparison with toggle or slider
 */
import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants/theme';

interface ImageCompareProps {
  beforeUri: string;
  afterUri: string;
}

export function ImageCompare({ beforeUri, afterUri }: ImageCompareProps) {
  const [showAfter, setShowAfter] = useState(true);

  return (
    <View style={styles.container}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: showAfter ? afterUri : beforeUri }}
          style={styles.image}
          resizeMode="contain"
        />
        
        {/* Label */}
        <View style={styles.label}>
          <Text style={styles.labelText}>
            {showAfter ? 'After' : 'Before'}
          </Text>
        </View>
      </View>

      {/* Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !showAfter && styles.toggleButtonActive]}
          onPress={() => setShowAfter(false)}
        >
          <Text style={[styles.toggleText, !showAfter && styles.toggleTextActive]}>
            Before
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, showAfter && styles.toggleButtonActive]}
          onPress={() => setShowAfter(true)}
        >
          <Text style={[styles.toggleText, showAfter && styles.toggleTextActive]}>
            After
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    flex: 1,
    width: '100%',
  },
  label: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  labelText: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  toggleButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: colors.text,
  },
});


