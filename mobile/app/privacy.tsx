/**
 * Privacy Policy Screen
 * Required for App Store review
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, typography } from '../src/constants/theme';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last Updated: December 26, 2024</Text>

        <Section title="1. Introduction">
          Welcome to Watermark Remover ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.
        </Section>

        <Section title="2. Information We Collect">
          <BulletPoint>
            <Text style={styles.bold}>Device Information:</Text> We collect a unique device identifier (Installation ID) to manage your free usage quota and in-app purchases.
          </BulletPoint>
          <BulletPoint>
            <Text style={styles.bold}>Images:</Text> Images you select for editing are temporarily processed on our servers and are not stored permanently. We do not access, view, or retain your images after processing is complete.
          </BulletPoint>
          <BulletPoint>
            <Text style={styles.bold}>Purchase Information:</Text> When you make in-app purchases, Apple processes the transaction. We only receive a receipt to verify your purchase status.
          </BulletPoint>
        </Section>

        <Section title="3. How We Use Your Information">
          <BulletPoint>To provide our watermark removal service</BulletPoint>
          <BulletPoint>To track your free usage quota</BulletPoint>
          <BulletPoint>To verify and manage your in-app purchases</BulletPoint>
          <BulletPoint>To improve our service quality</BulletPoint>
        </Section>

        <Section title="4. Data Storage and Security">
          <BulletPoint>Your Installation ID is stored securely on your device using encrypted storage.</BulletPoint>
          <BulletPoint>Images are processed in memory and are not permanently stored on our servers.</BulletPoint>
          <BulletPoint>We use industry-standard security measures to protect data during transmission.</BulletPoint>
        </Section>

        <Section title="5. Third-Party Services">
          Our app uses the following third-party services:
          <BulletPoint>
            <Text style={styles.bold}>Apple App Store:</Text> For in-app purchases and app distribution
          </BulletPoint>
          <BulletPoint>
            <Text style={styles.bold}>Cloud Processing:</Text> For image processing (images are processed but not stored)
          </BulletPoint>
        </Section>

        <Section title="6. Data Retention">
          <BulletPoint>Device identifiers are retained as long as you use the app.</BulletPoint>
          <BulletPoint>Images are deleted immediately after processing.</BulletPoint>
          <BulletPoint>Purchase records are retained for account management and support purposes.</BulletPoint>
        </Section>

        <Section title="7. Your Rights">
          You have the right to:
          <BulletPoint>Request deletion of your data by contacting us</BulletPoint>
          <BulletPoint>Uninstall the app to remove locally stored data</BulletPoint>
          <BulletPoint>Contact us with questions about your data</BulletPoint>
        </Section>

        <Section title="8. Children's Privacy">
          Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us.
        </Section>

        <Section title="9. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </Section>

        <Section title="10. Contact Us">
          If you have any questions about this Privacy Policy, please contact us at:
          {'\n\n'}
          Email: support@watermark-remover.app
        </Section>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{children}</Text>
    </View>
  );
}

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.bulletPoint}>
      {'\n'}• {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  lastUpdated: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  bulletPoint: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    height: spacing.xl,
  },
});

