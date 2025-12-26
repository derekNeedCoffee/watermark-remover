/**
 * Result Screen
 */
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { colors, spacing, borderRadius, typography } from '../src/constants/theme';
import { Button } from '../src/components/Button';
import { ImageCompare } from '../src/components/ImageCompare';
import { getCurrentImage, setCurrentImage } from '../src/services/imageStore';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bboxX0: string;
    bboxY0: string;
    bboxX1: string;
    bboxY1: string;
    retryLevel: string;
  }>();

  // Get image from memory store
  const imageData = getCurrentImage() as any;

  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  // If no image data, go back
  useEffect(() => {
    if (!imageData || !imageData.resultBase64) {
      router.back();
    }
  }, [imageData]);

  // Convert base64 to file URI for display
  const getResultUri = useCallback(() => {
    const base64 = imageData?.resultBase64;
    if (!base64) return '';
    if (base64.startsWith('data:')) {
      return base64;
    }
    return `data:image/png;base64,${base64}`;
  }, [imageData?.resultBase64]);

  const handleSave = async () => {
    if (!imageData?.resultBase64) return;

    try {
      setSaving(true);

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to save images.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Save base64 to file
      const base64Data = imageData.resultBase64.replace(/^data:image\/\w+;base64,/, '');
      const fileUri = FileSystem.documentDirectory + 'watermark_removed_' + Date.now() + '.png';
      
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(fileUri);

      // Clean up temp file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });

      Alert.alert('Saved!', 'Image saved to your photo library.');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!imageData?.resultBase64) return;

    try {
      setSharing(true);

      // Save base64 to temp file for sharing
      const base64Data = imageData.resultBase64.replace(/^data:image\/\w+;base64,/, '');
      const fileUri = FileSystem.cacheDirectory + 'share_' + Date.now() + '.png';
      
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        // Fallback to system share
        await Share.share({
          url: fileUri,
        });
      }

      // Clean up temp file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.error('Share error:', error);
      // Don't show error for user cancellation
    } finally {
      setSharing(false);
    }
  };

  const handleRetryStronger = () => {
    if (!imageData) return;

    const currentLevel = parseInt(params.retryLevel || '0', 10);
    const nextLevel = Math.min(currentLevel + 1, 2);

    // Update image data with result as new input
    setCurrentImage({
      ...imageData,
      base64: imageData.resultBase64,
    });

    router.replace(`/processing?bboxX0=${params.bboxX0}&bboxY0=${params.bboxY0}&bboxX1=${params.bboxX1}&bboxY1=${params.bboxY1}&retryLevel=${nextLevel}`);
  };

  const handleExpandAndRetry = () => {
    if (!imageData) return;

    // Expand bbox by 10% and retry
    const x0 = parseFloat(params.bboxX0);
    const y0 = parseFloat(params.bboxY0);
    const x1 = parseFloat(params.bboxX1);
    const y1 = parseFloat(params.bboxY1);

    const width = x1 - x0;
    const height = y1 - y0;
    const expandX = width * 0.1 / 2;
    const expandY = height * 0.1 / 2;

    const newX0 = Math.max(0, x0 - expandX);
    const newY0 = Math.max(0, y0 - expandY);
    const newX1 = Math.min(1, x1 + expandX);
    const newY1 = Math.min(1, y1 + expandY);

    // Update image data with result as new input
    setCurrentImage({
      ...imageData,
      base64: imageData.resultBase64,
    });

    router.replace(`/processing?bboxX0=${newX0}&bboxY0=${newY0}&bboxX1=${newX1}&bboxY1=${newY1}&retryLevel=0`);
  };

  const handleNewImage = () => {
    router.replace('/');
  };

  if (!imageData || !imageData.resultBase64) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Image Compare */}
      <View style={styles.imageContainer}>
        <ImageCompare
          beforeUri={imageData.uri}
          afterUri={getResultUri()}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Primary Actions */}
        <View style={styles.primaryActions}>
          <Button
            title="Save"
            onPress={handleSave}
            loading={saving}
            disabled={saving || sharing}
            size="large"
            style={styles.flexButton}
          />
          <Button
            title="Share"
            onPress={handleShare}
            variant="secondary"
            loading={sharing}
            disabled={saving || sharing}
            size="large"
            style={styles.flexButton}
          />
        </View>

        {/* Retry Actions */}
        <View style={styles.retryActions}>
          <Button
            title="Retry (Stronger)"
            onPress={handleRetryStronger}
            variant="outline"
            size="medium"
          />
          <Button
            title="Expand & Retry"
            onPress={handleExpandAndRetry}
            variant="ghost"
            size="medium"
          />
        </View>

        {/* New Image */}
        <Button
          title="Process New Image"
          onPress={handleNewImage}
          variant="ghost"
          size="medium"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageContainer: {
    flex: 1,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  actions: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  retryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
