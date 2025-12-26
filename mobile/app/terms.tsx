/**
 * Terms of Service Screen
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

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last Updated: December 26, 2024</Text>

        <Section title="1. Acceptance of Terms">
          By downloading, installing, or using Watermark Remover ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.
        </Section>

        <Section title="2. Description of Service">
          Watermark Remover is a mobile application that removes watermarks, overlays, and unwanted text from images. The service includes:
          <BulletPoint>Free trial with limited daily usage</BulletPoint>
          <BulletPoint>One-time purchase option for unlimited access (Pro)</BulletPoint>
          <BulletPoint>Advanced image processing</BulletPoint>
        </Section>

        <Section title="3. User Responsibilities">
          You agree to:
          <BulletPoint>Use the App only for lawful purposes</BulletPoint>
          <BulletPoint>Not use the App to infringe on any third-party intellectual property rights</BulletPoint>
          <BulletPoint>Not use the App to remove watermarks from copyrighted content without authorization</BulletPoint>
          <BulletPoint>Take full responsibility for the images you process</BulletPoint>
        </Section>

        <Section title="4. Intellectual Property">
          <BulletPoint>The App and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.</BulletPoint>
          <BulletPoint>You retain all rights to your original images. We do not claim ownership of any images you process through the App.</BulletPoint>
        </Section>

        <Section title="5. In-App Purchases">
          <BulletPoint>
            <Text style={styles.bold}>Pro Unlock:</Text> A one-time purchase that provides unlimited access to all features.
          </BulletPoint>
          <BulletPoint>All purchases are processed through Apple's App Store and are subject to Apple's terms and conditions.</BulletPoint>
          <BulletPoint>Purchases are non-refundable except as required by applicable law or Apple's refund policies.</BulletPoint>
          <BulletPoint>Your purchase is tied to your Apple ID and can be restored on other devices using the same Apple ID.</BulletPoint>
        </Section>

        <Section title="6. Free Trial">
          <BulletPoint>New users receive 3 free image processing credits per day.</BulletPoint>
          <BulletPoint>Free credits reset daily at midnight (UTC).</BulletPoint>
          <BulletPoint>We reserve the right to modify the free trial terms at any time.</BulletPoint>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT:
          <BulletPoint>The App will meet your specific requirements</BulletPoint>
          <BulletPoint>The App will be uninterrupted, timely, secure, or error-free</BulletPoint>
          <BulletPoint>The results obtained from using the App will be accurate or reliable</BulletPoint>
          <BulletPoint>All watermarks will be completely removed</BulletPoint>
        </Section>

        <Section title="8. Limitation of Liability">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE APP.
        </Section>

        <Section title="9. Prohibited Uses">
          You may not use the App to:
          <BulletPoint>Remove watermarks from content you do not own or have permission to modify</BulletPoint>
          <BulletPoint>Create or distribute illegal content</BulletPoint>
          <BulletPoint>Violate any applicable laws or regulations</BulletPoint>
          <BulletPoint>Infringe on the rights of others</BulletPoint>
          <BulletPoint>Attempt to reverse engineer or hack the App</BulletPoint>
        </Section>

        <Section title="10. Termination">
          We reserve the right to terminate or suspend your access to the App immediately, without prior notice, for any reason, including breach of these Terms.
        </Section>

        <Section title="11. Changes to Terms">
          We reserve the right to modify these Terms at any time. We will notify users of any material changes by updating the "Last Updated" date. Your continued use of the App after such changes constitutes acceptance of the new Terms.
        </Section>

        <Section title="12. Governing Law">
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which we operate, without regard to its conflict of law provisions.
        </Section>

        <Section title="13. Contact Information">
          If you have any questions about these Terms, please contact us at:
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

