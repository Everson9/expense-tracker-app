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
import { AppStackParamList } from '../types/navigation';
import { Category, TransactionType } from '../types/expense';
import { expenseService } from '../services/api';

type Props = NativeStackScreenProps<AppStackParamList, 'Form'>;

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

  const [type,        setType]        = useState<TransactionType>(editing?.type ?? 'despesa');
  const [title,       setTitle]       = useState(editing?.title       ?? '');
  const [amount,      setAmount]      = useState(editing ? String(editing.amount) : '');
  const [category,    setCategory]    = useState<Category>(editing?.category ?? 'outros');
  const [date,        setDate]        = useState(editing?.date ?? todayISO);
  const [description, setDescription] = useState(editing?.description ?? '');
  const [recorrente,  setRecorrente]  = useState(editing?.recorrente ?? false);
  const [parcelas,    setParcelas]    = useState(editing?.parcelas ? String(editing.parcelas) : '1');
  const [loading,     setLoading]     = useState(false);

  const isTemplate = !!editing?.recorrente && !editing?.recorrente_id;
  const isParcela  = !!editing?.parcela_grupo_id;
  const numParcelas = parseInt(parcelas, 10) || 1;

  const handleSave = async () => {
    if (!title.trim()) {
      return Alert.alert('Campo obrigatório', `Informe a descrição ${type === 'receita' ? 'da receita' : 'do gasto'}.`);
    }
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return Alert.alert('Valor inválido', 'Informe um valor numérico maior que zero.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Alert.alert('Data inválida', 'Use o formato AAAA-MM-DD (ex: 2024-11-15).');
    }

    setLoading(true);

    try {
      if (editing) {
        await expenseService.update(editing.id, {
          title: title.trim(),
          amount: parsedAmount,
          category,
          type,
          recorrente,
          date,
          description: description.trim() || undefined,
        });
      } else if (numParcelas > 1) {
        const grupoId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const valorParcela = Math.round((parsedAmount / numParcelas) * 100) / 100;
        const [y, m, d] = date.split('-').map(Number);

        await Promise.all(
          Array.from({ length: numParcelas }, (_, i) => {
            const parcelaDate = new Date(y, m - 1 + i, d);
            const parcelaDateStr = `${parcelaDate.getFullYear()}-${String(parcelaDate.getMonth() + 1).padStart(2, '0')}-${String(parcelaDate.getDate()).padStart(2, '0')}`;
            return expenseService.create({
              title: `${title.trim()} (${i + 1}/${numParcelas})`,
              amount: valorParcela,
              category,
              type,
              recorrente: false,
              parcelas: numParcelas,
              parcela_atual: i + 1,
              parcela_grupo_id: grupoId,
              date: parcelaDateStr,
              description: description.trim() || undefined,
            });
          })
        );
      } else {
        await expenseService.create({
          title: title.trim(),
          amount: parsedAmount,
          category,
          type,
          recorrente,
          date,
          description: description.trim() || undefined,
        });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const isReceita = type === 'receita';

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
        {/* Tipo: Despesa / Receita */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, !isReceita && styles.typeBtnActiveDespesa]}
            onPress={() => setType('despesa')}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeBtnText, !isReceita && styles.typeBtnTextActive]}>
              💸 Despesa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, isReceita && styles.typeBtnActiveReceita]}
            onPress={() => setType('receita')}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeBtnText, isReceita && styles.typeBtnTextActive]}>
              💰 Receita
            </Text>
          </TouchableOpacity>
        </View>

        {/* Descrição */}
        <View style={styles.field}>
          <Text style={styles.label}>Descrição *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={isReceita ? 'Ex: Salário, Freela...' : 'Ex: Almoço no restaurante'}
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

        {/* Parcelas — só para despesas novas ou sem grupo */}
        {!isReceita && !isParcela && (
          <View style={styles.field}>
            <Text style={styles.label}>Parcelas</Text>
            <View style={styles.parcelasRow}>
              <TouchableOpacity
                style={styles.parcelasBtn}
                onPress={() => setParcelas(v => String(Math.max(1, (parseInt(v, 10) || 1) - 1)))}
              >
                <Text style={styles.parcelasBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.parcelasValue}>
                {numParcelas === 1 ? 'À vista' : `${numParcelas}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(amount.replace(',', '.')) / numParcelas || 0)}`}
              </Text>
              <TouchableOpacity
                style={styles.parcelasBtn}
                onPress={() => setParcelas(v => String(Math.min(48, (parseInt(v, 10) || 1) + 1)))}
              >
                <Text style={styles.parcelasBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

        {/* Categoria — só para despesas */}
        {!isReceita && (
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
                      selected && { borderColor: color, backgroundColor: color + '20' },
                    ]}
                    onPress={() => setCategory(cat.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryBtnIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryBtnLabel, selected && { color }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Recorrente — só para novos ou templates */}
        {(!editing || isTemplate) && (
          <TouchableOpacity
            style={[styles.recorrenteRow, recorrente && styles.recorrenteRowActive]}
            onPress={() => setRecorrente(v => !v)}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.recorrenteLabel}>🔁 Repetir todo mês</Text>
              <Text style={styles.recorrenteHint}>Gera automaticamente nos próximos meses</Text>
            </View>
            <View style={[styles.toggle, recorrente && styles.toggleActive]}>
              <View style={[styles.toggleThumb, recorrente && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        )}

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
          style={[
            styles.saveBtn,
            isReceita && styles.saveBtnReceita,
            loading && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#0D0D0D" />
          ) : (
            <Text style={styles.saveBtnText}>
              {editing
                ? 'Salvar alterações'
                : isReceita ? 'Registrar receita' : 'Registrar despesa'}
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

  // Type toggle
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
  },
  typeBtnActiveDespesa: {
    backgroundColor: '#FF6B6B22',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  typeBtnActiveReceita: {
    backgroundColor: '#00D4A122',
    borderWidth: 1,
    borderColor: '#00D4A1',
  },
  typeBtnText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#F5F5F5',
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

  saveBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnReceita: {
    backgroundColor: '#00D4A1',
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

  // Parcelas
  parcelasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#252525',
    overflow: 'hidden',
  },
  parcelasBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#252525',
  },
  parcelasBtnText: {
    color: '#F5F5F5',
    fontSize: 20,
    fontWeight: '300',
  },
  parcelasValue: {
    flex: 1,
    color: '#F5F5F5',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Recorrente toggle
  recorrenteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#252525',
  },
  recorrenteRowActive: {
    borderColor: '#00D4A1',
    backgroundColor: '#00D4A108',
  },
  recorrenteLabel: {
    color: '#F5F5F5',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  recorrenteHint: {
    color: '#555',
    fontSize: 12,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#00D4A1',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#555',
  },
  toggleThumbActive: {
    backgroundColor: '#0D0D0D',
    alignSelf: 'flex-end',
  },
});
