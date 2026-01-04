/**
 * Editor Screen
 */
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors, spacing, borderRadius, typography } from '../src/constants/theme';
import { Button } from '../src/components/Button';
import { BBoxSelector, NormalizedBBox } from '../src/components/BBoxSelector';
import { PaywallModal } from '../src/components/PaywallModal';
import { useEntitlement } from '../src/hooks/useEntitlement';
import { getCurrentImage, setCurrentImage } from '../src/services/imageStore';

export default function EditorScreen() {
  const router = useRouter();
  
  // Get image from memory store (fast!)
  const [imageData, setImageData] = useState<any>(getCurrentImage());
  const [isProcessing, setIsProcessing] = useState(false);

  const { entitlement, installId, refresh, canUseService } = useEntitlement();
  const [bbox, setBBox] = useState<NormalizedBBox | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const imageWidth = imageData?.width || 0;
  const imageHeight = imageData?.height || 0;

  // Process image in background if needed
  useEffect(() => {
    const processImageIfNeeded = async () => {
      // Get fresh image data
      const currentData = getCurrentImage() as any;
      
      if (!currentData) {
        router.back();
        return;
      }

      // Always process if no base64 (HEIC -> JPEG conversion)
      // This ensures HEIC images are always converted
      if (!currentData.base64 || currentData.needsProcessing) {
        setIsProcessing(true);
        try {
          console.log('📷 Processing image (HEIC -> JPEG)...');
          console.log('📷 Original URI:', currentData.uri);
          
          const manipulated = await ImageManipulator.manipulateAsync(
            currentData.uri,
            [
              // Resize if too large (max 2048px on longest side)
              ...(Math.max(currentData.width || 0, currentData.height || 0) > 2048
                ? [{ resize: { width: 2048, height: 2048 } }]
                : []),
            ],
            {
              compress: 0.7,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );
          
          console.log('📷 Image converted to JPEG:', Math.round((manipulated.base64?.length || 0) / 1024), 'KB');
          
          // Update image data with processed result
          const updatedData = {
            uri: manipulated.uri,
            base64: manipulated.base64 || '',
            width: manipulated.width,
            height: manipulated.height,
            needsProcessing: false,
          };
          
          setCurrentImage(updatedData);
          setImageData(updatedData);
        } catch (error) {
          console.error('Image processing error:', error);
          Alert.alert('Error', 'Failed to process image. Please try again.');
          router.back();
        } finally {
          setIsProcessing(false);
        }
      } else {
        // Image already has base64, use it directly
        console.log('📷 Image already processed:', Math.round((currentData.base64?.length || 0) / 1024), 'KB');
        setImageData(currentData);
      }
    };

    processImageIfNeeded();
  }, []);

  const handleBBoxChange = useCallback((newBBox: NormalizedBBox | null) => {
    setBBox(newBBox);
  }, []);

  const handleRemove = () => {
    if (!bbox) {
      Alert.alert('Select Region', 'Please draw a box around the area you want to remove.');
      return;
    }

    if (!canUseService) {
      setShowPaywall(true);
      return;
    }

    if (!imageData || !imageData.base64) {
      Alert.alert('Error', 'Image is still processing. Please wait.');
      return;
    }

    // Store bbox in image data for processing screen (sync, fast)
    const updatedImageData = {
      ...imageData,
      bbox,
    };
    setCurrentImage(updatedImageData as any);

    // Navigate immediately - just pass bbox params
    router.push(`/processing?bboxX0=${bbox.x0}&bboxY0=${bbox.y0}&bboxX1=${bbox.x1}&bboxY1=${bbox.y1}&retryLevel=0`);
  };

  const handleExpand = () => {
    if (bbox) {
      // Expand bbox by 10%
      const expandRatio = 0.1;
      const width = bbox.x1 - bbox.x0;
      const height = bbox.y1 - bbox.y0;
      const expandX = width * expandRatio / 2;
      const expandY = height * expandRatio / 2;

      const newBBox: NormalizedBBox = {
        x0: Math.max(0, bbox.x0 - expandX),
        y0: Math.max(0, bbox.y0 - expandY),
        x1: Math.min(1, bbox.x1 + expandX),
        y1: Math.min(1, bbox.y1 + expandY),
      };
      setBBox(newBBox);
    }
  };

  const handleReset = () => {
    setBBox(null);
    // Force re-render of BBoxSelector
    BBoxSelector.reset?.();
  };

  const handlePurchaseSuccess = () => {
    setShowPaywall(false);
    refresh();
  };

  if (!imageData) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageData.uri }}
          style={styles.image}
          resizeMode="contain"
        />
        
        {/* Processing overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>Preparing image...</Text>
          </View>
        )}
        
        {/* BBox Selector Overlay */}
        {!isProcessing && imageWidth > 0 && imageHeight > 0 && (
          <BBoxSelector
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            onBBoxChange={handleBBoxChange}
          />
        )}

        {/* Instruction hint at top */}
        {!bbox && !isProcessing && (
          <View style={styles.hintContainer} pointerEvents="none">
            <Text style={styles.hintText}>
              Drag to select the area to remove
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.secondaryActions}>
          <Button
            title="Expand 10%"
            onPress={handleExpand}
            variant="secondary"
            size="medium"
            disabled={!bbox || isProcessing}
          />
          <Button
            title="Reset"
            onPress={handleReset}
            variant="outline"
            size="medium"
            disabled={!bbox || isProcessing}
          />
        </View>

        <Button
          title={isProcessing ? "Preparing..." : (canUseService ? "Remove" : "Unlock to Remove")}
          onPress={handleRemove}
          size="large"
          disabled={!bbox || isProcessing}
          loading={isProcessing}
        />

        {/* Entitlement Info */}
        {entitlement && (
          <Text style={styles.entitlementInfo}>
            {(entitlement.credits ?? 0) + (entitlement.freeRemaining ?? 0) > 0
              ? `${(entitlement.credits ?? 0) + (entitlement.freeRemaining ?? 0)} uses remaining`
              : 'No credits • Buy more to continue'}
          </Text>
        )}
      </View>

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchaseSuccess={handlePurchaseSuccess}
        installId={installId || ''}
      />
    </SafeAreaView>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: colors.text,
    fontSize: typography.fontSize.md,
    marginTop: spacing.md,
  },
  hintContainer: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },
  hintText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  actions: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  entitlementInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
