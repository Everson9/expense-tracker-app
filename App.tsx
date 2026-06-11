import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { AuthProvider } from './src/contexts/AuthContext';
import { CategoryProvider } from './src/contexts/CategoryContext';
import { MonthProvider } from './src/contexts/MonthContext';
import RootNavigator from './src/navigation/RootNavigator';

async function checkForUpdates() {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) return;

    await Updates.fetchUpdateAsync();
    Alert.alert(
      'Atualização disponível',
      'Uma nova versão foi baixada. Reiniciar agora?',
      [
        { text: 'Depois', style: 'cancel' },
        { text: 'Reiniciar', onPress: () => Updates.reloadAsync() },
      ]
    );
  } catch {
    // silently fail — update is optional
  }
}

export default function App() {
  useEffect(() => {
    if (!__DEV__) checkForUpdates();
  }, []);

  return (
    <AuthProvider>
      <CategoryProvider>
        <MonthProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </MonthProvider>
      </CategoryProvider>
    </AuthProvider>
  );
}
