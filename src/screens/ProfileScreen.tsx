import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput, FlatList, Switch,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import { categoryService } from '../services/api';
import { scheduleDailyReminder, cancelDailyReminder, getScheduledReminder } from '../services/notifications';
import { exportMonthCsv } from '../services/exportCsv';
import { expenseService } from '../services/api';
import { useMonth } from '../contexts/MonthContext';

const EMOJI_OPTIONS = [
  '🍔','🍕','🍣','🥗','☕','🍺','🛒',
  '🚗','🚌','✈️','🚇','⛽','🛵',
  '🎮','🎬','🎵','📚','⚽','🏋️','🎭',
  '💊','🏥','🧘','💆',
  '🏠','💡','🔧','📦',
  '💰','💳','📈','🏦','🎁','👔','✂️',
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { categories, reload } = useCategories();
  const { theme, setThemeById } = useTheme();
  const { selectedMonth, selectedYear } = useMonth();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);

  const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const handleExport = async () => {
    setExporting(true);
    try {
      const all = await expenseService.getAll();
      const monthExpenses = all.filter(e => {
        const d = new Date(e.date + 'T12:00:00');
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });
      if (monthExpenses.length === 0) {
        Alert.alert('Sem dados', `Nenhum registro em ${MONTHS_PT[selectedMonth]} ${selectedYear}.`);
        return;
      }
      await exportMonthCsv(monthExpenses, selectedMonth, selectedYear);
    } catch {
      Alert.alert('Erro', 'Não foi possível exportar.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    getScheduledReminder().then(r => setNotifEnabled(!!r));
  }, []);

  const toggleNotification = async () => {
    if (notifEnabled) {
      await cancelDailyReminder();
      setNotifEnabled(false);
    } else {
      const id = await scheduleDailyReminder(20, 0);
      if (id) {
        setNotifEnabled(true);
        Alert.alert('✅ Lembrete ativado', 'Você receberá um lembrete todos os dias às 20h.');
      } else {
        Alert.alert('Permissão negada', 'Permita notificações nas configurações do celular.');
      }
    }
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📦');
  const [saving, setSaving] = useState(false);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??';

  const openCreate = () => {
    setEditingId(null);
    setNameInput('');
    setSelectedIcon('📦');
    setModalVisible(true);
  };

  const openEdit = (id: string, name: string, icon: string) => {
    setEditingId(id);
    setNameInput(name);
    setSelectedIcon(icon);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (nameInput.trim().length < 2) {
      Alert.alert('Nome inválido', 'Nome deve ter pelo menos 2 caracteres.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await categoryService.update(editingId, nameInput.trim(), selectedIcon);
      } else {
        await categoryService.create(nameInput.trim(), selectedIcon);
      }
      await reload();
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.error ?? 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      `Excluir "${name}"`,
      'Gastos existentes mantêm o nome da categoria. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              await categoryService.delete(id);
              await reload();
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Avatar + email */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorias</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addBtnText}>+ Nova</Text>
          </TouchableOpacity>
        </View>

        {categories.map(cat => (
          <View key={cat.id} style={styles.categoryRow}>
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={styles.catName}>{cat.name}</Text>
            <View style={styles.catActions}>
              <TouchableOpacity onPress={() => openEdit(cat.id, cat.name, cat.icon)} style={styles.actionBtn}>
                <Text style={styles.actionEdit}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(cat.id, cat.name)} style={styles.actionBtn}>
                <Text style={styles.actionDelete}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Export */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exportar</Text>
        <TouchableOpacity
          style={[styles.exportBtn, exporting && { opacity: 0.6 }]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting
            ? <ActivityIndicator color="#0D0D0D" size="small" />
            : <Text style={styles.exportBtnText}>📥 Exportar {MONTHS_PT[selectedMonth]} como CSV</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>
        <TouchableOpacity style={styles.notifRow} onPress={toggleNotification} activeOpacity={0.75}>
          <View>
            <Text style={styles.notifLabel}>🔔 Lembrete diário</Text>
            <Text style={styles.notifHint}>Todos os dias às 20h</Text>
          </View>
          <View style={[styles.toggle, notifEnabled && styles.toggleActive]}>
            <View style={[styles.toggleThumb, notifEnabled && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Theme picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tema</Text>
        <View style={styles.themeGrid}>
          {THEMES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.themeBtn, theme.id === t.id && { borderColor: t.accent, borderWidth: 2 }]}
              onPress={() => setThemeById(t.id)}
              activeOpacity={0.75}
            >
              <View style={[styles.themeSwatch, { backgroundColor: t.bg, borderColor: t.accent }]}>
                <Text style={styles.themeEmoji}>{t.emoji}</Text>
              </View>
              <Text style={[styles.themeName, theme.id === t.id && { color: '#F5F5F5' }]}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>

      {/* Category modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingId ? 'Editar categoria' : 'Nova categoria'}</Text>

            <Text style={styles.fieldLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Ex: Academia"
              placeholderTextColor="#555"
              autoFocus
              maxLength={30}
            />

            <Text style={styles.fieldLabel}>Ícone</Text>
            <FlatList
              data={EMOJI_OPTIONS}
              numColumns={7}
              keyExtractor={item => item}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.emojiBtn, selectedIcon === item && styles.emojiBtnSelected]}
                  onPress={() => setSelectedIcon(item)}
                >
                  <Text style={styles.emoji}>{item}</Text>
                </TouchableOpacity>
              )}
              style={styles.emojiGrid}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#0D0D0D" />
                : <Text style={styles.saveBtnText}>Salvar</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { padding: 16, paddingBottom: 60 },

  avatarSection: { alignItems: 'center', paddingVertical: 32 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#00D4A1', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#0D0D0D', fontSize: 24, fontWeight: '800' },
  email: { color: '#888', fontSize: 14 },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  addBtn: { backgroundColor: '#00D4A120', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#00D4A1', fontSize: 13, fontWeight: '700' },

  categoryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, marginBottom: 8 },
  catIcon: { fontSize: 22, marginRight: 12 },
  catName: { flex: 1, color: '#F5F5F5', fontSize: 15, textTransform: 'capitalize' },
  catActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  actionEdit: { fontSize: 16 },
  actionDelete: { fontSize: 16 },

  exportBtn: { backgroundColor: '#00D4A1', borderRadius: 12, padding: 16, alignItems: 'center' },
  exportBtnText: { color: '#0D0D0D', fontSize: 15, fontWeight: '700' },

  notifRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  notifLabel: { color: '#F5F5F5', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  notifHint: { color: '#555', fontSize: 12 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#2A2A2A', justifyContent: 'center', paddingHorizontal: 2 },
  toggleActive: { backgroundColor: '#00D4A1' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#555' },
  toggleThumbActive: { backgroundColor: '#0D0D0D', alignSelf: 'flex-end' },

  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeBtn: { alignItems: 'center', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#2A2A2A', backgroundColor: '#1A1A1A', width: '30%' },
  themeSwatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  themeEmoji: { fontSize: 22 },
  themeName: { color: '#666', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  logoutBtn: { backgroundColor: '#FF6B6B15', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B6B30' },
  logoutText: { color: '#FF6B6B', fontSize: 16, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { color: '#F5F5F5', fontSize: 18, fontWeight: '700' },
  fieldLabel: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: '#111', borderRadius: 12, padding: 14, color: '#F5F5F5', fontSize: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  emojiGrid: { marginVertical: 4 },
  emojiBtn: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8, margin: 2 },
  emojiBtnSelected: { backgroundColor: '#00D4A130', borderWidth: 2, borderColor: '#00D4A1' },
  emoji: { fontSize: 24 },
  saveBtn: { backgroundColor: '#00D4A1', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#0D0D0D', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 12, alignItems: 'center' },
  cancelBtnText: { color: '#555', fontSize: 14 },
});
