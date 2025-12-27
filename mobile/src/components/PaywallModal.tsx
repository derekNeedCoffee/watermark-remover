/**
 * Paywall Modal Component - Credits System
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';
import { Button } from './Button';
import { getProducts, purchaseCredits, restorePurchases } from '../services/iap';
import { IAP_PRODUCTS, CREDITS_AMOUNT } from '../constants/config';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess: () => void;
  installId: string;
}

interface CreditPackage {
  productId: string;
  credits: number;
  price: string;
  popular?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { productId: IAP_PRODUCTS.CREDITS_10, credits: 10, price: '$0.99' },
  { productId: IAP_PRODUCTS.CREDITS_50, credits: 50, price: '$2.99', popular: true },
  { productId: IAP_PRODUCTS.CREDITS_100, credits: 100, price: '$4.99' },
];

export function PaywallModal({
  visible,
  onClose,
  onPurchaseSuccess,
  installId,
}: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(CREDIT_PACKAGES[1]);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await purchaseCredits(installId, selectedPackage.productId);
      if (result.success) {
        onPurchaseSuccess();
      } else {
        setError(result.error || 'Purchase failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);

    try {
      const result = await restorePurchases(installId);
      if (result.success) {
        onPurchaseSuccess();
      } else {
        setError(result.error || 'No purchases to restore');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Get Credits</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Each credit = 1 watermark removal
          </Text>

          {/* Credit Packages */}
          <View style={styles.packages}>
            {CREDIT_PACKAGES.map((pkg) => (
              <TouchableOpacity
                key={pkg.productId}
                style={[
                  styles.packageCard,
                  selectedPackage.productId === pkg.productId && styles.packageCardSelected,
                ]}
                onPress={() => setSelectedPackage(pkg)}
              >
                {pkg.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>BEST VALUE</Text>
                  </View>
                )}
                <Text style={styles.packageCredits}>{pkg.credits}</Text>
                <Text style={styles.packageLabel}>Credits</Text>
                <Text style={styles.packagePrice}>{pkg.price}</Text>
                <Text style={styles.packagePerCredit}>
                  ${(parseFloat(pkg.price.replace('$', '')) / pkg.credits).toFixed(2)}/each
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Features */}
          <View style={styles.features}>
            <FeatureItem emoji="✨" text="AI-powered watermark removal" />
            <FeatureItem emoji="⚡" text="Fast processing in seconds" />
            <FeatureItem emoji="🔒" text="Your photos stay private" />
            <FeatureItem emoji="♾️" text="Credits never expire" />
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title={`Buy ${selectedPackage.credits} Credits - ${selectedPackage.price}`}
              onPress={handlePurchase}
              loading={loading}
              disabled={loading || restoring}
              size="large"
            />
            <Button
              title="Restore Purchase"
              onPress={handleRestore}
              variant="ghost"
              loading={restoring}
              disabled={loading || restoring}
            />
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By purchasing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function FeatureItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    fontSize: typography.fontSize.xl,
    color: colors.textMuted,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  packages: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  packageCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    minWidth: 90,
  },
  packageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  packageCredits: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  packageLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  packagePrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
  },
  packagePerCredit: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  features: {
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureEmoji: {
    fontSize: 18,
    marginRight: spacing.sm,
    width: 24,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
  },
  terms: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
