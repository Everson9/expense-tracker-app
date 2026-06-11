import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { AuthStackParamList, AppStackParamList } from '../types/navigation';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import FormScreen from '../screens/FormScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: '#0D0D0D' },
  headerTintColor: '#F5F5F5',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
  contentStyle: { backgroundColor: '#0D0D0D' },
  headerShadowVisible: false,
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={screenOptions}>
      <AppStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Meus Gastos' }}
      />
      <AppStack.Screen
        name="Form"
        component={FormScreen}
        options={({ route }) => ({
          title: route.params?.expense ? 'Editar Gasto' : 'Novo Gasto',
        })}
      />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4A1" />
      </View>
    );
  }

  return session ? <AppNavigator /> : <AuthNavigator />;
}
