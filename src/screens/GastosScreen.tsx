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
import SearchBar, { SortOption } from '../components/SearchBar';
import { useMonth } from '../contexts/MonthContext';
import { useTheme, AppTheme } from '../contexts/ThemeContext';

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

function applyFilters(
  expenses: Expense[],
  query: string,
  category: string | null,
  sort: SortOption
): Expense[] {
  let result = expenses;

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(e => e.title.toLowerCase().includes(q));
  }

  if (category) {
    result = result.filter(e => e.category === category);
  }

  return [...result].sort((a, b) => {
    if (sort === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sort === 'date_asc')  return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sort === 'amount_desc') return Number(b.amount) - Number(a.amount);
    return Number(a.amount) - Number(b.amount);
  });
}

export default function GastosScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { theme } = useTheme();
  const { selectedMonth, selectedYear, goToPrev, goToNext } = useMonth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const styles = makeStyles(theme);

  const now = new Date();
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

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

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchExpenses();
  }, []));

  const handleDelete = (id: string) => {
    Alert.alert('Excluir gasto', 'Tem certeza?', [
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

  const monthExpenses = expenses.filter(e => {
    if (e.type !== 'despesa') return false;
    const d = new Date(e.date + 'T12:00:00');
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const filtered = applyFilters(monthExpenses, query, selectedCategory, sortBy);
  const total = monthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            onEdit={() => navigation.navigate('Form', { expense: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpenses(); }} tintColor={theme.accent} />
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
              <Text style={styles.totalLabel}>Total despesas</Text>
              <Text style={styles.totalAmount}>{formatBRL(total)}</Text>
              <Text style={styles.totalCount}>{filtered.length}{filtered.length !== monthExpenses.length ? `/${monthExpenses.length}` : ''} registro{monthExpenses.length !== 1 ? 's' : ''}</Text>
            </View>
            <SearchBar
              query={query} onQueryChange={setQuery}
              selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory}
              sortBy={sortBy} onSortChange={setSortBy}
            />
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{query || selectedCategory ? '🔍' : '💸'}</Text>
            <Text style={styles.emptyTitle}>
              {query || selectedCategory ? 'Nenhum resultado' : `Nenhuma despesa em ${MONTHS_PT[selectedMonth]}`}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Form', { defaultType: 'despesa' })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(t: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    centered: { flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' },
    monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 16, marginBottom: 12 },
    monthArrow: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: t.card, borderRadius: 10 },
    disabled: { opacity: 0.3 },
    monthArrowText: { color: t.accent, fontSize: 24, lineHeight: 28, fontWeight: '300' },
    disabledText: { color: t.textMuted },
    monthLabel: { color: t.text, fontSize: 17, fontWeight: '700' },
    totalCard: { marginHorizontal: 16, marginBottom: 12, padding: 20, backgroundColor: t.card, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: t.danger },
    totalLabel: { color: t.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    totalAmount: { color: t.danger, fontSize: 28, fontWeight: '700', marginBottom: 4 },
    totalCount: { color: t.textMuted, fontSize: 12 },
    list: { paddingHorizontal: 16, paddingBottom: 100 },
    emptyContainer: { flexGrow: 1, paddingHorizontal: 16 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { color: t.text, fontSize: 18, fontWeight: '600' },
    fab: { position: 'absolute', right: 24, bottom: 36, width: 56, height: 56, borderRadius: 28, backgroundColor: t.accent, justifyContent: 'center', alignItems: 'center', shadowColor: t.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
    fabIcon: { color: t.bg, fontSize: 30, fontWeight: '300', lineHeight: 34 },
  });
}
