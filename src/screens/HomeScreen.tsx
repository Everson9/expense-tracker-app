import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { Expense } from '../types/expense';
import { expenseService } from '../services/api';
import ExpenseCard from '../components/ExpenseCard';
import { useAuth } from '../contexts/AuthContext';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={signOut} style={{ marginRight: 4 }}>
          <Text style={{ color: '#00D4A1', fontSize: 15, fontWeight: '600' }}>Sair</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, signOut]);

  const fetchExpenses = async () => {
    try {
      const data = await expenseService.getAll();
      setExpenses(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os gastos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchExpenses();
    }, [])
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      'Excluir gasto',
      'Tem certeza que deseja excluir este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseService.delete(id);
              setExpenses(prev => prev.filter(e => e.id !== id));
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir o gasto.');
            }
          },
        },
      ]
    );
  };

  const now = new Date();
  const totalMonth = expenses
    .filter(e => {
      const d = new Date(e.date + 'T12:00:00');
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const totalGeral = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00D4A1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            onEdit={() => navigation.navigate('Form', { expense: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={
          expenses.length === 0 ? styles.emptyContainer : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchExpenses();
            }}
            tintColor="#00D4A1"
          />
        }
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Este mês</Text>
                <Text style={styles.summaryAmount}>{formatBRL(totalMonth)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRight}>
                <Text style={styles.summaryLabel}>Total geral</Text>
                <Text style={styles.summaryAmountSecondary}>
                  {formatBRL(totalGeral)}
                </Text>
              </View>
            </View>
            <Text style={styles.summaryCount}>
              {expenses.length} registro{expenses.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>Nenhum gasto ainda</Text>
            <Text style={styles.emptySubtitle}>
              Toque no botão + para registrar seu primeiro gasto
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Form', undefined)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Summary card
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#00D4A1',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryAmount: {
    color: '#F5F5F5',
    fontSize: 28,
    fontWeight: '700',
  },
  summaryAmountSecondary: {
    color: '#888',
    fontSize: 20,
    fontWeight: '600',
  },
  summaryRight: {
    marginLeft: 20,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A2A2A',
    marginLeft: 20,
  },
  summaryCount: {
    color: '#555',
    fontSize: 12,
    marginTop: 12,
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#F5F5F5',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00D4A1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D4A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    color: '#0D0D0D',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 34,
  },
});
