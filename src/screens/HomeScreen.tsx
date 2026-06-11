import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppStackParamList } from '../types/navigation';
import { Expense } from '../types/expense';
import { expenseService, budgetService, Budget } from '../services/api';
import ExpenseCard from '../components/ExpenseCard';
import AmountText from '../components/AmountText';
import AnimatedListItem from '../components/AnimatedListItem';
import { useMonth } from '../contexts/MonthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useTheme, AppTheme } from '../contexts/ThemeContext';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function HomeScreen({ navigation }: Props) {
  const { selectedMonth, selectedYear, goToPrev, goToNext } = useMonth();
  const { categories } = useCategories();
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

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
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
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
    Alert.alert('Excluir', 'Tem certeza?', [
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

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
  }

  const ListHeader = () => (
    <>
      {/* Month selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={goToPrev} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS_PT[selectedMonth]} {selectedYear}</Text>
        <TouchableOpacity
          onPress={goToNext}
          style={[styles.monthArrow, isCurrentMonth && styles.monthArrowDisabled]}
          disabled={isCurrentMonth}
        >
          <Text style={[styles.monthArrowText, isCurrentMonth && styles.monthArrowTextDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Hero balance card */}
      <View style={styles.heroWrapper}>
        <LinearGradient
          colors={[theme.surface, theme.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Accent border top */}
          <View style={[styles.heroAccentBar, { backgroundColor: saldo >= 0 ? theme.accent : theme.danger }]} />

          <Text style={styles.heroLabel}>Saldo do mês</Text>
          <AmountText
            value={saldo}
            showSign
            animate
            color={saldo >= 0 ? theme.accent : theme.danger}
            style={styles.heroAmount}
          />

          <View style={styles.heroRow}>
            <View style={styles.heroCol}>
              <Text style={styles.heroSubLabel}>↑ Receitas</Text>
              <AmountText
                value={totalReceitas}
                animate
                color={theme.accent}
                style={styles.heroSubAmount}
              />
            </View>
            <View style={[styles.heroColDivider, { backgroundColor: theme.border }]} />
            <View style={styles.heroCol}>
              <Text style={styles.heroSubLabel}>↓ Despesas</Text>
              <AmountText
                value={totalDespesas}
                animate
                color={theme.danger}
                style={styles.heroSubAmount}
              />
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Budget section */}
      {activeCategories.length > 0 && (
        <View style={styles.budgetSection}>
          <Text style={styles.sectionLabel}>Orçamento</Text>
          {activeCategories.map(cat => {
            const spent = spendingByCategory[cat.name] ?? 0;
            const limit = budgetMap[cat.name];
            const ratio = limit ? Math.min(spent / limit, 1) : 0;
            const pct = limit ? (spent / limit) * 100 : null;
            let barColor = theme.accent;
            if (pct !== null && pct >= 100) barColor = theme.danger;
            else if (pct !== null && pct >= 80) barColor = '#F59E0B';

            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.catRow}
                onPress={() => openBudgetModal(cat.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <View style={styles.catContent}>
                  <View style={styles.catNameRow}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    {pct !== null && pct >= 100 && (
                      <View style={[styles.pill, { backgroundColor: theme.danger + '22' }]}>
                        <Text style={[styles.pillText, { color: theme.danger }]}>estourado</Text>
                      </View>
                    )}
                    {pct !== null && pct >= 80 && pct < 100 && (
                      <View style={[styles.pill, { backgroundColor: '#F59E0B22' }]}>
                        <Text style={[styles.pillText, { color: '#F59E0B' }]}>atenção</Text>
                      </View>
                    )}
                  </View>
                  {limit ? (
                    <>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${ratio * 100}%` as any, backgroundColor: barColor }]} />
                      </View>
                      <View style={styles.catAmountRow}>
                        <Text style={[styles.catSpent, { color: barColor }]}>{formatBRL(spent)}</Text>
                        <Text style={styles.catLimit}>/ {formatBRL(limit)}</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.catNoLimit}>{formatBRL(spent)} · definir limite</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {monthExpenses.length > 0 && (
        <Text style={styles.sectionLabel}>Lançamentos</Text>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={monthExpenses}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index} delay={100}>
            <ExpenseCard
              expense={item}
              onEdit={() => navigation.navigate('Form', { expense: item })}
              onDelete={() => handleDelete(item.id)}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor={theme.accent}
          />
        }
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>Nenhum registro em {MONTHS_PT[selectedMonth]}</Text>
            <Text style={styles.emptySubtitle}>Use as abas Gastos ou Receitas para registrar</Text>
          </View>
        }
      />

      {/* Budget modal */}
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
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
            />
            <TouchableOpacity style={[styles.modalBtn, budgetSaving && { opacity: 0.6 }]} onPress={saveBudget} disabled={budgetSaving}>
              {budgetSaving
                ? <ActivityIndicator color={theme.bg} />
                : <Text style={styles.modalBtnText}>Salvar limite</Text>
              }
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
    monthArrowDisabled: { opacity: 0.25 },
    monthArrowText: { color: t.accent, fontSize: 22, lineHeight: 26, fontWeight: '300' },
    monthArrowTextDisabled: { color: t.textMuted },
    monthLabel: { color: t.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },

    heroWrapper: {
      marginHorizontal: 16, marginBottom: 20,
      borderRadius: 24, borderWidth: 1, borderColor: t.border,
      overflow: 'hidden',
    },
    heroGradient: { padding: 24, gap: 20 },
    heroAccentBar: { height: 3, width: 40, borderRadius: 2, marginBottom: 4 },
    heroLabel: { color: t.textSub, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    heroAmount: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5 },
    heroRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
    heroCol: { flex: 1, gap: 4 },
    heroColDivider: { width: 1, height: 36, marginHorizontal: 16 },
    heroSubLabel: { color: t.textSub, fontSize: 11, fontWeight: '500' },
    heroSubAmount: { fontSize: 17, fontWeight: '700', letterSpacing: -0.5 },

    budgetSection: {
      marginHorizontal: 16, marginBottom: 20,
      backgroundColor: t.surface, borderRadius: 20, borderWidth: 1, borderColor: t.border,
      overflow: 'hidden', paddingTop: 16,
    },
    sectionLabel: {
      color: t.textSub, fontSize: 11, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 1,
      marginHorizontal: 20, marginBottom: 12,
    },
    catRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 12,
      borderTopWidth: 1, borderTopColor: t.border,
    },
    catIcon: { fontSize: 24 },
    catContent: { flex: 1, gap: 6 },
    catNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    catName: { color: t.text, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
    pill: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
    pillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    progressTrack: { height: 4, backgroundColor: t.border, borderRadius: 2, overflow: 'hidden' },
    progressBar: { height: 4, borderRadius: 2 },
    catAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    catSpent: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
    catLimit: { color: t.textSub, fontSize: 12 },
    catNoLimit: { color: t.textSub, fontSize: 12 },

    list: { paddingHorizontal: 16, paddingBottom: 100 },
    empty: { alignItems: 'center', paddingTop: 40 },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { color: t.text, fontSize: 18, fontWeight: '600', marginBottom: 8 },
    emptySubtitle: { color: t.textSub, fontSize: 14, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },

    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
    modalSheet: {
      backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 40, gap: 12,
      borderWidth: 1, borderColor: t.border,
    },
    modalHandle: { width: 36, height: 4, backgroundColor: t.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
    modalTitle: { color: t.text, fontSize: 20, fontWeight: '700', textTransform: 'capitalize' },
    modalSubtitle: { color: t.textSub, fontSize: 13 },
    modalInput: {
      backgroundColor: t.card, borderRadius: 14, padding: 18,
      color: t.text, fontSize: 26, fontWeight: '700',
      borderWidth: 1, borderColor: t.border,
      fontVariant: ['tabular-nums'],
    },
    modalBtn: { backgroundColor: t.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
    modalBtnText: { color: t.bg, fontSize: 16, fontWeight: '700' },
    modalBtnRemove: { borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: t.danger + '44' },
    modalBtnRemoveText: { color: t.danger, fontSize: 15, fontWeight: '600' },
    modalBtnCancel: { padding: 12, alignItems: 'center' },
    modalBtnCancelText: { color: t.textSub, fontSize: 14 },
  });
}
