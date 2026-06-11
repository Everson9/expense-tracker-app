import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { Expense } from '../types/expense';
import { expenseService } from '../services/api';
import ExpenseCard from '../components/ExpenseCard';
import { useMonth } from '../contexts/MonthContext';

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

export default function ReceitasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { selectedMonth, selectedYear, goToPrev, goToNext } = useMonth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const fetchExpenses = async () => {
    try {
      const data = await expenseService.getAll();
      setExpenses(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as receitas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchExpenses();
  }, []));

  const handleDelete = (id: string) => {
    Alert.alert('Excluir receita', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await expenseService.delete(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
          }
        },
      },
    ]);
  };

  const monthReceitas = expenses.filter(e => {
    if (e.type !== 'receita') return false;
    const d = new Date(e.date + 'T12:00:00');
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const total = monthReceitas.reduce((acc, e) => acc + Number(e.amount), 0);
  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

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
        data={monthReceitas}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            onEdit={() => navigation.navigate('Form', { expense: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={monthReceitas.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpenses(); }} tintColor="#00D4A1" />
        }
        ListHeaderComponent={
          <>
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={goToPrev} style={styles.monthArrow}>
                <Text style={styles.monthArrowText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTHS_PT[selectedMonth]} {selectedYear}</Text>
              <TouchableOpacity onPress={goToNext} style={[styles.monthArrow, isCurrentMonth && styles.disabled]} disabled={isCurrentMonth}>
                <Text style={[styles.monthArrowText, isCurrentMonth && styles.disabledText]}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total receitas</Text>
              <Text style={styles.totalAmount}>{formatBRL(total)}</Text>
              <Text style={styles.totalCount}>{monthReceitas.length} registro{monthReceitas.length !== 1 ? 's' : ''}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyTitle}>Nenhuma receita em {MONTHS_PT[selectedMonth]}</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Form', { defaultType: 'receita' })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  centered: { flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 16, marginBottom: 12 },
  monthArrow: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 10 },
  disabled: { opacity: 0.3 },
  monthArrowText: { color: '#00D4A1', fontSize: 24, lineHeight: 28, fontWeight: '300' },
  disabledText: { color: '#555' },
  monthLabel: { color: '#F5F5F5', fontSize: 17, fontWeight: '700' },
  totalCard: { marginHorizontal: 16, marginBottom: 20, padding: 20, backgroundColor: '#1A1A1A', borderRadius: 16, borderLeftWidth: 3, borderLeftColor: '#00D4A1' },
  totalLabel: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  totalAmount: { color: '#00D4A1', fontSize: 28, fontWeight: '700', marginBottom: 4 },
  totalCount: { color: '#555', fontSize: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { color: '#F5F5F5', fontSize: 18, fontWeight: '600' },
  fab: { position: 'absolute', right: 24, bottom: 36, width: 56, height: 56, borderRadius: 28, backgroundColor: '#00D4A1', justifyContent: 'center', alignItems: 'center', shadowColor: '#00D4A1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  fabIcon: { color: '#0D0D0D', fontSize: 30, fontWeight: '300', lineHeight: 34 },
});
