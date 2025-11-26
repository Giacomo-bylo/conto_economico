import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Property } from '../types';

export function exportPropertyToPDF(property: Property) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(67, 97, 238); // Primary color
  doc.text('Bylo - Valutazione Immobiliare', 14, 20);
  
  // Dati Lead
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Dati Lead', 14, 35);
  doc.setFontSize(10);
  doc.text(`Nome: ${property.lead_nome} ${property.lead_cognome}`, 14, 42);
  doc.text(`Email: ${property.lead_email}`, 14, 48);
  if (property.lead_telefono) doc.text(`Tel: ${property.lead_telefono}`, 14, 54);
  
  // Dati Immobile
  doc.setFontSize(14);
  doc.text('Dati Immobile', 14, 68);
  doc.setFontSize(10);
  doc.text(`Indirizzo: ${property.indirizzo_completo}`, 14, 75);
  doc.text(`Superficie: ${property.superficie_mq} mq`, 14, 81);
  doc.text(`Tipo: ${property.tipo_immobile || 'N/D'}`, 14, 87);
  
  // Conto Economico
  const tableData = [
    ['Ristrutturazione', `€${property.costo_ristrutturazione?.toLocaleString('it-IT') || 0}`],
    ['Studio Tecnico', `€${property.costo_studio_tecnico?.toLocaleString('it-IT') || 0}`],
    ['Architetto', `€${property.costo_architetto?.toLocaleString('it-IT') || 0}`],
    ['Imposte', `€${property.costo_imposte?.toLocaleString('it-IT') || 0}`],
    ['Notaio', `€${property.costo_notaio?.toLocaleString('it-IT') || 0}`],
    ['Avvocato', `€${property.costo_avvocato?.toLocaleString('it-IT') || 0}`],
    ['Agenzia In', `€${property.costo_agenzia_in?.toLocaleString('it-IT') || 0}`],
    ['Agenzia Out', `€${property.costo_agenzia_out?.toLocaleString('it-IT') || 0}`],
    ['Condominio', `€${property.costo_condominio_risc?.toLocaleString('it-IT') || 0}`],
    ['Pulizia', `€${property.costo_pulizia_cantiere?.toLocaleString('it-IT') || 0}`],
    ['Utenze', `€${property.costo_utenze?.toLocaleString('it-IT') || 0}`],
    ['Imprevisti', `€${property.costo_imprevisti?.toLocaleString('it-IT') || 0}`],
  ];
  
  autoTable(doc, {
    startY: 100,
    head: [['Voce', 'Importo']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [67, 97, 238] }
  });
  
  // Risultati
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text('Risultati', 14, finalY);
  doc.setFontSize(12);
  doc.setTextColor(67, 97, 238);
  doc.text(`Prezzo Acquisto: €${property.prezzo_acquisto?.toLocaleString('it-IT')}`, 14, finalY + 10);
  doc.text(`Range Offerta: €${property.prezzo_acquisto_meno_5?.toLocaleString('it-IT')} - €${property.prezzo_acquisto?.toLocaleString('it-IT')}`, 14, finalY + 18);
  doc.text(`ROI: ${property.roi}% | ROE: ${property.roe?.toFixed(2)}%`, 14, finalY + 26);
  
  doc.save(`valutazione-${property.id}.pdf`);
}

export function exportPropertiesToExcel(properties: Property[]) {
  const data = properties.map(p => ({
    'Data': new Date(p.created_at).toLocaleDateString('it-IT'),
    'Nome': p.lead_nome,
    'Cognome': p.lead_cognome,
    'Email': p.lead_email,
    'Telefono': p.lead_telefono || '',
    'Indirizzo': p.indirizzo_completo,
    'MQ': p.superficie_mq,
    'Tipo': p.tipo_immobile || '',
    'Prezzo Riferimento': p.prezzo_riferimento || 0,
    'Prezzo Rivendita': p.prezzo_rivendita || 0,
    'Prezzo Acquisto': p.prezzo_acquisto || 0,
    'Status': p.status,
    'ROI': p.roi || 0,
    'ROE': p.roe || 0,
    'Utile': p.utile_lordo || 0
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Valutazioni');
  XLSX.writeFile(wb, 'valutazioni-bylo.xlsx');
}