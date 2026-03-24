        document.getElementById("barcodeInput").addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                const invoice = this.value.trim();
                if (invoice && scannedInvoices.length < 6) {
                    if (!scannedInvoices.includes(invoice)) {
                        scannedInvoices.push(invoice);
                        updateScannedList();
                        this.value = "";
                        document.getElementById("startWaveBtn").disabled = false;
                    } else {
                        alert("&#x1F4CB; Faktura ve skenirana!");
                        this.value = "";
                    }
                } else if (scannedInvoices.length >= 6) {
                    alert(" Maksimalno 6 faktura!");
                }
            }
        });

        function removeInvoice(invoice) {
            scannedInvoices = scannedInvoices.filter(i => i !== invoice);
            updateScannedList();
            if (scannedInvoices.length === 0) {
                document.getElementById("startWaveBtn").disabled = true;
            }
        }


        function clearScanned() {
            scannedInvoices = [];
            updateScannedList();
            document.getElementById("startWaveBtn").disabled = true;
        }

        // ==================== EXCEL UPLOAD ====================

        async function handleExcelUpload(input) {
            const file = input.files[0];
            if (!file) return;
            
            setLoading(true);
            document.getElementById("uploadStatus").innerHTML = ` Uitavam ${file.name}...`;
            
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
                    alert(` Previe faktura! Maksimalno 6, a u fajlu ih ima ${invoices.length}`);
                    return;
                }
                
                scannedInvoices = invoices;
                updateScannedList();
                
                document.getElementById("uploadStatus").innerHTML = 
                    ` U&#269;itano ${data.length} stavki, ${invoices.length} faktura`;
                
                document.getElementById("startWaveBtn").disabled = false;
                
                console.log("U&#269;itane stavke:", data);
                console.log("Pronadjene fakture:", invoices);
                
            } catch (err) {
                document.getElementById("uploadStatus").innerHTML = ` Greka: ${err.message}`;
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
                console.error("Indeksi:", {fakturaIdx, lokacijaIdx, skuIdx, kolicinaIdx});
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
                    sku = sku.padStart(6, '0').slice(0,6);
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
            
            document.getElementById("uploadStatus").innerHTML = "&#x1F4E5; Uzorak fajla preuzet";
        }

        // ==================== BOJE ZA KUTIJE ====================

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

        // ==================== FUNKCIJE ZA RENDEROVANJE ====================

        async function startWave() {
            if (scannedInvoices.length === 0) {
                alert("Nema skeniranih faktura!");
                return;
            }

            if (uploadedItems.length === 0) {
                alert("Nema ucitanih stavki iz Excel fajla!");
                return;
            }

            setLoading(true);
            try {
                const mode = document.getElementById("routingMode").value;
                console.log("aljem stavke u backend:", uploadedItems);
                console.log("Broj stavki:", uploadedItems.length);
                console.log("Fakture:", [...new Set(uploadedItems.map(i => i.faktura))]);
                console.log("Nain rutiranja:", mode);
                
                const itemsForBackend = uploadedItems
                    .filter(item => scannedInvoices.includes(item.faktura))
                    .map(item => ({
                        sku: item.sku,
                        qty: item.kolicina,
                        location: item.lokacija,
                        invoice: item.faktura
                    }));
                
                const { res, data } = await apiPostJson(`/wave/start`, {
                    items: itemsForBackend,
                    mode: mode
                });
                
                if (!res.ok) {
                    alert("Greka: " + (data.detail || JSON.stringify(data)));
                    console.error("Detalji greke:", data);
                    return;
                }

                SESSION_ID = data.session_id;
                document.getElementById("mainGrid").style.display = "grid";
                
                // Pokreni tajmer
                startTimer();
                
                await renderWave(data);

                if (typeof saveSession === "function") {
                    saveSession();
                }
                
            } catch (err) {
                alert("Mrena greka: " + err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        // ==================== AKCIJE ====================

        async function takeItem(sku, invoice, required) {
            setLoading(true);
            try {
                await apiPostJson(`/wave/${SESSION_ID}/update`, {
                    sku, invoice, action: "take", qty_picked: required
                });
                await refreshWave();
            } catch (err) {
                alert("Greka: " + err.message);
            } finally {
                setLoading(false);
            }
        }


        async function setOOS(sku, invoice) {
            const note = prompt("Komentar za NEMA:");
            if (note === null) return;
            
            setLoading(true);
            try {
                await apiPostJson(`/wave/${SESSION_ID}/update`, {sku, invoice, action: "oos", note});
                await refreshWave();
            } catch (err) {
                alert("Greka: " + err.message);
            } finally {
                setLoading(false);
            }
        }


        async function setProblem(sku, invoice, required) {
            const picked = parseInt(prompt(`Koliko si uzeo? (0-${required})`, "0"));
            if (isNaN(picked)) return;
            
            const note = prompt("Komentar:");
            
            setLoading(true);
            try {
                await apiPostJson(`/wave/${SESSION_ID}/update`, {sku, invoice, action: "problem", qty_picked: picked, note});
                await refreshWave();
            } catch (err) {
                alert("Greka: " + err.message);
            } finally {
                setLoading(false);
            }
        }


        async function dopuni(sku, invoice, required, picked) {
            const fali = required - (picked || 0);
            
            // Ako nema ta da se dopuni
            if (fali <= 0) {
                alert(" Ova stavka je ve kompletna!");
                return;
            }
            
            // Pitanje za dopunu - pokazuje koliko fali
            if (!confirm(`Da li si dopunio&#x1F4E6; SKU ${sku} sa preostalih ${fali} komada?`)) {
                return;
            }
            
            setLoading(true);
            try {
                const { res, data } = await apiPostJson(`/wave/${SESSION_ID}/update`, {
                    sku: sku,
                    invoice: invoice,
                    action: "dopuna",
                    qty_picked: required,  // aljemo punu koliinu
                    note: `Dopunjeno do pune koliine (dodato ${fali})`
                });

                if (!res.ok) {
                    throw new Error((data && data.detail) || "Greka pri dopuni");
                }
                
                await refreshWave();
                alert(` Stavka ${sku} je kompletirana!`);
                
            } catch (err) {
                alert("Greka: " + err.message);
            } finally {
                setLoading(false);
            }
        }


        async function kompletiraj(sku, invoice, required) {
            if (!confirm(`Kompletiraj&#x1F4E6; SKU ${sku}?`)) return;
            
            setLoading(true);
            try {
                await apiPostJson(`/wave/${SESSION_ID}/update`, {sku, invoice, action: "dopuna", qty_picked: required});
                await refreshWave();
            } catch (err) {
                alert("Greka: " + err.message);
            } finally {
                setLoading(false);
            }
        }


        async function refreshWave() {
            if (!SESSION_ID) return;
            
            const { res, data } = await apiGetJson(`/wave/${SESSION_ID}`);
            if (!res.ok) {
                throw new Error((data && data.detail) || "Greka pri refresh");
            }
            await renderWave(data);
        }


        async function debugWave() {
            if (!SESSION_ID) {
                const { res, data } = await apiGetJson(`/wave/__debug`);
                if (!res.ok) {
                    throw new Error((data && data.detail) || "Greka pri debug");
                }
                console.log("DEBUG:", data);
                alert("Proveri konzolu (F12)");
                return;
            }
            
            const { res, data } = await apiGetJson(`/wave/${SESSION_ID}`);
            if (!res.ok) {
                throw new Error((data && data.detail) || "Greka pri debug");
            }
            console.log("WAVE DATA:", data);
            alert("Proveri konzolu (F12)");
        }

        // ==================== EKSPORT FUNKCIJA ====================
        window.removeInvoice = removeInvoice;
        window.clearScanned = clearScanned;
        window.startWave = startWave;
        window.debugWave = debugWave;
        window.takeItem = takeItem;
        window.setOOS = setOOS;
        window.setProblem = setProblem;
        window.dopuni = dopuni;
        window.kompletiraj = kompletiraj;
        window.handleExcelUpload = handleExcelUpload;
        window.downloadSampleExcel = downloadSampleExcel;
        window.showBoxDetails = showBoxDetails;
		window.showMap = showMap;
        window.takeCurrentItem = takeCurrentItem;
        window.oosCurrentItem = oosCurrentItem;
        window.problemCurrentItem = problemCurrentItem;
    


