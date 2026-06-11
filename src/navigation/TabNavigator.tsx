import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabParamList, AppStackParamList } from '../types/navigation';
import HomeScreen from '../screens/HomeScreen';
import GastosScreen from '../screens/GastosScreen';
import ReceitasScreen from '../screens/ReceitasScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FormScreen from '../screens/FormScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const stackOptions = {
  headerStyle: { backgroundColor: '#0D0D0D' },
  headerTintColor: '#F5F5F5',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
  contentStyle: { backgroundColor: '#0D0D0D' },
  headerShadowVisible: false,
};

function makeStack(ListScreen: React.ComponentType<any>, listTitle: string, formTitle = 'Novo Gasto') {
  const Stack = createNativeStackNavigator<AppStackParamList>();
  return function StackScreen() {
    return (
      <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen name="Home" component={ListScreen} options={{ title: listTitle }} />
        <Stack.Screen
          name="Form"
          component={FormScreen}
          options={({ route }) => ({ title: route.params?.expense ? 'Editar' : formTitle })}
        />
      </Stack.Navigator>
    );
  };
}

const HomeStack    = makeStack(HomeScreen,    'Resumo');
const GastosStack  = makeStack(GastosScreen,  'Despesas', 'Nova Despesa');
const ReceitasStack = makeStack(ReceitasScreen, 'Receitas', 'Nova Receita');

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: '#1A1A1A',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#00D4A1',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Início"
        component={HomeStack}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Gastos"
        component={GastosStack}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💸</Text> }}
      />
      <Tab.Screen
        name="Receitas"
        component={ReceitasStack}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💰</Text> }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
          headerShown: true,
          headerTitle: 'Perfil',
          headerStyle: { backgroundColor: '#0D0D0D' },
          headerTintColor: '#F5F5F5',
          headerTitleStyle: { fontWeight: '700' as const },
          headerShadowVisible: false,
        }}
      />
    </Tab.Navigator>
  );
}
