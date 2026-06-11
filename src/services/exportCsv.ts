import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Expense } from '../types/expense';

export async function exportMonthCsv(expenses: Expense[], month: number, year: number): Promise<void> {
  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const header = 'Data,Tipo,Título,Categoria,Valor,Recorrente,Parcela\n';
  const rows = expenses.map(e => {
    const parcela = e.parcelas ? `${e.parcela_atual}/${e.parcelas}` : '';
    return [
      e.date,
      e.type,
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      Number(e.amount).toFixed(2).replace('.', ','),
      e.recorrente ? 'sim' : 'não',
      parcela,
    ].join(',');
  }).join('\n');

  const csv = header + rows;
  const fileName = `gastos_${MONTHS[month]}_${year}.csv`;
  const path = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: `Exportar ${fileName}` });
  }
}
