import { StyleSheet } from 'react-native';
import { AppTheme } from '../contexts/ThemeContext';

// Shared dynamic styles used across multiple screens
export function makeSharedStyles(t: AppTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    card: { backgroundColor: t.card, borderRadius: 16, padding: 20, marginBottom: 16 },
    centered: { flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' },
    sectionLabel: { color: t.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 16, marginBottom: 12 },
    monthArrow: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: t.card, borderRadius: 10 },
    monthArrowDisabled: { opacity: 0.3 },
    monthArrowText: { color: t.accent, fontSize: 24, lineHeight: 28, fontWeight: '300' },
    monthArrowTextDisabled: { color: t.textMuted },
    monthLabel: { color: t.text, fontSize: 17, fontWeight: '700' },
    fab: { position: 'absolute', right: 24, bottom: 36, width: 56, height: 56, borderRadius: 28, backgroundColor: t.accent, justifyContent: 'center', alignItems: 'center', shadowColor: t.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
    fabIcon: { color: t.bg, fontSize: 30, fontWeight: '300', lineHeight: 34 },
    list: { paddingHorizontal: 16, paddingBottom: 100 },
    emptyContainer: { flexGrow: 1, paddingHorizontal: 16 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { color: t.text, fontSize: 18, fontWeight: '600', marginBottom: 8 },
    emptySubtitle: { color: t.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  });
}
