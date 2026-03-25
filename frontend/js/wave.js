        // ==================== START WAVE ====================
        async function startWave() {
            if (scannedInvoices.length === 0) {
                alert('Nema skeniranih faktura!');
                return;
            }
            
            if (uploadedItems.length === 0) {
                const saved = localStorage.getItem('uploadedItems');
                if (saved) {
                    uploadedItems = JSON.parse(saved);
                } else {
                    alert('Nema uÄŤitanih stavki!');
                    return;
                }
            }
            
            setLoading(true);
            
            try {
                const itemsForBackend = uploadedItems
                    .filter(item => scannedInvoices.includes(item.faktura))
                    .map(item => ({
                        sku: item.sku,
                        qty: item.kolicina,
                        location: item.lokacija,
                        invoice: item.faktura
                    }));
                
                const data = await safeFetch(`${API}/wave/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: itemsForBackend, mode: 'optimal' })
                });
                if (!data) return;
                
                
                
                SESSION_ID = data.session_id;
                waveData = data;
                finalElapsedSeconds = null; // Resetuj konaÄŤno vreme
                
                localStorage.setItem('session_id', SESSION_ID);
                localStorage.setItem('waveData', JSON.stringify(data));
                
                document.getElementById('scanSection').style.display = 'none';
                document.getElementById('pickingSection').style.display = 'block';
                
                startTimer();
                renderWave(data);
                
            } catch (err) {
                if (!navigator.onLine) {
                    alert('Offline naÄŤin rada nije joĹˇ implementiran.');
                } else {
                    alert('GreĹˇka: ' + err.message);
                }
            } finally {
                setLoading(false);
            }
        }
        

        // ==================== AKCIJE ====================
        function takeCurrentItem() {
            if (!waveData?.current_location) return;
            
            const items = waveData.items_by_loc[waveData.current_location] || [];
            const activeItem = items.find(it => it.status === 'pending' || it.status === 'partial');
            
            if (activeItem) {
                takeItem(activeItem.sku, activeItem.invoice, activeItem.qty_required);
            }
        }
        
        function oosCurrentItem() {
            if (!waveData?.current_location) return;
            
            const items = waveData.items_by_loc[waveData.current_location] || [];
            const activeItem = items.find(it => it.status === 'pending' || it.status === 'partial');
            
            if (activeItem) {
                const note = prompt('Komentar za NEMA:');
                if (note !== null) {
                    setOOS(activeItem.sku, activeItem.invoice, note);
                }
            }
        }
        
        function problemCurrentItem() {
            if (!waveData?.current_location) return;
            
            const items = waveData.items_by_loc[waveData.current_location] || [];
            const activeItem = items.find(it => it.status === 'pending' || it.status === 'partial');
            
            if (activeItem) {
                const picked = parseInt(prompt(`Koliko si uzeo? (0-${activeItem.qty_required})`, '0'));
                if (!isNaN(picked)) {
                    const note = prompt('Komentar:');
                    setProblem(activeItem.sku, activeItem.invoice, activeItem.qty_required, picked, note);
                }
            }
        }
        
        async function takeItem(sku, invoice, required) {
            setLoading(true);
            try {
                const ok = await safeFetch(`${API}/wave/${SESSION_ID}/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sku, invoice, action: 'take', qty_picked: required })
                });
                if (!ok) return;
                await refreshWave();
            } catch (err) {
                alert('GreĹˇka: ' + err.message);
            } finally {
                setLoading(false);
            }
        }
        
        async function setOOS(sku, invoice, note) {
            setLoading(true);
            try {
                const ok = await safeFetch(`${API}/wave/${SESSION_ID}/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sku, invoice, action: 'oos', note })
                });
                if (!ok) return;
                await refreshWave();
            } catch (err) {
                alert('GreĹˇka: ' + err.message);
            } finally {
                setLoading(false);
            }
        }
        
        async function setProblem(sku, invoice, required, picked, note) {
            setLoading(true);
            try {
                const ok = await safeFetch(`${API}/wave/${SESSION_ID}/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sku, invoice, action: 'problem', qty_picked: picked, note })
                });
                if (!ok) return;
                await refreshWave();
            } catch (err) {
                alert('GreĹˇka: ' + err.message);
            } finally {
                setLoading(false);
            }
        }
        
        async function refreshWave() {
            if (!SESSION_ID) return;
            
            try {
                const data = await safeFetch(`${API}/wave/${SESSION_ID}`);
                if (!data) return;
                renderWave(data);
                localStorage.setItem('waveData', JSON.stringify(data));
            } catch (err) {
                console.log('Offline - koristim keĹˇirane podatke');
                const cached = localStorage.getItem('waveData');
                if (cached) renderWave(JSON.parse(cached));
            }
        }
        
