import React, { useState, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { Expense } from '../types/expense';
import { expenseService } from '../services/api';
import ExpenseCard from '../components/ExpenseCard';
import AnimatedListItem from '../components/AnimatedListItem';
import AmountText from '../components/AmountText';
import SearchBar, { SortOption } from '../components/SearchBar';
import { useMonth } from '../contexts/MonthContext';
import { useTheme, AppTheme } from '../contexts/ThemeContext';

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

function formatSectionTitle(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  if (sameDay(d, today)) return 'Hoje';
  if (sameDay(d, yesterday)) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDate(expenses: Expense[]): { title: string; data: Expense[] }[] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const key = e.date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([date, data]) => ({
    title: formatSectionTitle(date),
    data,
  }));
}

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
  const sections = groupByDate(filtered);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index} delay={80}>
            <ExpenseCard
              expense={item}
              onEdit={() => navigation.navigate('Form', { expense: item })}
              onDelete={() => handleDelete(item.id)}
            />
          </AnimatedListItem>
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchExpenses(); }}
            tintColor={theme.accent}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={goToPrev} style={styles.monthArrow}>
                <Text style={styles.monthArrowText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTHS_PT[selectedMonth]} {selectedYear}</Text>
              <TouchableOpacity
                onPress={goToNext}
                style={[styles.monthArrow, isCurrentMonth && styles.disabled]}
                disabled={isCurrentMonth}
              >
                <Text style={[styles.monthArrowText, isCurrentMonth && styles.disabledText]}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total despesas</Text>
              <AmountText
                value={total}
                animate
                color={theme.danger}
                style={styles.totalAmount}
              />
              <Text style={styles.totalCount}>
                {filtered.length}{filtered.length !== monthExpenses.length ? `/${monthExpenses.length}` : ''} registro{monthExpenses.length !== 1 ? 's' : ''}
              </Text>
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
    monthSelector: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginHorizontal: 20, marginTop: 16, marginBottom: 16,
    },
    monthArrow: {
      width: 36, height: 36, justifyContent: 'center', alignItems: 'center',
      backgroundColor: t.surface, borderRadius: 10, borderWidth: 1, borderColor: t.border,
    },
    disabled: { opacity: 0.25 },
    monthArrowText: { color: t.accent, fontSize: 22, lineHeight: 26, fontWeight: '300' },
    disabledText: { color: t.textMuted },
    monthLabel: { color: t.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
    totalCard: {
      marginHorizontal: 16, marginBottom: 16,
      backgroundColor: t.surface, borderRadius: 20,
      borderWidth: 1, borderColor: t.border,
      padding: 20, gap: 4,
      borderLeftWidth: 3, borderLeftColor: t.danger,
    },
    totalLabel: { color: t.textSub, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
    totalAmount: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
    totalCount: { color: t.textSub, fontSize: 12, marginTop: 4 },
    sectionHeader: { paddingHorizontal: 4, paddingVertical: 8, paddingTop: 12 },
    sectionHeaderText: { color: t.textSub, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    list: { paddingHorizontal: 16, paddingBottom: 100 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { color: t.text, fontSize: 18, fontWeight: '600' },
    fab: {
      position: 'absolute', right: 24, bottom: 36,
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: t.accent,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: t.accent, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45, shadowRadius: 12, elevation: 10,
    },
    fabIcon: { color: t.bg, fontSize: 30, fontWeight: '300', lineHeight: 34 },
  });
}
