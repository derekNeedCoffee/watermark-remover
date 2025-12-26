/**
 * Processing Screen
 */
import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../src/constants/theme';
import { Button } from '../src/components/Button';
import { editImage, ApiError } from '../src/services/api';
import { getInstallId } from '../src/services/storage';
import { getCurrentImage, setCurrentImage } from '../src/services/imageStore';

export default function ProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bboxX0: string;
    bboxY0: string;
    bboxX1: string;
    bboxY1: string;
    retryLevel: string;
  }>();

  // Get image from memory store
  const imageData = getCurrentImage();

  const [status, setStatus] = useState<'processing' | 'error' | 'timeout'>('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!imageData) {
      router.back();
      return;
    }
    processImage();

    return () => {
      abortRef.current = true;
    };
  }, []);

  const processImage = async () => {
    if (!imageData) return;

    try {
      setStatus('processing');
      setProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 1000);

      const installId = await getInstallId();
      
      // Prepare base64 with data URI prefix if not present
      let imageBase64 = imageData.base64;
      if (!imageBase64.startsWith('data:')) {
        imageBase64 = `data:image/jpeg;base64,${imageBase64}`;
      }

      // Log image size for debugging
      const imageSizeKB = Math.round(imageBase64.length / 1024);
      console.log(`📷 Processing image: ${imageSizeKB} KB`);

      const result = await editImage({
        installId,
        imageBase64,
        bbox: {
          x0: parseFloat(params.bboxX0),
          y0: parseFloat(params.bboxY0),
          x1: parseFloat(params.bboxX1),
          y1: parseFloat(params.bboxY1),
        },
        retryLevel: parseInt(params.retryLevel || '0', 10),
      });

      clearInterval(progressInterval);

      if (abortRef.current) return;

      setProgress(100);

      // Store result for result screen
      setCurrentImage({
        ...imageData,
        resultBase64: result.resultBase64,
        retryLevel: result.meta.retryLevel,
      } as any);

      // Navigate to result (instant!)
      router.replace({
        pathname: '/result',
        params: {
          bboxX0: params.bboxX0,
          bboxY0: params.bboxY0,
          bboxX1: params.bboxX1,
          bboxY1: params.bboxY1,
          retryLevel: result.meta.retryLevel.toString(),
        },
      });
    } catch (error) {
      if (abortRef.current) return;

      console.error('Processing error:', error);

      if (error instanceof ApiError) {
        if (error.code === 'PAYWALL') {
          // Go back to editor with paywall
          router.back();
          return;
        }
        
        if (error.statusCode === 408 || error.statusCode === 504) {
          setStatus('timeout');
          setErrorMessage('Request timed out. Please try again.');
          return;
        }
      }

      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Processing failed. Please try again.'
      );
    }
  };

  const handleRetry = () => {
    abortRef.current = false;
    processImage();
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.title}>Processing...</Text>
            <Text style={styles.subtitle}>
              This may take a few seconds
            </Text>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </>
        )}

        {(status === 'error' || status === 'timeout') && (
          <>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.title}>
              {status === 'timeout' ? 'Request Timeout' : 'Processing Failed'}
            </Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            
            <View style={styles.errorActions}>
              <Button
                title="Retry"
                onPress={handleRetry}
                size="large"
              />
              <Button
                title="Go Back"
                onPress={handleGoBack}
                variant="outline"
                size="medium"
              />
            </View>
          </>
        )}
      </View>

      {/* Decorative */}
      <View style={styles.decorCircle} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  progressContainer: {
    width: '80%',
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorIcon: {
    fontSize: 64,
  },
  errorMessage: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorActions: {
    marginTop: spacing.xl,
    gap: spacing.md,
    width: '100%',
  },
  decorCircle: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary + '10',
  },
});
