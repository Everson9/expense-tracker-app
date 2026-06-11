import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Expense, Category } from '../types/expense';

const CATEGORY_COLORS: Record<Category, string> = {
  alimentação: '#FF9F43',
  transporte: '#54A0FF',
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
  const color = CATEGORY_COLORS[expense.category] ?? '#A4B0BD';
  const icon  = CATEGORY_ICONS[expense.category]  ?? '📦';

  const formattedDate = new Date(expense.date + 'T12:00:00').toLocaleDateString('pt-BR');
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(expense.amount));

  return (
    <View style={styles.card}>
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: color }]} />

      {/* Category icon */}
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {expense.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.category, { color }]}>{expense.category}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        {expense.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {expense.description}
          </Text>
        ) : null}
      </View>

      {/* Amount + actions */}
      <View style={styles.right}>
        <Text style={styles.amount}>{formattedAmount}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
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
  title: {
    color: '#F5F5F5',
    fontSize: 15,
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
    color: '#666',
    fontSize: 12,
  },
  description: {
    color: '#555',
    fontSize: 12,
    marginTop: 3,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
    gap: 8,
  },
  amount: {
    color: '#FF6B6B',
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
