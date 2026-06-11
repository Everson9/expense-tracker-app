import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Expense } from '../types/expense';
import { useTheme, AppTheme } from '../contexts/ThemeContext';
import { useCategories } from '../contexts/CategoryContext';

const CATEGORY_COLORS: Record<string, string> = {
  alimentação: '#FF9F43',
  transporte:  '#54A0FF',
  lazer:       '#A29BFE',
  saúde:       '#26DE81',
  moradia:     '#FD9644',
  outros:      '#A4B0BD',
};

const COLOR_PALETTE = [
  '#FF9F43','#54A0FF','#A29BFE','#26DE81','#FD9644',
  '#FDA7DF','#12CBC4','#F79F1F','#00D2D3','#C4E538',
];

function categoryColor(name: string): string {
  if (CATEGORY_COLORS[name.toLowerCase()]) return CATEGORY_COLORS[name.toLowerCase()];
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = (hash << 5) - hash + name.charCodeAt(i); hash |= 0; }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

interface Props {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function ExpenseCard({ expense, onEdit, onDelete }: Props) {
  const { theme } = useTheme();
  const { categories } = useCategories();
  const styles = makeStyles(theme);
  const isReceita = expense.type === 'receita';
  const catData = categories.find(c => c.name.toLowerCase() === expense.category?.toLowerCase());
  const color = isReceita ? theme.accent : categoryColor(expense.category ?? 'outros');
  const icon = isReceita ? '💰' : (catData?.icon ?? '📦');
  const amount = formatBRL(Number(expense.amount));

  return (
    <TouchableOpacity style={styles.card} onPress={onEdit} activeOpacity={0.75}>
      {/* Category icon bubble */}
      <View style={[styles.iconBubble, { backgroundColor: color + '1A' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
        <View style={styles.meta}>
          <Text style={[styles.categoryLabel, { color }]}>
            {isReceita ? 'receita' : expense.category}
          </Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.date}>{formatDate(expense.date)}</Text>
          {expense.recorrente && (
            <>
              <Text style={styles.separator}>·</Text>
              <Text style={styles.badge}>🔁</Text>
            </>
          )}
          {expense.parcela_atual != null && expense.parcelas != null && (
            <>
              <Text style={styles.separator}>·</Text>
              <View style={styles.parcelaBadge}>
                <Text style={styles.parcelaBadgeText}>{expense.parcela_atual}/{expense.parcelas}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountCol}>
        <Text style={[
          styles.amount,
          { color: isReceita ? theme.accent : theme.danger },
        ]}>
          {isReceita ? '+' : '-'}{amount}
        </Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(th: AppTheme) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: th.card,
      borderRadius: 16,
      marginBottom: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: th.border,
      gap: 14,
    },
    iconBubble: {
      width: 46,
      height: 46,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    icon: {
      fontSize: 22,
    },
    content: {
      flex: 1,
      gap: 4,
    },
    title: {
      color: th.text,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
    },
    categoryLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    separator: {
      color: th.textMuted,
      fontSize: 12,
    },
    date: {
      color: th.textSub,
      fontSize: 12,
    },
    badge: {
      fontSize: 11,
    },
    parcelaBadge: {
      backgroundColor: th.border,
      borderRadius: 5,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    parcelaBadgeText: {
      color: th.textSub,
      fontSize: 10,
      fontWeight: '700',
    },
    amountCol: {
      alignItems: 'flex-end',
      gap: 6,
      flexShrink: 0,
    },
    amount: {
      fontSize: 16,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
      letterSpacing: -0.3,
    },
    deleteBtn: {
      opacity: 0.4,
    },
    deleteBtnText: {
      color: th.textSub,
      fontSize: 12,
    },
  });
}
