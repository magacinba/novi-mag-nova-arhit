// Excel upload + current item actions
async function handleExcelUpload(input) {
  const file = input.files[0];
  if (!file) return;

  setLoading(true);
  document.getElementById("uploadStatus").innerHTML = ` Ucitavam ${file.name}...`;

  try {
    let data = [];

    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      data = parseCSV(text);
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      data = parseCSV(csv);
    }

    uploadedItems = data;
    const invoices = [...new Set(data.map(row => row.faktura))];

    if (invoices.length === 0) {
      alert("Nema validnih podataka u fajlu!");
      return;
    }

    if (invoices.length > 6) {
      alert(` Previse faktura! Maksimalno 6, a u fajlu ih ima ${invoices.length}`);
      return;
    }

    scannedInvoices = invoices;
    updateScannedList();

    document.getElementById("uploadStatus").innerHTML =
      ` Ucitano ${data.length} stavki, ${invoices.length} faktura`;

    document.getElementById("startWaveBtn").disabled = false;

    console.log("Ucitane stavke:", data);
    console.log("Pronadjene fakture:", invoices);

  } catch (err) {
    document.getElementById("uploadStatus").innerHTML = ` Greska: ${err.message}`;
    console.error(err);
  } finally {
    setLoading(false);
    input.value = '';
  }
}

function parseCSV(csvText) {
  const cleanText = csvText.replace(/"/g, '');
  const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(l => l);

  if (lines.length === 0) return [];

  const headers = lines[0].split(/[,\t;]/).map(h => h.trim().toLowerCase());
  console.log("Zaglavlje:", headers);

  const fakturaIdx = headers.findIndex(h =>
    h.includes('broj fak') || h.includes('faktura') || h.includes('invoice') || h === 'broj');
  const lokacijaIdx = headers.findIndex(h =>
    h.includes('lokacija') || h.includes('location') || h === 'lok');
  const skuIdx = headers.findIndex(h =>
    h.includes('sku') || h.includes('sifra') || h.includes('artikal') || h === 'sku');
  const kolicinaIdx = headers.findIndex(h =>
    h.includes('kolicina') || h.includes('qty') || h.includes('quantity') || h === 'kol');

  if (fakturaIdx === -1 || lokacijaIdx === -1 || skuIdx === -1 || kolicinaIdx === -1) {
    console.error("Indeksi:", { fakturaIdx, lokacijaIdx, skuIdx, kolicinaIdx });
    throw new Error("Fajl mora sadrati kolone: broj fak, lokacija, sku, kolicina");
  }

  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(/[,\t;]/).map(v => v.trim());
    if (values.length < 4) continue;

    const faktura = values[fakturaIdx]?.trim();
    const lokacija = values[lokacijaIdx]?.trim().toUpperCase();
    let sku = values[skuIdx]?.trim();
    const kolicina = parseInt(values[kolicinaIdx]?.trim(), 10);

    if (sku) {
      sku = String(sku).replace(/\D/g, '');
      sku = sku.padStart(6, '0').slice(0, 6);
    }

    if (!faktura || !lokacija || !sku || isNaN(kolicina) || kolicina < 1) continue;
    if (!/^\d{6}$/.test(sku)) continue;

    result.push({
      faktura: faktura,
      lokacija: lokacija,
      sku: sku,
      kolicina: kolicina
    });
  }

  console.log("Parsirani podaci:", result);
  return result;
}

function downloadSampleExcel() {
  const sampleData = [
    ['lokacija', 'sku', 'kolicina', 'broj fak'],
    ['A581', '123456', '2', 'FAKTURA-01'],
    ['A581', '654321', '10', 'FAKTURA-02'],
    ['A98', '111111', '1', 'FAKTURA-03'],
    ['A87', '222222', '1', 'FAKTURA-01'],
    ['C1', '444444', '1', 'FAKTURA-01'],
    ['D52', '888888', '1', 'FAKTURA-02'],
    ['B1987', '101010', '1', 'FAKTURA-02'],
  ];

  let csv = sampleData.map(row => row.join('\t')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fakture_uzorak.csv';
  a.click();
  URL.revokeObjectURL(url);

  document.getElementById("uploadStatus").innerHTML = "📥 Uzorak fajla preuzet";
}

function takeCurrentItem() {
  const curLoc = waveData?.current_location;
  if (!curLoc) return;

  const items = waveData.items_by_loc[curLoc] || [];
  const activeItem = items.find(it => it.status === 'pending' || it.status === 'partial');

  if (activeItem) {
    takeItem(activeItem.sku, activeItem.invoice, activeItem.qty_required);
  } else {
    alert('Nema aktivne stavke na ovoj lokaciji!');
  }
}

function oosCurrentItem() {
  const curLoc = waveData?.current_location;
  if (!curLoc) return;

  const items = waveData.items_by_loc[curLoc] || [];
  const activeItem = items.find(it => it.status === 'pending' || it.status === 'partial');

  if (activeItem) {
    setOOS(activeItem.sku, activeItem.invoice);
  } else {
    alert('Nema aktivne stavke na ovoj lokaciji!');
  }
}

function problemCurrentItem() {
  const curLoc = waveData?.current_location;
  if (!curLoc) return;

  const items = waveData.items_by_loc[curLoc] || [];
  const activeItem = items.find(it => it.status === 'pending' || it.status === 'partial');

  if (activeItem) {
    setProblem(activeItem.sku, activeItem.invoice, activeItem.qty_required);
  } else {
    alert('Nema aktivne stavke na ovoj lokaciji!');
  }
}
