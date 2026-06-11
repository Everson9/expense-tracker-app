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

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function HomeScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

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

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    const isCurrentMonth =
      selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    if (isCurrentMonth) return;

    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const isCurrentMonth =
    selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalDespesas = monthExpenses
    .filter(e => e.type === 'despesa')
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const totalReceitas = monthExpenses
    .filter(e => e.type === 'receita')
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const saldo = totalReceitas - totalDespesas;

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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
        data={monthExpenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            onEdit={() => navigation.navigate('Form', { expense: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={
          monthExpenses.length === 0 ? styles.emptyContainer : styles.list
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
          <>
            {/* Month selector */}
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.monthArrow}>
                <Text style={styles.monthArrowText}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.monthLabel}>
                {MONTHS_PT[selectedMonth]} {selectedYear}
              </Text>

              <TouchableOpacity
                onPress={goToNextMonth}
                style={[styles.monthArrow, isCurrentMonth && styles.monthArrowDisabled]}
                disabled={isCurrentMonth}
              >
                <Text style={[styles.monthArrowText, isCurrentMonth && styles.monthArrowTextDisabled]}>
                  ›
                </Text>
              </TouchableOpacity>
            </View>

            {/* Summary card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Despesas</Text>
                  <Text style={[styles.summaryAmount, { color: '#FF6B6B' }]}>
                    {formatBRL(totalDespesas)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Receitas</Text>
                  <Text style={[styles.summaryAmount, { color: '#00D4A1' }]}>
                    {formatBRL(totalReceitas)}
                  </Text>
                </View>
              </View>
              <View style={styles.saldoRow}>
                <Text style={styles.summaryLabel}>Saldo</Text>
                <Text style={[styles.saldoAmount, { color: saldo >= 0 ? '#00D4A1' : '#FF6B6B' }]}>
                  {saldo >= 0 ? '+' : ''}{formatBRL(saldo)}
                </Text>
              </View>
              <Text style={styles.summaryCount}>
                {monthExpenses.length} registro{monthExpenses.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>Nenhum gasto em {MONTHS_PT[selectedMonth]}</Text>
            <Text style={styles.emptySubtitle}>
              Toque no botão + para registrar seu primeiro gasto
            </Text>
          </View>
        }
      />

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

  // Month selector
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  monthArrow: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  monthArrowDisabled: {
    opacity: 0.3,
  },
  monthArrowText: {
    color: '#00D4A1',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '300',
  },
  monthArrowTextDisabled: {
    color: '#555',
  },
  monthLabel: {
    color: '#F5F5F5',
    fontSize: 17,
    fontWeight: '700',
  },

  // Summary card
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#00D4A1',
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryCol: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A2A2A',
  },
  summaryLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  saldoRow: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saldoAmount: {
    fontSize: 22,
    fontWeight: '700',
  },
  summaryCount: {
    color: '#555',
    fontSize: 12,
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
