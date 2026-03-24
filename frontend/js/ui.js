        function setLoading(isLoading) {
            LOADING = isLoading;
            document.getElementById("loadingIndicator").style.display = isLoading ? "block" : "none";
            document.querySelectorAll("button").forEach(b => b.disabled = isLoading);
        }


        function escapeHtml(s) {
            return String(s||'').replace(/[&<>"]/g, function(m) {
                return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m];
            });
        }


        function statusBadge(st) {
            const badges = {
                "pending": `<span class="badge badge-gray">&#x23F3; PENDING</span>`,
                "partial": `<span class="badge badge-orange">&#x26A0;&#xFE0F; PARTIAL</span>`,
                "taken": `<span class="badge badge-green">&#x2705; UZETO</span>`,
                "oos": `<span class="badge badge-orange">&#x274C; NEMA</span>`,
                "problem": `<span class="badge badge-red">&#x1F527; PROBLEM</span>`
            };
            return badges[st] || `<span class="badge badge-gray">${st}</span>`;
        }

        // ==================== FUNKCIJE ZA TAJMER I STATISTIKU ====================

        function startTimer() {
            waveStartTime = Date.now();
            if (timerInterval) clearInterval(timerInterval);
            
            timerInterval = setInterval(() => {
                if (!waveStartTime) return;
                
                const elapsed = Math.floor((Date.now() - waveStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById("timerDisplay").innerText = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                updateStats();
            }, 1000);
        }


        function stopTimer() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }


        function updateStats() {
            if (!waveData || !waveStartTime) return;
            
            const elapsedHours = (Date.now() - waveStartTime) / 3600000;
            const elapsedMinutes = (Date.now() - waveStartTime) / 60000;
            
            const pickedQty = waveData.progress?.picked_qty || 0;
            const itemsPerHour = elapsedHours > 0 ? Math.round(pickedQty / elapsedHours) : pickedQty;
            document.getElementById("itemsPerHour").innerText = itemsPerHour;
            
            const doneLocs = waveData.progress?.done_locations || 0;
            const avgTimePerLoc = doneLocs > 0 && elapsedMinutes > 0 
                ? Math.round((elapsedMinutes / doneLocs) * 60) + 's' 
                : '0s';
            document.getElementById("avgTimePerLoc").innerText = avgTimePerLoc;
            
            document.getElementById("totalDistanceStat").innerText = (waveData.distance_m || 0) + ' m';
        }

        // ==================== SKENIRANJE FAKTURA ====================
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


        function updateScannedList() {
            const container = document.getElementById("scannedInvoices");
            container.innerHTML = '';
            
            scannedInvoices.forEach((inv, index) => {
                const boxNum = index + 1;
                const div = document.createElement('div');
                div.className = 'invoice-pill';
                div.innerHTML = `
                     ${inv} 
                    <span style="background:var(--primary); color:white; padding:2px 10px; border-radius:20px;">Kutija ${boxNum}</span>
                    <span style="cursor:pointer; margin-left:5px;" onclick="removeInvoice('${inv}')"></span>
                `;
                container.appendChild(div);
            });
            
            document.getElementById("scanCounter").innerText = `${scannedInvoices.length}/6`;
        }


        function getBoxColor(box) {
            const colors = {
                1: '#3b82f6', // plava
                2: '#22c55e', // zelena
                3: '#eab308', // uta
                4: '#f97316', // narandasta
                5: '#ef4444', // crvena
                6: '#a855f7'  // ljubiasta
            };
            return colors[box] || '#64748b';
        }

        // ==================== FUNKCIJA ZA PRIKAZ KUTIJE ====================

        function updateCurrentBoxInfo(data) {
            const curLoc = data.current_location;
            const infoDiv = document.getElementById("currentBoxInfo");
            
            if (!curLoc) {
                infoDiv.innerHTML = '';
                return;
            }
            
            const items = data.items_by_loc[curLoc] || [];
            
            if (items.length === 0) {
                infoDiv.innerHTML = '';
                return;
            }
            
            // Grupii stavke po kutijama (samo one koje ekaju)
            const boxesMap = new Map();
            
            items.forEach(it => {
                if (it.status === "pending" || it.status === "partial") {
                    const boxNum = it.box;
                    if (!boxesMap.has(boxNum)) {
                        boxesMap.set(boxNum, []);
                    }
                    boxesMap.get(boxNum).push({sku: it.sku, qty: it.qty_required - (it.qty_picked || 0)});
                }
            });
            
            if (boxesMap.size === 0) {
                infoDiv.innerHTML = '<span style="color:#0a7; font-weight:500;"> Sve obraeno</span>';
                return;
            }
            
            let html = '';
            const boxes = Array.from(boxesMap.entries());
            
            boxes.forEach(([box, items]) => {
                const itemList = items.map(it => `${it.sku} (${it.qty})`).join(', ');
                const bgColor = getBoxColor(box);
				const skuList = items.map(it => it.sku).join(', ');
				html += `<span style="display:inline-block; background:${bgColor}; color:white; padding:6px 16px; border-radius:25px; font-size:16px; font-weight:600; margin-right:8px; cursor:help; box-shadow:0 2px 4px rgba(0,0,0,0.1);" title="SKU: ${itemList}">&#x1F4E6; Kutija ${box} - ${skuList}</span>`;
                
            });
            
            infoDiv.innerHTML = html;
        }

        // ==================== FUNKCIJE ZA NOVI PANEL ====================

        function updateCurrentItemPanel() {
            if (!waveData || !waveData.current_location) {
                document.getElementById('curLocBig').textContent = '-';
                document.getElementById('curSku').textContent = '-';
                document.getElementById('curQty').textContent = '-';
                document.getElementById('curInvoice').textContent = '-';
                return;
            }
            
            const curLoc = waveData.current_location;
            const items = waveData.items_by_loc[curLoc] || [];
            
            // Uzmi prvu stavku koja nije zavr&#353;ena (pending ili partial)
            const activeItem = items.find(it => it.status === 'pending' || it.status === 'partial');
            
            if (activeItem) {
                document.getElementById('curLocBig').textContent = curLoc;
                document.getElementById('curSku').textContent = activeItem.sku;
                document.getElementById('curQty').textContent = activeItem.qty_required - (activeItem.qty_picked || 0);
                document.getElementById('curInvoice').textContent = activeItem.invoice;
            } else {
                document.getElementById('curLocBig').textContent = curLoc;
                document.getElementById('curSku').textContent = '-';
                document.getElementById('curQty').textContent = '-';
                document.getElementById('curInvoice').textContent = '-';
            }
        }

        // Funkcije za velika dugmad

        function renderBoxes(data) {
            const container = document.getElementById("boxesContainer");
            let html = '';

            for (let i = 1; i <= 6; i++) {
                let invoice = null;
                let boxProgress = { total: 0, done: 0 };
                
                for (const [inv, boxNum] of Object.entries(data.box_assignment || {})) {
                    if (boxNum === i) {
                        invoice = inv;
                        break;
                    }
                }

                if (invoice && data.progress.boxes && data.progress.boxes[invoice]) {
                    boxProgress = data.progress.boxes[invoice];
                }

                const percent = boxProgress.total > 0 ? Math.round((boxProgress.done / boxProgress.total) * 100) : 0;
                const isCompleted = boxProgress.total > 0 && boxProgress.done === boxProgress.total;
                const boxColor = getBoxColor(i);

                let boxClass = 'box-card';
                if (isCompleted) boxClass += ' completed';

                const boxHtml = `
                    <div class="${boxClass}" style="border-color: ${boxColor}; cursor: pointer;" onclick="showBoxDetails(${i})">
                        <div class="box-number" style="color: ${boxColor};">&#x1F4E6; Kutija ${i}</div>
                        ${invoice ? `<div class="invoice-pill" style="margin-bottom:10px; background:${boxColor}; color:white;">  ${invoice}</div>` : 
                                    `<div class="muted" style="margin-bottom:10px;"> slobodna</div>`}
                        ${invoice ? `
                            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                <span>${boxProgress.done}/${boxProgress.total}</span>
                                <span>${percent}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${isCompleted ? 'completed' : ''}" style="width:${percent}%; background-color: ${boxColor};"></div>
                            </div>
                        ` : ''}
                    </div>
                `;
                html += boxHtml;
            }
            
            container.innerHTML = html;
        }


        function renderItemsTable(data) {
            const tbody = document.querySelector("#itemsTable tbody");
            tbody.innerHTML = "";

            const curLoc = data.current_location;
            if (!curLoc) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px"> Task zavr&#353;en!</td></tr>`;
                return;
            }

            const items = data.items_by_loc[curLoc] || [];
            
            for (const it of items) {
                const tr = document.createElement("tr");
                if (it.status !== "pending" && it.status !== "partial") tr.classList.add("doneRow");

                let actionButtons = "";
                if (it.status === "pending" || it.status === "partial") {
                    actionButtons = `
                        <button class="btn btn-success" style="padding:4px 8px; font-size:11px" 
                                onclick="takeItem('${it.sku}', '${it.invoice}', ${it.qty_required})">&#x2705; Uzeto</button>
                        <button class="btn btn-warning" style="padding:4px 8px; font-size:11px" 
                                onclick="setOOS('${it.sku}', '${it.invoice}')"> Nema</button>
                        <button class="btn btn-danger" style="padding:4px 8px; font-size:11px" 
                                onclick="setProblem('${it.sku}', '${it.invoice}', ${it.qty_required})">&#x1F527; Problem</button>
                    `;
                }

                tr.innerHTML = `
                    <td><span class="mono">${it.sku}</span></td>
                    <td>${it.qty_required} ${it.qty_picked ? `(uzeto ${it.qty_picked})` : ''}</td>
                    <td><span class="invoice-pill"> ${it.invoice}</span></td>
                    <td><span style="display:inline-block; background:${getBoxColor(it.box)}; color:white; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600;">Kutija ${it.box}</span></td>
                    <td>${statusBadge(it.status)}</td>
                    <td>${actionButtons || '<span class="badge badge-gray"> Zavreno</span>'}</td>
                `;
                tbody.appendChild(tr);
            }
        }


        function renderMiniReport(data) {
            const container = document.getElementById("reportMini");
            container.innerHTML = '';

            const problems = [];
            const taken = [];

            for (const loc of data.ordered_locations || []) {
                const items = data.items_by_loc[loc] || [];
                for (const it of items) {
                    if (it.status === "problem" || it.status === "oos") {
                        problems.push(it);
                    } else if (it.status === "taken") {
                        taken.push(it);
                    }
                }
            }

            if (problems.length > 0) {
                container.innerHTML += '<div style="margin-bottom:10px;"><span class="badge badge-red">&#x1F527; PROBLEM</span></div>';
                problems.forEach(it => {
                    container.innerHTML += `
                        <div style="padding:8px; background:#fff5f5; border-radius:8px; margin-bottom:5px;">
                            <div><strong>${it.sku}</strong> (Kutija ${it.box})</div>
                            <div> ${it.invoice}</div>
                            <div class="muted">${it.note || ''}</div>
                            <div style="display:flex; gap:5px; margin-top:5px;">
                                <button class="btn btn-purple" style="padding:4px 8px; font-size:11px" 
                                        onclick="dopuni('${it.sku}', '${it.invoice}', ${it.qty_required}, ${it.qty_picked || 0})">
                                      DOPUNI
                                </button>
                            </div>
                        </div>
                    `;
                });
            }

            if (taken.length > 0) {
                container.innerHTML += '<div style="margin:10px 0;"><span class="badge badge-green">&#x2705; UZETO</span></div>';
                taken.slice(0, 5).forEach(it => {
                    container.innerHTML += `<div>${it.sku} (Kutija ${it.box}) -  ${it.invoice}</div>`;
                });
                if (taken.length > 5) {
                    container.innerHTML += `<div class="muted">+ jo ${taken.length - 5}</div>`;
                }
            }
        }

        // ==================== FUNKCIJA ZA PRIKAZ DETALJA KUTIJE ====================

        function showBoxDetails(boxNum) {
            if (!SESSION_ID || !waveData) {
                alert("Nema aktivne sesije!");
                return;
            }
            
            // Pronadji fakturu za ovu kutiju
            let invoice = null;
            for (const [inv, box] of Object.entries(waveData.box_assignment || {})) {
                if (box === boxNum) {
                    invoice = inv;
                    break;
                }
            }
            
            if (!invoice) {
                alert(`Kutija ${boxNum} je prazna (nema dodeljenu fakturu).`);
                return;
            }
            
            // Prikupi sve stavke iz ove kutije
            const boxItems = [];
            
            for (const location in waveData.items_by_loc) {
                const items = waveData.items_by_loc[location];
                for (const it of items) {
                    if (it.box === boxNum) {
                        // Dodaj lokaciju u stavku
                        it.locationName = location;
                        boxItems.push(it);
                    }
                }
            }
            
            if (boxItems.length === 0) {
                alert(`Nema stavki u kutiji ${boxNum}`);
                return;
            }
            
            // Napravi poruku za prikaz
            let message = ` KUTIJA ${boxNum} - ${invoice}\n`;
            message += `\n\n`;
            
            let ukupno = 0;
            let uzeto = 0;
            
            boxItems.forEach((it, index) => {
                const statusIcon = it.status === "taken" ? "" : 
                                  (it.status === "problem" ? "" : 
                                  (it.status === "oos" ? "" : ""));
                message += `${index+1}. ${statusIcon} ${it.sku}\n`;
                message += `     ${it.location || it.locationName}\n`;
                message += `     ${it.qty_picked || 0}/${it.qty_required}`;
                if (it.status !== "taken" && it.qty_missing > 0) {
                    message += ` (fali ${it.qty_missing})`;
                }
                message += `\n`;
                if (it.note) message += `     ${it.note}\n`;
                message += `\n`;
                
                ukupno += it.qty_required;
                uzeto += it.qty_picked || 0;
            });
            
            message += `\n`;
            message += ` UKUPNO: ${uzeto}/${ukupno} (${Math.round(uzeto/ukupno*100)}%)`;
            
            alert(message);
        }

        // ==================== RENDER WAVE ====================

        async function renderWave(data) {
            waveData = data;  // Sauvaj podatke globalno za prikaz detalja kutije
            
            document.getElementById("curLoc").innerText = data.current_location || "ZAVRSENO";
            document.getElementById("routeInfo").innerHTML = 
                `${data.mode} |  ${data.start}  ${data.end} |  ${data.distance_m}m`;

            document.getElementById("totalDistanceDisplay").innerText = `${data.distance_m} m`;

            const p = data.progress || {};
            document.getElementById("progressPill").innerHTML = 
                ` ${p.done_items || 0}/${p.total_items || 0} stavki`;
            document.getElementById("progressPercent").innerHTML = ` ${p.progress_percent || 0}%`;

            renderBoxes(data);
            renderItemsTable(data);
            renderMiniReport(data);
            
            // Prikaz kutije za trenutnu lokaciju
            updateCurrentBoxInfo(data);
            
            // Auriraj novi panel
            updateCurrentItemPanel();
            
            // Auriraj statistiku
            updateStats();
            
            // Zaustavi tajmer ako je wave zavr&#353;en
            if (!data.current_location) {
                stopTimer();
            }

            if (typeof saveSession === "function") {
                saveSession();
            }
        }
		
		// ==================== FUNKCIJA ZA PRIKAZ MAPE SA RUTOM ====================

        async function showMap() {
            if (uploadedItems.length === 0) {
                alert("Prvo uitaj Excel fajl sa lokacijama!");
                return;
            }

            setLoading(true);
            
            try {
                // Dohvati koordinate svih lokacija iz backend-a
                const { res, data } = await apiGetJson(`/warehouse/coordinates`);
                if (!res.ok) {
                    throw new Error((data && data.detail) || "Greska pri dohvatu koordinata");
                }
                const sveLokacije = data;
                
                // Filtriraj samo one koje su u uploadedItems
                const lokacijeZaPosetu = uploadedItems.map(item => item.lokacija);
                const filterLokacije = sveLokacije.filter(lok => 
                    lokacijeZaPosetu.includes(lok.location)
                );

                // Pronadji trenutnu lokaciju (ako je wave pokrenut)
                let trenutnaLokacija = null;
                if (waveData && waveData.current_location) {
                    trenutnaLokacija = waveData.current_location;
                }

                // Izraunaj granice mape
                const minX = Math.min(...sveLokacije.map(l => l.x)) - 1;
                const maxX = Math.max(...sveLokacije.map(l => l.x)) + 1;
                const minY = Math.min(...sveLokacije.map(l => l.y)) - 1;
                const maxY = Math.max(...sveLokacije.map(l => l.y)) + 1;
                
                //  Fakture za boje
                const fakture = [...new Set(uploadedItems.map(i => i.faktura))];

                // Otvori prozor
                const mapWindow = window.open("", "Mapa magacina", "width=900,height=700");
                
                mapWindow.document.write(`
                    <html>
                    <head>
                        <title>Mapa magacina - ruta</title>
                        <style>
                            body { margin: 0; padding: 20px; background: #1e293b; font-family: Arial; }
                            .canvas-container { 
                                background: white; 
                                border-radius: 16px; 
                                padding: 20px; 
                                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                            }
                            canvas { 
                                width: 100%; 
                                height: auto; 
                                background: #f8fafc;
                                border-radius: 8px;
                            }
                            .info {
                                margin-top: 15px;
                                color: white;
                                display: flex;
                                gap: 20px;
                                flex-wrap: wrap;
                            }
                            .stats {
                                background: #334155;
                                padding: 10px 15px;
                                border-radius: 8px;
                            }
                            .legend {
                                display: flex;
                                gap: 20px;
                                flex-wrap: wrap;
                                background: #334155;
                                padding: 10px 15px;
                                border-radius: 8px;
                            }
                            .legend-item {
                                display: flex;
                                align-items: center;
                                gap: 5px;
                            }
                            .dot {
                                width: 16px;
                                height: 16px;
                                border-radius: 50%;
                            }
                            .blink {
                                animation: blink 1s infinite;
                            }
                            @keyframes blink {
                                0% { opacity: 1; transform: scale(1); }
                                50% { opacity: 0.6; transform: scale(1.2); }
                                100% { opacity: 1; transform: scale(1); }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="canvas-container">
                            <canvas id="mapCanvas" width="800" height="600"></canvas>
                        </div>
                        <div class="info">
                            <div class="stats">
                                <strong> Lokacije za posetu:</strong> ${filterLokacije.length}
                            </div>
                            <div class="legend" id="legend"></div>
                        </div>
                        <script>
                            const canvas = document.getElementById('mapCanvas');
                            const ctx = canvas.getContext('2d');
                            
                            // Podaci iz backend-a
                            const sveLokacije = ${JSON.stringify(sveLokacije)};
                            const lokacijeZaPosetu = ${JSON.stringify(filterLokacije)};
                            const trenutnaLokacija = ${JSON.stringify(trenutnaLokacija)};
                            const fakture = ${JSON.stringify(fakture)};
                            
                            // Pomona funkcija za boju fakture
                            function getFakturaColor(lokacija) {
                                const item = uploadedItems.find(i => i.lokacija === lokacija);
                                if (!item) return '#94a3b8';
                                const index = fakture.indexOf(item.faktura);
                                const colors = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7'];
                                return index >= 0 ? colors[index % 6] : '#94a3b8';
                            }
                            
                            // Transformacija koordinata u canvas
                            const minX = ${minX};
                            const maxX = ${maxX};
                            const minY = ${minY};
                            const maxY = ${maxY};
                            
                            function toCanvasX(x) {
                                return ((x - minX) / (maxX - minX)) * 750 + 25;
                            }
                            
                            function toCanvasY(y) {
                                return ((maxY - y) / (maxY - minY)) * 550 + 25;
                            }
                            
                            // Crtanje
                            function drawMap() {
                                ctx.clearRect(0, 0, 800, 600);
                                
                                // Nacrtaj grid (prolaze)
                                ctx.strokeStyle = '#cbd5e1';
                                ctx.lineWidth = 0.5;
                                for (let i = 0; i <= 10; i++) {
                                    const x = toCanvasX(minX + (i/10) * (maxX - minX));
                                    ctx.beginPath();
                                    ctx.moveTo(x, 25);
                                    ctx.lineTo(x, 575);
                                    ctx.strokeStyle = '#e2e8f0';
                                    ctx.stroke();
                                    
                                    const y = toCanvasY(minY + (i/10) * (maxY - minY));
                                    ctx.beginPath();
                                    ctx.moveTo(25, y);
                                    ctx.lineTo(775, y);
                                    ctx.stroke();
                                }
                                
                                // Nacrtaj sve lokacije (sive)
                                ctx.fillStyle = '#94a3b8';
                                sveLokacije.forEach(lok => {
                                    const x = toCanvasX(lok.x);
                                    const y = toCanvasY(lok.y);
                                    
                                    ctx.beginPath();
                                    ctx.arc(x, y, 4, 0, 2 * Math.PI);
                                    ctx.fillStyle = '#94a3b8';
                                    ctx.fill();
                                    
                                    // Oznaka lokacije (sitan tekst)
                                    ctx.font = '8px Arial';
                                    ctx.fillStyle = '#475569';
                                    ctx.fillText(lok.location, x + 8, y - 5);
                                });
                                
                                // Nacrtaj liniju rute (ako ima vie od 1 lokacije)
                                if (waveData && waveData.ordered_locations && waveData.ordered_locations.length > 1) {
                                    const ruta = waveData.ordered_locations;
                                    ctx.beginPath();
                                    ctx.strokeStyle = '#2563eb';
                                    ctx.lineWidth = 3;
                                    ctx.setLineDash([5, 3]);
                                    
                                    for (let i = 0; i < ruta.length; i++) {
                                        const lok = sveLokacije.find(l => l.location === ruta[i]);
                                        if (!lok) continue;
                                        const x = toCanvasX(lok.x);
                                        const y = toCanvasY(lok.y);
                                        
                                        if (i === 0) {
                                            ctx.moveTo(x, y);
                                        } else {
                                            ctx.lineTo(x, y);
                                        }
                                    }
                                    ctx.stroke();
                                    ctx.setLineDash([]); // Vrati na punu liniju
                                }
                                
                                // Nacrtaj lokacije za posetu (obojene)
                                lokacijeZaPosetu.forEach(lok => {
                                    const x = toCanvasX(lok.x);
                                    const y = toCanvasY(lok.y);
                                    const boja = getFakturaColor(lok.location);
                                    
                                    ctx.beginPath();
                                    ctx.arc(x, y, 8, 0, 2 * Math.PI);
                                    ctx.fillStyle = boja;
                                    ctx.fill();
                                    ctx.strokeStyle = 'white';
                                    ctx.lineWidth = 2;
                                    ctx.stroke();
                                });
                                
                                // Oznaci trenutnu lokaciju (trepe)
                                if (trenutnaLokacija) {
                                    const trenutna = sveLokacije.find(l => l.location === trenutnaLokacija);
                                    if (trenutna) {
                                        const x = toCanvasX(trenutna.x);
                                        const y = toCanvasY(trenutna.y);
                                        
                                        ctx.beginPath();
                                        ctx.arc(x, y, 14, 0, 2 * Math.PI);
                                        ctx.strokeStyle = '#f97316';
                                        ctx.lineWidth = 4;
                                        ctx.stroke();
                                        
                                        ctx.beginPath();
                                        ctx.arc(x, y, 18, 0, 2 * Math.PI);
                                        ctx.strokeStyle = '#f97316';
                                        ctx.lineWidth = 2;
                                        ctx.setLineDash([5, 5]);
                                        ctx.stroke();
                                        ctx.setLineDash([]);
                                    }
                                }
                            }
                            
                            drawMap();
                            
                            // Legenda
                            const legendDiv = document.getElementById('legend');
                            fakture.forEach((faktura, index) => {
                                const colors = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7'];
                                const boja = colors[index % 6];
                                legendDiv.innerHTML += \`
                                    <div class="legend-item">
                                        <div class="dot" style="background: \${boja};"></div>
                                        <span>\${faktura}</span>
                                    </div>
                                \`;
                            });
                            
                            // Dodaj legendu za trenutnu lokaciju
                            legendDiv.innerHTML += \`
                                <div class="legend-item">
                                    <div class="dot" style="background: #f97316; animation: blink 1s infinite;"></div>
                                    <span>Trenutna lokacija</span>
                                </div>
                            \`;
                            
                        <\/script>
                    </body>
                    </html>
                `);
                
            } catch (err) {
                alert("Greka pri uitavanju mape: " + err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        // ==================== START WAVE ====================

