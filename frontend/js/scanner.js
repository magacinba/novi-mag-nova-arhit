// ==================== SKENIRANJE ====================
function initScanner() {
  const input = document.getElementById('barcodeInput');
  if (!input) return;

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const invoice = this.value.trim();
      if (invoice && scannedInvoices.length < 6) {
        if (!scannedInvoices.includes(invoice)) {
          scannedInvoices.push(invoice);
          updateScannedList();
          this.value = '';
          document.getElementById('startWaveBtn').disabled = false;
        } else {
          alert('📋 Faktura već skenirana!');
          this.value = '';
        }
      }
    }
  });
}

function simulateScan() {
  if ('BarcodeDetector' in window) {
    alert('Kamera nije dostupna u ovoj verziji. Koristite ručni unos.');
  } else {
    const fakeBarcode = prompt('Unesite barkod fakture:');
    if (fakeBarcode) {
      const input = document.getElementById('barcodeInput');
      input.value = fakeBarcode;
      input.dispatchEvent(new Event('keydown', { key: 'Enter' }));
    }
  }
}

function updateScannedList() {
  const container = document.getElementById('scannedInvoices');
  container.innerHTML = '';

  scannedInvoices.forEach((inv, index) => {
    const div = document.createElement('div');
    div.className = 'invoice-pill';
    div.innerHTML = `
      ${inv}
      <span style="background: var(--primary); color:white; padding:2px 8px; border-radius:20px;">${index + 1}</span>
      <span class="remove-invoice" onclick="removeInvoice('${inv}')">×</span>
    `;
    container.appendChild(div);
  });

  document.getElementById('scanCounter').innerText = `${scannedInvoices.length}/6`;
}

function removeInvoice(invoice) {
  scannedInvoices = scannedInvoices.filter(i => i !== invoice);
  updateScannedList();
  document.getElementById('startWaveBtn').disabled = scannedInvoices.length === 0;
}

function clearScanned() {
  scannedInvoices = [];
  updateScannedList();
  document.getElementById('startWaveBtn').disabled = true;
}
