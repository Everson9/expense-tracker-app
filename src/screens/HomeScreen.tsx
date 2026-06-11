import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { Expense } from '../types/expense';
import { expenseService, budgetService, Budget } from '../services/api';
import ExpenseCard from '../components/ExpenseCard';
import { useMonth } from '../contexts/MonthContext';
import { useCategories } from '../contexts/CategoryContext';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function HomeScreen({ navigation }: Props) {
  const { selectedMonth, selectedYear, goToPrev, goToNext } = useMonth();
  const { categories } = useCategories();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  // Budget modal
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetCategoryName, setBudgetCategoryName] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetSaving, setBudgetSaving] = useState(false);

  const generateRecurring = async (all: Expense[]) => {
    const cm = now.getMonth();
    const cy = now.getFullYear();
    const templates = all.filter(e => e.recorrente && !e.recorrente_id);
    const copiedIds = new Set(
      all.filter(e => {
        if (!e.recorrente_id) return false;
        const d = new Date(e.date + 'T12:00:00');
        return d.getMonth() === cm && d.getFullYear() === cy;
      }).map(e => e.recorrente_id)
    );
    const toGenerate = templates.filter(t => {
      const td = new Date(t.date + 'T12:00:00');
      if (td.getMonth() === cm && td.getFullYear() === cy) return false;
      return !copiedIds.has(t.id);
    });
    if (toGenerate.length === 0) return;
    const copyDate = `${cy}-${String(cm + 1).padStart(2, '0')}-01`;
    await Promise.all(toGenerate.map(t =>
      expenseService.create({
        title: t.title, amount: t.amount, category: t.category,
        type: t.type, recorrente: false, recorrente_id: t.id,
        date: copyDate, description: t.description,
      })
    ));
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
    } catch { /* silent */ }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchData();
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
    const d = new Date(e.date + 'T12:00:00');
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalDespesas = monthExpenses.filter(e => e.type === 'despesa').reduce((a, e) => a + Number(e.amount), 0);
  const totalReceitas = monthExpenses.filter(e => e.type === 'receita').reduce((a, e) => a + Number(e.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const budgetMap: Record<string, number> = {};
  budgets.forEach(b => { budgetMap[b.category] = b.amount; });

  const spendingByCategory: Record<string, number> = {};
  monthExpenses.filter(e => e.type === 'despesa').forEach(e => {
    spendingByCategory[e.category] = (spendingByCategory[e.category] ?? 0) + Number(e.amount);
  });

  const activeCategories = categories.filter(
    cat => (spendingByCategory[cat.name] ?? 0) > 0 || budgetMap[cat.name] !== undefined
  );

  const openBudgetModal = (catName: string) => {
    setBudgetCategoryName(catName);
    setBudgetInput(budgetMap[catName] ? String(budgetMap[catName]) : '');
    setBudgetModalVisible(true);
  };

  const saveBudget = async () => {
    if (!budgetCategoryName) return;
    const val = parseFloat(budgetInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) { Alert.alert('Valor inválido', 'Digite um valor maior que zero.'); return; }
    setBudgetSaving(true);
    try {
      const updated = await budgetService.upsert(budgetCategoryName as any, val);
      setBudgets(prev => [...prev.filter(b => b.category !== budgetCategoryName), updated]);
      setBudgetModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setBudgetSaving(false);
    }
  };

  const removeBudget = async () => {
    if (!budgetCategoryName) return;
    setBudgetSaving(true);
    try {
      await budgetService.delete(budgetCategoryName as any);
      setBudgets(prev => prev.filter(b => b.category !== budgetCategoryName));
      setBudgetModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível remover.');
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
          const spent = spendingByCategory[cat.name] ?? 0;
          const limit = budgetMap[cat.name];
          const ratio = limit ? Math.min(spent / limit, 1) : 0;
          const pct = limit ? (spent / limit) * 100 : null;
          let barColor = '#00D4A1';
          if (pct !== null && pct >= 100) barColor = '#FF6B6B';
          else if (pct !== null && pct >= 80) barColor = '#FFB347';

          return (
            <TouchableOpacity key={cat.id} style={styles.categoryRow} onPress={() => openBudgetModal(cat.name)} activeOpacity={0.75}>
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryNameRow}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    {pct !== null && pct >= 100 && <View style={styles.alertBadge}><Text style={styles.alertBadgeText}>estourado</Text></View>}
                    {pct !== null && pct >= 80 && pct < 100 && <View style={[styles.alertBadge, styles.alertBadgeWarn]}><Text style={[styles.alertBadgeText, { color: '#FFB347' }]}>atenção</Text></View>}
                  </View>
                  {limit ? (
                    <>
                      <View style={styles.progressTrack}><View style={[styles.progressBar, { width: `${ratio * 100}%`, backgroundColor: barColor }]} /></View>
                      <Text style={styles.categoryAmounts}>{formatBRL(spent)}<Text style={styles.categoryLimit}> / {formatBRL(limit)}</Text></Text>
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
    return <View style={styles.centered}><ActivityIndicator size="large" color="#00D4A1" /></View>;
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
        contentContainerStyle={monthExpenses.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#00D4A1" />
        }
        ListHeaderComponent={
          <>
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={goToPrev} style={styles.monthArrow}>
                <Text style={styles.monthArrowText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTHS_PT[selectedMonth]} {selectedYear}</Text>
              <TouchableOpacity onPress={goToNext} style={[styles.monthArrow, isCurrentMonth && styles.monthArrowDisabled]} disabled={isCurrentMonth}>
                <Text style={[styles.monthArrowText, isCurrentMonth && styles.monthArrowTextDisabled]}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Despesas</Text>
                  <Text style={[styles.summaryAmount, { color: '#FF6B6B' }]}>{formatBRL(totalDespesas)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Receitas</Text>
                  <Text style={[styles.summaryAmount, { color: '#00D4A1' }]}>{formatBRL(totalReceitas)}</Text>
                </View>
              </View>
              <View style={styles.saldoRow}>
                <Text style={styles.summaryLabel}>Saldo</Text>
                <Text style={[styles.saldoAmount, { color: saldo >= 0 ? '#00D4A1' : '#FF6B6B' }]}>
                  {saldo >= 0 ? '+' : ''}{formatBRL(saldo)}
                </Text>
              </View>
              <Text style={styles.summaryCount}>{monthExpenses.length} registro{monthExpenses.length !== 1 ? 's' : ''}</Text>
            </View>

            <BudgetSection />

            {monthExpenses.length > 0 && <Text style={styles.listSectionTitle}>Lançamentos</Text>}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>Nenhum gasto em {MONTHS_PT[selectedMonth]}</Text>
            <Text style={styles.emptySubtitle}>Use as abas Gastos ou Receitas para registrar</Text>
          </View>
        }
      />

      <Modal visible={budgetModalVisible} animationType="slide" transparent onRequestClose={() => setBudgetModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setBudgetModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {categories.find(c => c.name === budgetCategoryName)?.icon ?? '📦'} {budgetCategoryName}
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
            <TouchableOpacity style={[styles.modalBtn, budgetSaving && { opacity: 0.6 }]} onPress={saveBudget} disabled={budgetSaving}>
              {budgetSaving ? <ActivityIndicator color="#0D0D0D" /> : <Text style={styles.modalBtnText}>Salvar limite</Text>}
            </TouchableOpacity>
            {budgetMap[budgetCategoryName!] !== undefined && (
              <TouchableOpacity style={styles.modalBtnRemove} onPress={removeBudget} disabled={budgetSaving}>
                <Text style={styles.modalBtnRemoveText}>Remover limite</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setBudgetModalVisible(false)}>
              <Text style={styles.modalBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  centered: { flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 16, marginBottom: 12 },
  monthArrow: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 10 },
  monthArrowDisabled: { opacity: 0.3 },
  monthArrowText: { color: '#00D4A1', fontSize: 24, lineHeight: 28, fontWeight: '300' },
  monthArrowTextDisabled: { color: '#555' },
  monthLabel: { color: '#F5F5F5', fontSize: 17, fontWeight: '700' },
  summaryCard: { marginHorizontal: 16, marginBottom: 20, padding: 20, backgroundColor: '#1A1A1A', borderRadius: 16, borderLeftWidth: 3, borderLeftColor: '#00D4A1', gap: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryCol: { flex: 1 },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#2A2A2A' },
  summaryLabel: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  summaryAmount: { fontSize: 20, fontWeight: '700' },
  saldoRow: { borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saldoAmount: { fontSize: 22, fontWeight: '700' },
  summaryCount: { color: '#555', fontSize: 12 },
  budgetSection: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#1A1A1A', borderRadius: 16, overflow: 'hidden' },
  sectionTitle: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#222' },
  categoryLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIcon: { fontSize: 22 },
  categoryInfo: { flex: 1 },
  categoryNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  categoryName: { color: '#F5F5F5', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  alertBadge: { backgroundColor: '#FF6B6B33', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  alertBadgeWarn: { backgroundColor: '#FFB34733' },
  alertBadgeText: { color: '#FF6B6B', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  progressTrack: { height: 5, backgroundColor: '#2A2A2A', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressBar: { height: 5, borderRadius: 3 },
  categoryAmounts: { color: '#F5F5F5', fontSize: 13, fontWeight: '600' },
  categoryLimit: { color: '#555', fontWeight: '400' },
  categorySpentOnly: { color: '#888', fontSize: 12 },
  categoryEdit: { fontSize: 14, marginLeft: 8 },
  listSectionTitle: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginHorizontal: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { color: '#F5F5F5', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { color: '#555', fontSize: 14, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { color: '#F5F5F5', fontSize: 20, fontWeight: '700', textTransform: 'capitalize' },
  modalSubtitle: { color: '#666', fontSize: 13, marginBottom: 4 },
  modalInput: { backgroundColor: '#111', borderRadius: 12, padding: 16, color: '#F5F5F5', fontSize: 24, fontWeight: '700', borderWidth: 1, borderColor: '#2A2A2A' },
  modalBtn: { backgroundColor: '#00D4A1', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  modalBtnText: { color: '#0D0D0D', fontSize: 16, fontWeight: '700' },
  modalBtnRemove: { borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B6B44' },
  modalBtnRemoveText: { color: '#FF6B6B', fontSize: 15, fontWeight: '600' },
  modalBtnCancel: { padding: 12, alignItems: 'center' },
  modalBtnCancelText: { color: '#555', fontSize: 14 },
});
