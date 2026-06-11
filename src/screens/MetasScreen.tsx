import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { goalService, Goal } from '../services/api';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const GOAL_EMOJIS = ['🎯','🏖️','🚗','🏠','📱','✈️','💍','🎓','💪','🐶','🎸','⚽'];

export default function MetasScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [emoji, setEmoji] = useState('🎯');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const fetchGoals = async () => {
    try {
      const data = await goalService.getAll();
      setGoals(data);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchGoals();
  }, []));

  const openCreate = () => {
    setEditingGoal(null);
    setEmoji('🎯'); setTitle(''); setTarget(''); setCurrent(''); setTargetDate('');
    setModalVisible(true);
  };

  const openEdit = (g: Goal) => {
    setEditingGoal(g);
    const parts = g.title.split(' ');
    const firstIsEmoji = GOAL_EMOJIS.includes(parts[0]);
    setEmoji(firstIsEmoji ? parts[0] : '🎯');
    setTitle(firstIsEmoji ? parts.slice(1).join(' ') : g.title);
    setTarget(String(g.target_amount));
    setCurrent(String(g.current_amount));
    setTargetDate(g.target_date ?? '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const tVal = parseFloat(target.replace(',', '.'));
    const cVal = parseFloat(current.replace(',', '.') || '0');
    if (!title.trim()) { Alert.alert('Campo obrigatório', 'Informe um título.'); return; }
    if (isNaN(tVal) || tVal <= 0) { Alert.alert('Valor inválido', 'Meta deve ser maior que zero.'); return; }

    setSaving(true);
    try {
      const fullTitle = `${emoji} ${title.trim()}`;
      if (editingGoal) {
        const updated = await goalService.update(editingGoal.id, {
          title: fullTitle, target_amount: tVal, current_amount: cVal,
          target_date: targetDate || null, completed: cVal >= tVal,
        });
        setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      } else {
        const created = await goalService.create({
          title: fullTitle, target_amount: tVal, current_amount: cVal,
          target_date: targetDate || null,
        });
        setGoals(prev => [created, ...prev]);
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.error ?? 'Não foi possível salvar.');
    } finally { setSaving(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Excluir meta', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try { await goalService.delete(id); setGoals(prev => prev.filter(g => g.id !== id)); }
          catch { Alert.alert('Erro', 'Não foi possível excluir.'); }
        },
      },
    ]);
  };

  const addToGoal = async (goal: Goal, amount: number) => {
    const newCurrent = Math.min(Number(goal.current_amount) + amount, Number(goal.target_amount));
    const completed = newCurrent >= Number(goal.target_amount);
    try {
      const updated = await goalService.update(goal.id, { ...goal, current_amount: newCurrent, completed });
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      if (completed) Alert.alert('🎉 Meta atingida!', `Parabéns! Você alcançou a meta "${goal.title}"!`);
    } catch { Alert.alert('Erro', 'Não foi possível atualizar.'); }
  };

  const active = goals.filter(g => !g.completed);
  const completed = goals.filter(g => g.completed);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#00D4A1" /></View>;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGoals(); }} tintColor="#00D4A1" />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Minhas metas</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addBtnText}>+ Nova</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Nenhuma meta ainda</Text>
            <Text style={styles.emptySubtitle}>Crie uma meta de poupança e acompanhe seu progresso</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
              <Text style={styles.emptyBtnText}>Criar primeira meta</Text>
            </TouchableOpacity>
          </View>
        )}

        {active.map(goal => {
          const pct = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
          const remaining = Number(goal.target_amount) - Number(goal.current_amount);
          let barColor = '#00D4A1';
          if (pct >= 100) barColor = '#00D4A1';
          else if (pct >= 60) barColor = '#FFB347';

          return (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <View style={styles.goalActions}>
                  <TouchableOpacity onPress={() => openEdit(goal)} style={styles.actionBtn}>
                    <Text>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(goal.id)} style={styles.actionBtn}>
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.amountsRow}>
                <Text style={styles.currentAmount}>{formatBRL(Number(goal.current_amount))}</Text>
                <Text style={styles.targetAmount}>de {formatBRL(Number(goal.target_amount))}</Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: barColor }]} />
              </View>

              <View style={styles.goalFooter}>
                <Text style={styles.pctText}>{Math.round(pct)}% concluído</Text>
                {goal.target_date && <Text style={styles.dateText}>📅 {goal.target_date}</Text>}
              </View>

              <Text style={styles.remainingText}>Faltam {formatBRL(remaining)}</Text>

              {/* Quick add buttons */}
              <View style={styles.quickAdd}>
                <Text style={styles.quickAddLabel}>Adicionar:</Text>
                {[50, 100, 200, 500].map(v => (
                  <TouchableOpacity
                    key={v}
                    style={styles.quickAddBtn}
                    onPress={() => addToGoal(goal, v)}
                    disabled={remaining <= 0}
                  >
                    <Text style={styles.quickAddBtnText}>+{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {completed.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Concluídas 🎉</Text>
            {completed.map(goal => (
              <View key={goal.id} style={[styles.goalCard, styles.goalCardDone]}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <TouchableOpacity onPress={() => handleDelete(goal.id)} style={styles.actionBtn}>
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: '100%', backgroundColor: '#00D4A1' }]} />
                </View>
                <Text style={[styles.pctText, { color: '#00D4A1', marginTop: 8 }]}>
                  ✅ {formatBRL(Number(goal.target_amount))} atingido
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingGoal ? 'Editar meta' : 'Nova meta'}</Text>

            {/* Emoji picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
              {GOAL_EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput style={styles.modalInput} value={title} onChangeText={setTitle} placeholder="Nome da meta (ex: Viagem)" placeholderTextColor="#555" autoFocus />
            <TextInput style={styles.modalInput} value={target} onChangeText={setTarget} placeholder="Valor da meta (R$)" placeholderTextColor="#555" keyboardType="decimal-pad" />
            <TextInput style={styles.modalInput} value={current} onChangeText={setCurrent} placeholder="Já guardei (R$) — opcional" placeholderTextColor="#555" keyboardType="decimal-pad" />
            <TextInput style={styles.modalInput} value={targetDate} onChangeText={setTargetDate} placeholder="Data limite (AAAA-MM-DD) — opcional" placeholderTextColor="#555" keyboardType="numbers-and-punctuation" maxLength={10} />

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#0D0D0D" /> : <Text style={styles.saveBtnText}>Salvar</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { padding: 16, paddingBottom: 60 },
  centered: { flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#F5F5F5', fontSize: 22, fontWeight: '800' },
  addBtn: { backgroundColor: '#00D4A120', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#00D4A1', fontSize: 14, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { color: '#F5F5F5', fontSize: 20, fontWeight: '700' },
  emptySubtitle: { color: '#555', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn: { marginTop: 16, backgroundColor: '#00D4A1', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#0D0D0D', fontSize: 15, fontWeight: '700' },

  sectionLabel: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },

  goalCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 18, marginBottom: 14 },
  goalCardDone: { opacity: 0.6 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  goalTitle: { color: '#F5F5F5', fontSize: 17, fontWeight: '700', flex: 1 },
  goalActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 4 },
  amountsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 10 },
  currentAmount: { color: '#00D4A1', fontSize: 24, fontWeight: '800' },
  targetAmount: { color: '#555', fontSize: 14 },
  progressTrack: { height: 8, backgroundColor: '#2A2A2A', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: 8, borderRadius: 4 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  pctText: { color: '#888', fontSize: 12, fontWeight: '600' },
  dateText: { color: '#555', fontSize: 12 },
  remainingText: { color: '#555', fontSize: 13, marginBottom: 14 },
  quickAdd: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  quickAddLabel: { color: '#555', fontSize: 12 },
  quickAddBtn: { backgroundColor: '#2A2A2A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  quickAddBtnText: { color: '#00D4A1', fontSize: 13, fontWeight: '700' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 10 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { color: '#F5F5F5', fontSize: 18, fontWeight: '700' },
  emojiBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#2A2A2A' },
  emojiBtnActive: { backgroundColor: '#00D4A130', borderWidth: 2, borderColor: '#00D4A1' },
  modalInput: { backgroundColor: '#111', borderRadius: 12, padding: 14, color: '#F5F5F5', fontSize: 15, borderWidth: 1, borderColor: '#2A2A2A' },
  saveBtn: { backgroundColor: '#00D4A1', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#0D0D0D', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 12, alignItems: 'center' },
  cancelBtnText: { color: '#555', fontSize: 14 },
});
