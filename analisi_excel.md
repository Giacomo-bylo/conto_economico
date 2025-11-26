# Analisi del file `Conto Economico Bylo.xlsx`

### Contesto
- Unico foglio presente: `Foglio1`.
- Il layout utilizza due blocchi principali: colonne `B:C` per l’elenco dei costi/base valori e colonne `I:J` per il riepilogo dei costi applicati all’operazione. Le colonne `E:G` ospitano i driver relativi alle valutazioni AVM e agli input di mercato.

---

## 1. Colonne presenti e ruolo
- **Colonna B – “Voce di costo / driver”**: etichette di tutte le componenti (Ristrutturazione, Studio Tecnico, AVM, ecc.).
- **Colonna C – “Valore base / parametro”**: importi o percentuali associate alla voce della colonna B. Alcuni campi sono costanti (es. 1500 € per Studio Tecnico), altri sono formule (es. Imposte).
- **Colonna E – “Sezione driver AVM”**: descrive i diversi riferimenti di prezzo (AVM, Agent Pricing, Immobiliare) e i nomi dei risultati intermedi (“Prezzo Riferimento”, “Prezzo Rivendita”, “Prezzo Acquisto” ecc.).
- **Colonna F – “Input numerici AVM/min/max”**: raccoglie i valori numerici provenienti dalle valutazioni (F7, F9 ecc.) e contiene formule di aggregazione (es. `F11`, `F13`, `F16`, `F18`).
- **Colonna G – “Valori massimi”**: utilizzata insieme a `F` per gestire coppie minimo/massimo.
- **Colonna I – “Riepilogo costi”**: ripete le etichette del blocco di sinistra per i totali calcolati.
- **Colonna J – “Importi calcolati”**: contiene le formule che trasformano i valori base in costi effettivi e calcoli finali (Acquisto, Totale Costi, ROI, ecc.).

---

## 2. Formule individuate

| Campo (cella) | Formula | Significato |
| --- | --- | --- |
| `J2` (Acquisto) | `=J19-J18` | Prezzo di acquisto risultante dalla differenza tra costo totale e costi escluso acquisto. |
| `J3` (Costo ristrutturazione) | `=C3*F3` | Costo per mq moltiplicato per i metri quadri dell’immobile. |
| `J4` | `=C4` | Copia il costo fisso di Studio Tecnico. |
| `J5` | `=C5` | Copia il costo fisso Architetto. |
| `C6` | `=(J21*0.5%)+200` | Imposte stimate come 0,5% dell’esposizione + 200 €. |
| `J6` | `=C6` | Riporta l’importo imposte calcolato in C6. |
| `J7` | `=C7` | Notaio (costo fisso). |
| `J8` | `=C8` | Avvocato (costo fisso). |
| `F11` (Prezzo riferimento) | `=MIN(F7,G7,F9,G9)` | Seleziona il valore più conservativo fra min/max di Agent Pricing e Immobiliare Insights. |
| `J12` (Costo agenzia out) | `=J20*C12` | Percentuale dell’agenzia out applicata al totale rivendita. |
| `F13` (Prezzo rivendita) | `=AVERAGE(AVERAGE(F7:G7),AVERAGE(F9:G9))` | Media della media Agent Pricing e della media Immobiliare. |
| `J13` | `=C13` | Condominio risc. (fisso). |
| `J14` | `=C14` | Pulizia cantiere (fisso). |
| `J15` | `=C15` | Utenze (fisso). |
| `F16` (Prezzo acquisto) | `=J2` | Rimanda al prezzo di acquisto calcolato. |
| `J16` (Imprevisti) | `=C16*J3` | Percentuale di imprevisti applicata al costo di ristrutturazione. |
| `F18` (Prezzo acquisto -5%) | `=J2*95%` | Range inferiore dell’offerta (-5%). |
| `J18` (Costi escluso acquisto) | `=SUM(J3:J17)` | Somma tutti i costi operativi. |
| `J19` (Totale costi) | `=J20/(1+J24/100)` | Ricava il costo totale imponendo un ROI target. |
| `J20` (Totale rivendita) | `=F13` | Usa il Prezzo Rivendita calcolato in F13. |
| `J22` (Utile lordo) | `=J20-J19` | Margine tra ricavo e costi totali. |
| `J25` (ROE) | `=J22/J21` | Rendimento sull’esposizione. |

---

## 3. Logica completa dei calcoli

1. **Input di mercato (colonne F/G)**  
   - Si inseriscono i valori min/max di Agent Pricing (`F7`, `G7`) e di Immobiliare Insights (`F9`, `G9`).  
   - Il “Prezzo riferimento” (`F11`) prende il minimo assoluto di questi quattro valori.  
   - Il “Prezzo rivendita” (`F13` → `J20`) è la media delle medie Agent Pricing e Immobiliare, producendo un valore più equilibrato.  
   - Il “Prezzo acquisto” (`J2`) è derivato dai costi complessivi e dal ROI richiesto (vedi punto 3).

2. **Costi operativi**  
   - Ogni voce di costo nella colonna B ha un valore base in colonna C. Gran parte di questi (Studio Tecnico, Architetto, Notaio, Avvocato, Condominio, Pulizia, Utenze) sono riportati tali e quali in colonna J.  
   - La ristrutturazione (`J3`) moltiplica il costo unitario `C3` per i metri quadri `F3`.  
   - Le imposte (`C6` → `J6`) dipendono dall’esposizione (`J21`).  
   - L’agenzia out (`J12`) è una percentuale del valore di rivendita.  
   - Gli imprevisti (`J16`) sono calcolati come percentuale del costo di ristrutturazione.  
   - “Costi escluso acquisto” (`J18`) somma tutte le voci J3–J17.

3. **Determinazione del prezzo di acquisto**  
   - Si parte dal target ROI (`J24`).  
   - Il totale costi `J19` è ricavato imponendo `Totale Rivendita / (1 + ROI)`; da qui `J2 = J19 - J18`.  
   - Il prezzo di acquisto -5% (`F18`) fornisce un range negoziale.

4. **Marginalità e indicatori**  
   - L’esposizione (`J21`) rappresenta il capitale impegnato.  
   - L’utile lordo (`J22`) è ricavo meno costi totali.  
   - Il ROE (`J25`) confronta l’utile con l’esposizione.

Le dipendenze principali quindi sono:
- **Prezzo rivendita** dipende dai valori AVM (`F7`, `G7`, `F9`, `G9`).
- **Costi escluso acquisto** dipendono dai parametri globali (colonna C) e da MQ (`F3`).
- **Prezzo acquisto** dipende da `Totale rivendita`, `ROI` e `Costi escluso acquisto`.
- **Imposte** dipendono dall’esposizione (`J21`).
- **Imprevisti** dipendono dal costo di ristrutturazione (`J3`).

---

## 4. Campi che dipendono dai parametri globali
| Parametro globale (app `GlobalParameters`) | Cella nel foglio | Uso |
| --- | --- | --- |
| `ristrutturazione_per_mq` | `C3` | Base per `J3`. |
| `studio_tecnico` | `C4` | Copiato in `J4`. |
| `architetto` | `C5` | Copiato in `J5`. |
| `imposte_percentuale` / `imposte_fisso` | `C6` | Formula attuale 0,5% + 200: segue la stessa logica (percentuale + fisso). |
| `notaio` | `C7` | Copiato in `J7`. |
| `avvocato` | `C8` | Copiato in `J8`. |
| `agibilita` | `C9` (vuoto ma previsto) | Da riportare in `J9` quando valorizzato. |
| `cambio_destinazione_uso` | `C10` | Idem sopra. |
| `agenzia_in_percentuale` | `C11` | Percentuale di costo ingresso (non ancora applicata in J11). |
| `agenzia_out_percentuale` | `C12` | Utilizzata in `J12 = J20*C12`. |
| `condominio_risc` | `C13` | Copiato in `J13`. |
| `pulizia_cantiere` | `C14` | Copiato in `J14`. |
| `utenze` | `C15` | Copiato in `J15`. |
| `imprevisti_percentuale` | `C16` | Applicato tramite `J16 = C16*J3`. |
| `esposizione_default` | `J21` | Valore iniziale dell’esposizione (modificabile). |
| `roi_target` | `J24` | ROI richiesto per calcolare `J19`. |
| `imposte_fisso` | parte della formula in `C6`. |

---

## 5. Input manuali vs calcoli automatici

**Input manuali (per singola operazione)**  
- `F3` (MQ dell’immobile).  
- `F7`, `G7` (Agent Pricing min/max).  
- `F9`, `G9` (Immobiliare Insights min/max).  
- Eventuali valori di `C9`, `C10`, `C17` se presenti (es. altre spese).  
- `J21` (Esposizione) – parte del profilo finanziario dell’operazione.  
- `J24` (ROI target).  
- Qualsiasi costo “Altro” (`B17/C17`).  

**Valori parametrizzati/globali**  
- Tutti i costi/percentuali in colonna C collegati ai parametri globali (vedi sezione 4). Questi dovrebbero essere caricati automaticamente dall’app.  

**Calcolati automaticamente**  
- `J3` Ristrutturazione (dai parametri + MQ).  
- `J4`–`J8`, `J13`–`J16` (riporto dei parametri).  
- `F11`, `F13`, `F16`, `F18` (derivazioni dalle AVM o dai risultati).  
- `J12`, `J18`, `J19`, `J20`, `J22`, `J25` e `J2` (prezzo acquisto), oltre ai range di offerta e ai margini.

Questa mappatura permette di replicare fedelmente la logica dell’Excel nell’applicazione Supabase/Vite, garantendo coerenza fra i parametri globali e i calcoli delle singole proprietà.

