/**
 * Secure storage service for installId and other sensitive data
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INSTALL_ID_KEY = 'install_id';
const COMPLIANCE_ACCEPTED_KEY = 'compliance_accepted';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create install ID
 * Uses SecureStore for persistence across app reinstalls (when possible)
 */
export async function getInstallId(): Promise<string> {
  try {
    // Try to get existing install ID
    let installId = await SecureStore.getItemAsync(INSTALL_ID_KEY);
    
    if (!installId) {
      // Generate new install ID
      installId = generateUUID();
      await SecureStore.setItemAsync(INSTALL_ID_KEY, installId);
    }
    
    return installId;
  } catch (error) {
    // Fallback to AsyncStorage if SecureStore fails
    console.warn('SecureStore failed, falling back to AsyncStorage:', error);
    
    let installId = await AsyncStorage.getItem(INSTALL_ID_KEY);
    
    if (!installId) {
      installId = generateUUID();
      await AsyncStorage.setItem(INSTALL_ID_KEY, installId);
    }
    
    return installId;
  }
}

/**
 * Check if user has accepted compliance terms
 */
export async function hasAcceptedCompliance(): Promise<boolean> {
  try {
    const accepted = await AsyncStorage.getItem(COMPLIANCE_ACCEPTED_KEY);
    return accepted === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark compliance as accepted
 */
export async function setComplianceAccepted(): Promise<void> {
  await AsyncStorage.setItem(COMPLIANCE_ACCEPTED_KEY, 'true');
}

