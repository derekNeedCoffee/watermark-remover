/**
 * Compliance Modal Component
 * 
 * Shown on first launch to get user agreement
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';
import { Button } from './Button';

interface ComplianceModalProps {
  visible: boolean;
  onAccept: () => void;
}

export function ComplianceModal({ visible, onAccept }: ComplianceModalProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Terms of Use</Text>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.heading}>Important Notice</Text>
            <Text style={styles.paragraph}>
              This app is designed to help you edit images that you own or have 
              explicit permission to modify.
            </Text>

            <Text style={styles.heading}>Permitted Use</Text>
            <Text style={styles.paragraph}>
              • Remove watermarks from your own original images{'\n'}
              • Edit images you have created or own the rights to{'\n'}
              • Process images where you have obtained proper authorization
            </Text>

            <Text style={styles.heading}>Prohibited Use</Text>
            <Text style={styles.paragraph}>
              • Removing copyright watermarks from others' work{'\n'}
              • Editing images without proper authorization{'\n'}
              • Any use that infringes on intellectual property rights
            </Text>

            <Text style={styles.heading}>Your Responsibility</Text>
            <Text style={styles.paragraph}>
              You are solely responsible for ensuring you have the right to edit 
              any image you process through this app. Misuse may result in 
              service termination.
            </Text>

            <Text style={styles.heading}>Privacy</Text>
            <Text style={styles.paragraph}>
              Images are processed through our secure servers and are not stored 
              permanently. Please review our Privacy Policy for more details.
            </Text>
          </ScrollView>

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I agree to the Terms of Use and confirm I will only process 
              images I have the right to edit.
            </Text>
          </TouchableOpacity>

          <Button
            title="Continue"
            onPress={onAccept}
            disabled={!agreed}
            size="large"
          />
        </View>
      </View>
    </Modal>
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
    maxHeight: '80%',
    ...shadows.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  content: {
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});


