import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import FormScreen from './src/screens/FormScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle:      { backgroundColor: '#0D0D0D' },
          headerTintColor:  '#F5F5F5',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          contentStyle:     { backgroundColor: '#0D0D0D' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Meus Gastos' }}
        />
        <Stack.Screen
          name="Form"
          component={FormScreen}
          options={({ route }) => ({
            title: route.params?.expense ? 'Editar Gasto' : 'Novo Gasto',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
