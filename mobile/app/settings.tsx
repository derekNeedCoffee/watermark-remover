/**
 * Settings Screen
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography } from '../src/constants/theme';
import { Button } from '../src/components/Button';
import { PaywallModal } from '../src/components/PaywallModal';
import { useEntitlement } from '../src/hooks/useEntitlement';
import { restorePurchases } from '../src/services/iap';
import { DEV_MODE } from '../src/constants/config';

export default function SettingsScreen() {
  const router = useRouter();
  const { entitlement, installId, refresh } = useEntitlement();
  const [showPaywall, setShowPaywall] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    if (!installId) return;

    setRestoring(true);
    try {
      const result = await restorePurchases(installId);
      if (result.success) {
        await refresh();
        Alert.alert('Success', 'Your purchase has been restored.');
      } else {
        Alert.alert('No Purchases Found', result.error || 'No previous purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const handlePurchaseSuccess = () => {
    setShowPaywall(false);
    refresh();
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link.');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Status</Text>
            <View style={[
              styles.statusBadge,
              entitlement?.isPro ? styles.statusPro : styles.statusFree
            ]}>
              <Text style={styles.statusText}>
                {entitlement?.isPro ? 'Pro' : 'Free'}
              </Text>
            </View>
          </View>

          {!entitlement?.isPro && (
            <>
              <View style={styles.divider} />
              <View style={styles.statusRow}>
                <Text style={styles.label}>Free Uses Remaining</Text>
                <Text style={styles.value}>{entitlement?.freeRemaining ?? 0}</Text>
              </View>
            </>
          )}
        </View>

        {!entitlement?.isPro && (
          <Button
            title="Upgrade to Pro"
            onPress={() => setShowPaywall(true)}
            size="large"
            style={styles.upgradeButton}
          />
        )}

        <Button
          title="Restore Purchases"
          onPress={handleRestore}
          variant="outline"
          loading={restoring}
          disabled={restoring}
        />
      </View>

      {/* Legal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        
        <View style={styles.card}>
          <SettingsLink
            title="Privacy Policy"
            onPress={() => router.push('/privacy')}
          />
          <View style={styles.divider} />
          <SettingsLink
            title="Terms of Service"
            onPress={() => router.push('/terms')}
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <View style={styles.card}>
          <SettingsLink
            title="Send Feedback"
            onPress={() => Linking.openURL('mailto:support@example.com?subject=Watermark Remover Feedback')}
          />
        </View>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Watermark Remover v1.0.0</Text>
        <Text style={styles.footerText}>Install ID: {installId?.slice(0, 8)}...</Text>
        {DEV_MODE && (
          <Text style={[styles.footerText, { color: colors.warning }]}>
            🔧 DEV MODE - Paywall Disabled
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

function SettingsLink({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.linkRow} onPress={onPress}>
      <Text style={styles.linkText}>{title}</Text>
      <Text style={styles.linkArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  value: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusPro: {
    backgroundColor: colors.primary,
  },
  statusFree: {
    backgroundColor: colors.surfaceLight,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  upgradeButton: {
    marginBottom: spacing.md,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  linkArrow: {
    fontSize: typography.fontSize.xl,
    color: colors.textMuted,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
});

