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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { Expense, Category } from '../types/expense';
import { expenseService, budgetService, Budget } from '../services/api';
import ExpenseCard from '../components/ExpenseCard';
import { useAuth } from '../contexts/AuthContext';

const CATEGORY_ICONS: Record<Category, string> = {
  alimentação: '🍔',
  transporte:  '🚗',
  lazer:       '🎮',
  saúde:       '💊',
  moradia:     '🏠',
  outros:      '📦',
};

const CATEGORIES: Category[] = ['alimentação', 'transporte', 'lazer', 'saúde', 'moradia', 'outros'];

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function HomeScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  // Budget modal state
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState<Category | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetSaving, setBudgetSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={signOut} style={{ marginRight: 4 }}>
          <Text style={{ color: '#00D4A1', fontSize: 15, fontWeight: '600' }}>Sair</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, signOut]);

  const generateRecurring = async (all: Expense[]) => {
    const cm = now.getMonth();
    const cy = now.getFullYear();

    const templates = all.filter(e => e.recorrente && !e.recorrente_id);
    const copiedIds = new Set(
      all
        .filter(e => {
          if (!e.recorrente_id) return false;
          const d = new Date(e.date + 'T12:00:00');
          return d.getMonth() === cm && d.getFullYear() === cy;
        })
        .map(e => e.recorrente_id)
    );

    const toGenerate = templates.filter(t => {
      const td = new Date(t.date + 'T12:00:00');
      if (td.getMonth() === cm && td.getFullYear() === cy) return false;
      return !copiedIds.has(t.id);
    });

    if (toGenerate.length === 0) return;

    const copyDate = `${cy}-${String(cm + 1).padStart(2, '0')}-01`;
    await Promise.all(
      toGenerate.map(t =>
        expenseService.create({
          title: t.title,
          amount: t.amount,
          category: t.category,
          type: t.type,
          recorrente: false,
          recorrente_id: t.id,
          date: copyDate,
          description: t.description,
        })
      )
    );
  };

  const fetchData = async () => {
    try {
      const data = await expenseService.getAll();
      await generateRecurring(data);
      const fresh = await expenseService.getAll();
      setExpenses(fresh);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os gastos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    try {
      const budgetData = await budgetService.getAll();
      setBudgets(budgetData);
    } catch {
      // budgets silently fail — don't block expenses
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
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

  // Per-category spending (despesas only)
  const spendingByCategory: Partial<Record<Category, number>> = {};
  monthExpenses
    .filter(e => e.type === 'despesa')
    .forEach(e => {
      spendingByCategory[e.category] = (spendingByCategory[e.category] ?? 0) + Number(e.amount);
    });

  const budgetMap: Partial<Record<Category, number>> = {};
  budgets.forEach(b => { budgetMap[b.category] = b.amount; });

  // Only show categories that have spending OR a budget set
  const activeCategories = CATEGORIES.filter(
    cat => (spendingByCategory[cat] ?? 0) > 0 || budgetMap[cat] !== undefined
  );

  const openBudgetModal = (cat: Category) => {
    setBudgetCategory(cat);
    setBudgetInput(budgetMap[cat] ? String(budgetMap[cat]) : '');
    setBudgetModalVisible(true);
  };

  const saveBudget = async () => {
    if (!budgetCategory) return;
    const val = parseFloat(budgetInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      Alert.alert('Valor inválido', 'Digite um valor maior que zero.');
      return;
    }
    setBudgetSaving(true);
    try {
      const updated = await budgetService.upsert(budgetCategory, val);
      setBudgets(prev => {
        const filtered = prev.filter(b => b.category !== budgetCategory);
        return [...filtered, updated];
      });
      setBudgetModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o orçamento.');
    } finally {
      setBudgetSaving(false);
    }
  };

  const removeBudget = async () => {
    if (!budgetCategory) return;
    setBudgetSaving(true);
    try {
      await budgetService.delete(budgetCategory);
      setBudgets(prev => prev.filter(b => b.category !== budgetCategory));
      setBudgetModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível remover o orçamento.');
    } finally {
      setBudgetSaving(false);
    }
  };

  const BudgetSection = () => {
    if (activeCategories.length === 0) return null;

    return (
      <View style={styles.budgetSection}>
        <Text style={styles.sectionTitle}>Orçamento por categoria</Text>
        {activeCategories.map(cat => {
          const spent = spendingByCategory[cat] ?? 0;
          const limit = budgetMap[cat];
          const ratio = limit ? Math.min(spent / limit, 1) : 0;
          const pct = limit ? (spent / limit) * 100 : null;

          let barColor = '#00D4A1';
          if (pct !== null && pct >= 100) barColor = '#FF6B6B';
          else if (pct !== null && pct >= 80) barColor = '#FFB347';

          return (
            <TouchableOpacity
              key={cat}
              style={styles.categoryRow}
              onPress={() => openBudgetModal(cat)}
              activeOpacity={0.75}
            >
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat]}</Text>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryNameRow}>
                    <Text style={styles.categoryName}>{cat}</Text>
                    {pct !== null && pct >= 100 && (
                      <View style={styles.alertBadge}>
                        <Text style={styles.alertBadgeText}>estourado</Text>
                      </View>
                    )}
                    {pct !== null && pct >= 80 && pct < 100 && (
                      <View style={[styles.alertBadge, styles.alertBadgeWarn]}>
                        <Text style={[styles.alertBadgeText, { color: '#FFB347' }]}>atenção</Text>
                      </View>
                    )}
                  </View>
                  {limit ? (
                    <>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${ratio * 100}%`, backgroundColor: barColor }]} />
                      </View>
                      <Text style={styles.categoryAmounts}>
                        {formatBRL(spent)}
                        <Text style={styles.categoryLimit}> / {formatBRL(limit)}</Text>
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.categorySpentOnly}>{formatBRL(spent)} · toque para definir limite</Text>
                  )}
                </View>
              </View>
              <Text style={styles.categoryEdit}>✏️</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

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
              fetchData();
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

            {/* Budget breakdown */}
            <BudgetSection />

            {monthExpenses.length > 0 && (
              <Text style={styles.listSectionTitle}>Lançamentos</Text>
            )}
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

      {/* Budget modal */}
      <Modal
        visible={budgetModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setBudgetModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {CATEGORY_ICONS[budgetCategory!]} {budgetCategory}
            </Text>
            <Text style={styles.modalSubtitle}>Limite mensal para esta categoria</Text>

            <TextInput
              style={styles.modalInput}
              value={budgetInput}
              onChangeText={setBudgetInput}
              placeholder="Ex: 500,00"
              placeholderTextColor="#555"
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
            />

            <TouchableOpacity
              style={[styles.modalBtn, budgetSaving && { opacity: 0.6 }]}
              onPress={saveBudget}
              disabled={budgetSaving}
            >
              {budgetSaving
                ? <ActivityIndicator color="#0D0D0D" />
                : <Text style={styles.modalBtnText}>Salvar limite</Text>
              }
            </TouchableOpacity>

            {budgetMap[budgetCategory!] !== undefined && (
              <TouchableOpacity
                style={styles.modalBtnRemove}
                onPress={removeBudget}
                disabled={budgetSaving}
              >
                <Text style={styles.modalBtnRemoveText}>Remover limite</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modalBtnCancel}
              onPress={() => setBudgetModalVisible(false)}
            >
              <Text style={styles.modalBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  monthArrowDisabled: { opacity: 0.3 },
  monthArrowText: {
    color: '#00D4A1',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '300',
  },
  monthArrowTextDisabled: { color: '#555' },
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
  summaryCol: { flex: 1 },
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

  // Budget section
  budgetSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  categoryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: { fontSize: 22 },
  categoryInfo: { flex: 1 },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  categoryName: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  alertBadge: {
    backgroundColor: '#FF6B6B33',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  alertBadgeWarn: { backgroundColor: '#FFB34733' },
  alertBadgeText: {
    color: '#FF6B6B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: 5,
    borderRadius: 3,
  },
  categoryAmounts: {
    color: '#F5F5F5',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryLimit: {
    color: '#555',
    fontWeight: '400',
  },
  categorySpentOnly: {
    color: '#888',
    fontSize: 12,
  },
  categoryEdit: { fontSize: 14, marginLeft: 8 },

  // List section label
  listSectionTitle: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginHorizontal: 16,
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

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#F5F5F5',
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  modalSubtitle: {
    color: '#666',
    fontSize: 13,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    color: '#F5F5F5',
    fontSize: 24,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalBtn: {
    backgroundColor: '#00D4A1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  modalBtnText: {
    color: '#0D0D0D',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBtnRemove: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B44',
  },
  modalBtnRemoveText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '600',
  },
  modalBtnCancel: {
    padding: 12,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: '#555',
    fontSize: 14,
  },
});
