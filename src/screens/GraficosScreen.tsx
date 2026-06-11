import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import { expenseService } from '../services/api';
import { useCategories } from '../contexts/CategoryContext';
import { useMonth } from '../contexts/MonthContext';
import { Expense } from '../types/expense';

const MONTHS_PT = [
  'Jan','Fev','Mar','Abr','Mai','Jun',
  'Jul','Ago','Set','Out','Nov','Dez',
];

const CHART_COLORS = [
  '#00D4A1','#FF6B6B','#FFB347','#54A0FF','#A29BFE',
  '#FFC312','#C4E538','#FDA7DF','#12CBC4','#ED4C67',
];

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function GraficosScreen() {
  const { categories } = useCategories();
  const { selectedMonth, selectedYear, goToPrev, goToNext } = useMonth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  useFocusEffect(useCallback(() => {
    setLoading(true);
    expenseService.getAll()
      .then(setExpenses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []));

  // Month expenses
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date + 'T12:00:00');
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Pie: despesas por categoria
  const spendingByCategory: Record<string, number> = {};
  monthExpenses.filter(e => e.type === 'despesa').forEach(e => {
    spendingByCategory[e.category] = (spendingByCategory[e.category] ?? 0) + Number(e.amount);
  });

  const pieData = Object.entries(spendingByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], idx) => {
      const cat = categories.find(c => c.name === name);
      return {
        value,
        color: CHART_COLORS[idx % CHART_COLORS.length],
        label: name,
        icon: cat?.icon ?? '📦',
      };
    });

  const totalDespesas = pieData.reduce((a, d) => a + d.value, 0);
  const totalReceitas = monthExpenses.filter(e => e.type === 'receita').reduce((a, e) => a + Number(e.amount), 0);

  // Line: saldo últimos 6 meses
  const lineData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(selectedYear, selectedMonth - 5 + i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthExp = expenses.filter(e => {
      const ed = new Date(e.date + 'T12:00:00');
      return ed.getMonth() === m && ed.getFullYear() === y;
    });
    const receitas = monthExp.filter(e => e.type === 'receita').reduce((a, e) => a + Number(e.amount), 0);
    const despesas = monthExp.filter(e => e.type === 'despesa').reduce((a, e) => a + Number(e.amount), 0);
    return {
      value: Math.max(0, receitas - despesas),
      rawSaldo: receitas - despesas,
      label: MONTHS_PT[m],
      dataPointText: '',
    };
  });

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#00D4A1" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Month selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={goToPrev} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS_PT[selectedMonth]} {selectedYear}</Text>
        <TouchableOpacity onPress={goToNext} style={[styles.monthArrow, isCurrentMonth && styles.disabled]} disabled={isCurrentMonth}>
          <Text style={[styles.monthArrowText, isCurrentMonth && styles.disabledText]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Pie chart — despesas por categoria */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Despesas por categoria</Text>
        {pieData.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma despesa em {MONTHS_PT[selectedMonth]}</Text>
        ) : (
          <>
            <View style={styles.pieWrapper}>
              <PieChart
                data={pieData}
                donut
                radius={100}
                innerRadius={60}
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text style={styles.pieCenterLabel}>Total</Text>
                    <Text style={styles.pieCenterAmount}>{formatBRL(totalDespesas)}</Text>
                  </View>
                )}
                showText={false}
              />
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              {pieData.map((item, idx) => (
                <View key={idx} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendIcon}>{item.icon}</Text>
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendValue}>{formatBRL(item.value)}</Text>
                  <Text style={styles.legendPct}>
                    {totalDespesas > 0 ? `${Math.round((item.value / totalDespesas) * 100)}%` : '0%'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Saldo mensal card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo do mês</Text>
        <View style={styles.resumoRow}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Receitas</Text>
            <Text style={[styles.resumoValue, { color: '#00D4A1' }]}>{formatBRL(totalReceitas)}</Text>
          </View>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Despesas</Text>
            <Text style={[styles.resumoValue, { color: '#FF6B6B' }]}>{formatBRL(totalDespesas)}</Text>
          </View>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Saldo</Text>
            <Text style={[styles.resumoValue, { color: (totalReceitas - totalDespesas) >= 0 ? '#00D4A1' : '#FF6B6B' }]}>
              {formatBRL(totalReceitas - totalDespesas)}
            </Text>
          </View>
        </View>
      </View>

      {/* Line chart — saldo 6 meses */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Saldo — últimos 6 meses</Text>
        <LineChart
          data={lineData}
          width={280}
          height={160}
          color="#00D4A1"
          thickness={2}
          dataPointsColor="#00D4A1"
          dataPointsRadius={4}
          startFillColor="#00D4A1"
          startOpacity={0.2}
          endOpacity={0}
          areaChart
          curved
          hideYAxisText
          xAxisColor="#2A2A2A"
          yAxisColor="#2A2A2A"
          rulesColor="#1A1A1A"
          xAxisLabelTextStyle={{ color: '#555', fontSize: 10 }}
          noOfSections={4}
          spacing={46}
          initialSpacing={10}
          backgroundColor="#111"
        />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { padding: 16, paddingBottom: 60 },
  centered: { flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' },

  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthArrow: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 10 },
  disabled: { opacity: 0.3 },
  monthArrowText: { color: '#00D4A1', fontSize: 24, lineHeight: 28, fontWeight: '300' },
  disabledText: { color: '#555' },
  monthLabel: { color: '#F5F5F5', fontSize: 17, fontWeight: '700' },

  card: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },

  pieWrapper: { alignItems: 'center', marginBottom: 20 },
  pieCenter: { alignItems: 'center' },
  pieCenterLabel: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  pieCenterAmount: { color: '#F5F5F5', fontSize: 15, fontWeight: '700' },

  legend: { gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendIcon: { fontSize: 16 },
  legendLabel: { flex: 1, color: '#F5F5F5', fontSize: 14, textTransform: 'capitalize' },
  legendValue: { color: '#F5F5F5', fontSize: 14, fontWeight: '600' },
  legendPct: { color: '#555', fontSize: 12, width: 36, textAlign: 'right' },

  resumoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resumoItem: { alignItems: 'center', flex: 1 },
  resumoLabel: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  resumoValue: { fontSize: 16, fontWeight: '700' },

  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});
