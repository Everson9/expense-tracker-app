import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Expense, Category } from '../types/expense';
import { useTheme, AppTheme } from '../contexts/ThemeContext';

const CATEGORY_COLORS: Record<Category, string> = {
  alimentação: '#FF9F43',
  transporte:  '#54A0FF',
  lazer:       '#A29BFE',
  saúde:       '#26DE81',
  moradia:     '#FD9644',
  outros:      '#A4B0BD',
};

const CATEGORY_ICONS: Record<Category, string> = {
  alimentação: '🍔',
  transporte:  '🚗',
  lazer:       '🎮',
  saúde:       '💊',
  moradia:     '🏠',
  outros:      '📦',
};

interface Props {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ExpenseCard({ expense, onEdit, onDelete }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const isReceita = expense.type === 'receita';
  const color = isReceita ? theme.accent : (CATEGORY_COLORS[expense.category] ?? '#A4B0BD');
  const icon  = isReceita ? '💰' : (CATEGORY_ICONS[expense.category] ?? '📦');

  const formattedDate = new Date(expense.date + 'T12:00:00').toLocaleDateString('pt-BR');
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(expense.amount));

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: color }]} />

      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
          {expense.recorrente && <Text style={styles.recorrenteBadge}>🔁</Text>}
          {expense.parcela_atual && expense.parcelas && (
            <View style={styles.parcelaBadge}>
              <Text style={styles.parcelaBadgeText}>{expense.parcela_atual}/{expense.parcelas}</Text>
            </View>
          )}
        </View>
        <View style={styles.metaRow}>
          {isReceita ? (
            <Text style={[styles.category, { color }]}>receita</Text>
          ) : (
            <Text style={[styles.category, { color }]}>{expense.category}</Text>
          )}
          <Text style={styles.dot}>·</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        {expense.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {expense.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: isReceita ? theme.accent : theme.danger }]}>
          {isReceita ? '+' : '-'}{formattedAmount}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function makeStyles(th: AppTheme) {
  return StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: th.card,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: 12,
    paddingRight: 14,
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
    marginRight: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: th.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  recorrenteBadge: {
    fontSize: 12,
  },
  parcelaBadge: {
    backgroundColor: th.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  parcelaBadgeText: {
    color: th.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  dot: {
    color: '#444',
    fontSize: 12,
  },
  date: {
    color: th.textMuted,
    fontSize: 12,
  },
  description: {
    color: th.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
    gap: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionIcon: {
    fontSize: 15,
  },
  });
}
