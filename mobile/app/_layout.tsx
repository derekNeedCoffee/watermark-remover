/**
 * Root Layout
 */
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import { colors } from '../src/constants/theme';
import { ComplianceModal } from '../src/components/ComplianceModal';
import { hasAcceptedCompliance, setComplianceAccepted } from '../src/services/storage';

export default function RootLayout() {
  const [showCompliance, setShowCompliance] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    checkCompliance();
  }, []);

  const checkCompliance = async () => {
    const accepted = await hasAcceptedCompliance();
    if (!accepted) {
      setShowCompliance(true);
    }
    setReady(true);
  };

  const handleAcceptCompliance = async () => {
    await setComplianceAccepted();
    setShowCompliance(false);
  };

  if (!ready) {
    return <View style={styles.container} />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Watermark Remover',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="editor"
          options={{
            title: 'Edit Image',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="processing"
          options={{
            title: 'Processing',
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="result"
          options={{
            title: 'Result',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{
            title: 'Privacy Policy',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            title: 'Terms of Service',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>

      <ComplianceModal
        visible={showCompliance}
        onAccept={handleAcceptCompliance}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

