import React from 'react';
import {
  View, TextInput, TouchableOpacity, Text, ScrollView, StyleSheet,
} from 'react-native';
import { useCategories } from '../contexts/CategoryContext';

export type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (v: string | null) => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
}

const SORT_LABELS: Record<SortOption, string> = {
  date_desc:   'Mais recentes',
  date_asc:    'Mais antigas',
  amount_desc: 'Maior valor',
  amount_asc:  'Menor valor',
};

export default function SearchBar({
  query, onQueryChange,
  selectedCategory, onCategoryChange,
  sortBy, onSortChange,
}: Props) {
  const { categories } = useCategories();

  const sorts: SortOption[] = ['date_desc', 'date_asc', 'amount_desc', 'amount_asc'];

  return (
    <View style={styles.wrapper}>
      {/* Search input */}
      <View style={styles.inputRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onQueryChange}
          placeholder="Buscar por descrição..."
          placeholderTextColor="#444"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => onQueryChange('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
        <TouchableOpacity
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
          onPress={() => onCategoryChange(null)}
        >
          <Text style={[styles.chipText, selectedCategory === null && styles.chipTextActive]}>Todas</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, selectedCategory === cat.name && styles.chipActive]}
            onPress={() => onCategoryChange(selectedCategory === cat.name ? null : cat.name)}
          >
            <Text style={styles.chipIcon}>{cat.icon}</Text>
            <Text style={[styles.chipText, selectedCategory === cat.name && styles.chipTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
        {sorts.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
            onPress={() => onSortChange(s)}
          >
            <Text style={[styles.sortChipText, sortBy === s && styles.sortChipTextActive]}>
              {SORT_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: '#0D0D0D', paddingTop: 12 },

  inputRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: '#1A1A1A', borderRadius: 12, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: '#2A2A2A' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, color: '#F5F5F5', fontSize: 15, paddingVertical: 12 },
  clearBtn: { padding: 4 },
  clearText: { color: '#555', fontSize: 14 },

  chipsRow: { marginBottom: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', gap: 4 },
  chipActive: { backgroundColor: '#00D4A120', borderColor: '#00D4A1' },
  chipIcon: { fontSize: 14 },
  chipText: { color: '#666', fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  chipTextActive: { color: '#00D4A1', fontWeight: '700' },

  sortRow: { marginBottom: 8 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
  sortChipActive: { backgroundColor: '#2A2A2A', borderColor: '#555' },
  sortChipText: { color: '#555', fontSize: 12, fontWeight: '500' },
  sortChipTextActive: { color: '#F5F5F5', fontWeight: '600' },
});
