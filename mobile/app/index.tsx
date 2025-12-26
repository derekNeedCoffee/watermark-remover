/**
 * Home Screen
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { setCurrentImage } from '../src/services/imageStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, borderRadius, typography, shadows } from '../src/constants/theme';
import { Button } from '../src/components/Button';
import { useEntitlement } from '../src/hooks/useEntitlement';

export default function HomeScreen() {
  const router = useRouter();
  const { entitlement, loading, refresh, canUseService } = useEntitlement();
  const [pickingImage, setPickingImage] = useState(false);

  // Refresh entitlement when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleSelectImage = async () => {
    try {
      // Request permission first (no loading indicator needed)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to select images.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Pick image (no loading indicator - system UI handles this)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,  // Get full quality, we'll compress after
        base64: false,  // Don't get base64 yet, faster picker
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Store original image immediately and navigate (fast!)
        // We'll process the image in the background on editor screen
        setCurrentImage({
          uri: asset.uri,
          base64: '', // Will be processed later
          width: asset.width || 0,
          height: asset.height || 0,
          needsProcessing: true, // Flag to process on editor
        } as any);
        
        // Navigate immediately
        router.push('/editor');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setPickingImage(false);
    }
  };

  const getStatusText = () => {
    if (loading) return 'Loading...';
    if (!entitlement) return '';
    if (entitlement.isPro) return '✨ Pro Unlocked';
    if (entitlement.freeRemaining > 0) {
      return `${entitlement.freeRemaining} free use${entitlement.freeRemaining > 1 ? 's' : ''} remaining`;
    }
    return 'Free trial used';
  };

  const getStatusStyle = () => {
    if (!entitlement) return styles.statusNeutral;
    if (entitlement.isPro) return styles.statusPro;
    if (entitlement.freeRemaining > 0) return styles.statusFree;
    return styles.statusExpired;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Watermark{'\n'}Remover</Text>
        <Text style={styles.subtitle}>
          Clean images in seconds
        </Text>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, getStatusStyle()]}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Feature Cards */}
        <View style={styles.features}>
          <FeatureCard
            icon="🎯"
            title="Select Region"
            description="Draw a box around the area you want to clean"
          />
          <FeatureCard
            icon="✨"
            title="Smart Removal"
            description="Removes watermarks and fills in the background seamlessly"
          />
          <FeatureCard
            icon="💾"
            title="Save & Share"
            description="Download or share your cleaned image"
          />
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <Button
          title="Select Image"
          onPress={handleSelectImage}
          size="large"
        />
        
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Decorative Elements */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
    </SafeAreaView>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 48,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xl,
  },
  statusNeutral: {
    backgroundColor: colors.surface,
  },
  statusPro: {
    backgroundColor: colors.primary,
  },
  statusFree: {
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
  },
  statusExpired: {
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  features: {
    gap: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  settingsButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  settingsText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  // Decorative elements
  decorCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary + '10',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent + '08',
  },
});

