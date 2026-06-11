import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Category } from '../types/expense';
import { expenseService } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: 'alimentação', label: 'Alimentação', icon: '🍔' },
  { value: 'transporte',  label: 'Transporte',  icon: '🚗' },
  { value: 'lazer',       label: 'Lazer',       icon: '🎮' },
  { value: 'saúde',       label: 'Saúde',       icon: '💊' },
  { value: 'moradia',     label: 'Moradia',     icon: '🏠' },
  { value: 'outros',      label: 'Outros',      icon: '📦' },
];

const CATEGORY_COLORS: Record<Category, string> = {
  alimentação: '#FF9F43',
  transporte:  '#54A0FF',
  lazer:       '#A29BFE',
  saúde:       '#26DE81',
  moradia:     '#FD9644',
  outros:      '#A4B0BD',
};

export default function FormScreen({ navigation, route }: Props) {
  const editing = route.params?.expense;

  const todayISO = new Date().toISOString().split('T')[0];

  const [title,       setTitle]       = useState(editing?.title       ?? '');
  const [amount,      setAmount]      = useState(editing ? String(editing.amount) : '');
  const [category,    setCategory]    = useState<Category>(editing?.category ?? 'outros');
  const [date,        setDate]        = useState(editing?.date ?? todayISO);
  const [description, setDescription] = useState(editing?.description ?? '');
  const [loading,     setLoading]     = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      return Alert.alert('Campo obrigatório', 'Informe a descrição do gasto.');
    }
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return Alert.alert('Valor inválido', 'Informe um valor numérico maior que zero.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Alert.alert('Data inválida', 'Use o formato AAAA-MM-DD (ex: 2024-11-15).');
    }

    setLoading(true);

    const payload = {
      title:       title.trim(),
      amount:      parsedAmount,
      category,
      date,
      description: description.trim() || undefined,
    };

    try {
      if (editing) {
        await expenseService.update(editing.id, payload);
      } else {
        await expenseService.create(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o gasto. Verifique a conexão com a API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Descrição */}
        <View style={styles.field}>
          <Text style={styles.label}>Descrição *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Almoço no restaurante"
            placeholderTextColor="#444"
            maxLength={100}
          />
        </View>

        {/* Valor */}
        <View style={styles.field}>
          <Text style={styles.label}>Valor (R$) *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0,00"
            placeholderTextColor="#444"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Data */}
        <View style={styles.field}>
          <Text style={styles.label}>Data * (AAAA-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2024-11-15"
            placeholderTextColor="#444"
            maxLength={10}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Categoria */}
        <View style={styles.field}>
          <Text style={styles.label}>Categoria *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => {
              const selected = category === cat.value;
              const color    = CATEGORY_COLORS[cat.value];
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryBtn,
                    selected && {
                      borderColor:     color,
                      backgroundColor: color + '20',
                    },
                  ]}
                  onPress={() => setCategory(cat.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryBtnIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryBtnLabel,
                      selected && { color },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Observação */}
        <View style={styles.field}>
          <Text style={styles.label}>Observação</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Opcional..."
            placeholderTextColor="#444"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#0D0D0D" />
          ) : (
            <Text style={styles.saveBtnText}>
              {editing ? 'Salvar alterações' : 'Registrar gasto'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },

  field: {
    marginBottom: 22,
  },
  label: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F5F5F5',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#252525',
  },
  textarea: {
    height: 88,
    paddingTop: 14,
  },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#252525',
    backgroundColor: '#1A1A1A',
    gap: 6,
  },
  categoryBtnIcon: {
    fontSize: 15,
  },
  categoryBtnLabel: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },

  // Save
  saveBtn: {
    backgroundColor: '#00D4A1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.55,
  },
  saveBtnText: {
    color: '#0D0D0D',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
