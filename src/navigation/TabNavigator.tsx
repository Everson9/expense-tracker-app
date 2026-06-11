import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList, AppStackParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import GastosScreen from '../screens/GastosScreen';
import ReceitasScreen from '../screens/ReceitasScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GraficosScreen from '../screens/GraficosScreen';
import MetasScreen from '../screens/MetasScreen';
import FormScreen from '../screens/FormScreen';

const Tab = createBottomTabNavigator<TabParamList>();

function makeStack(ListScreen: React.ComponentType<any>, listTitle: string, formTitle = 'Novo Gasto') {
  const Stack = createNativeStackNavigator<AppStackParamList>();
  return function StackScreen() {
    const { theme } = useTheme();
    const stackOptions = {
      headerStyle: { backgroundColor: theme.bg },
      headerTintColor: theme.text,
      headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
      contentStyle: { backgroundColor: theme.bg },
      headerShadowVisible: false,
    };
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

const HomeStack     = makeStack(HomeScreen,    'Resumo');
const GastosStack   = makeStack(GastosScreen,  'Despesas', 'Nova Despesa');
const ReceitasStack = makeStack(ReceitasScreen, 'Receitas', 'Nova Receita');

export default function TabNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSub,
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
        name="Gráficos"
        component={GraficosScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
          headerShown: true,
          headerTitle: 'Gráficos',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '700' as const },
          headerShadowVisible: false,
        }}
      />
      <Tab.Screen
        name="Metas"
        component={MetasScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎯</Text>,
          headerShown: true,
          headerTitle: 'Metas',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '700' as const },
          headerShadowVisible: false,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
          headerShown: true,
          headerTitle: 'Perfil',
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '700' as const },
          headerShadowVisible: false,
        }}
      />
    </Tab.Navigator>
  );
}
