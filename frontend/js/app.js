// ==================== INIT ====================
        window.addEventListener('load', () => {
            console.log('Stranica učitana');
            
            const savedFinalTime = localStorage.getItem('finalWaveTime');
            if (savedFinalTime) {
                document.getElementById('reportTotalTime').innerText = savedFinalTime;
            }
            
            document.getElementById('scanSection').style.display = 'block';
            document.getElementById('pickingSection').style.display = 'none';
            
            const firstNavItem = document.querySelector('.nav-item');
            if (firstNavItem) {
                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                firstNavItem.classList.add('active');
            }
            
            const savedSession = localStorage.getItem('session_id');
            const savedWave = localStorage.getItem('waveData');
            
            if (savedSession && savedWave) {
                setTimeout(() => {
                    if (confirm('Nastavi prethodnu sesiju?')) {
                        SESSION_ID = savedSession;
                        waveData = JSON.parse(savedWave);
                        document.getElementById('scanSection').style.display = 'none';
                        document.getElementById('pickingSection').style.display = 'block';
                        renderWave(waveData);
                        startTimer();
                    }
                }, 500);
            }
        });
        
        // ==================== EXPORT ====================
if (typeof removeInvoice === 'function') {
            window.removeInvoice = removeInvoice;
        }
if (typeof clearScanned === 'function') {
            window.clearScanned = clearScanned;
        }
if (typeof startWave === 'function') {
            window.startWave = startWave;
        }
if (typeof simulateScan === 'function') {
            window.simulateScan = simulateScan;
        }
if (typeof takeCurrentItem === 'function') {
            window.takeCurrentItem = takeCurrentItem;
        }
if (typeof oosCurrentItem === 'function') {
            window.oosCurrentItem = oosCurrentItem;
        }
if (typeof problemCurrentItem === 'function') {
            window.problemCurrentItem = problemCurrentItem;
        }
if (typeof showSection === 'function') {
            window.showSection = showSection;
        }
if (typeof exportReport === 'function') {
            window.exportReport = exportReport;
        }
if (typeof saveApiUrl === 'function') {
            window.saveApiUrl = saveApiUrl;
        }
if (typeof clearLocalData === 'function') {
            window.clearLocalData = clearLocalData;
        }
if (typeof showBoxDetails === 'function') {
            window.showBoxDetails = showBoxDetails;
        }
if (typeof loadBoxesSection === 'function') {
            window.loadBoxesSection = loadBoxesSection;
        }
if (typeof loadSettings === 'function') {
            window.loadSettings = loadSettings;
        }
if (typeof loadReportData === 'function') {
            window.loadReportData = loadReportData;
        }
if (typeof getBoxColor === 'function') {
            window.getBoxColor = getBoxColor;
        }
if (typeof calculateStats === 'function') {
            window.calculateStats = calculateStats;
        }
if (typeof openCamera === 'function') {
            window.openCamera = openCamera;
        }
if (typeof closeCamera === 'function') {
            window.closeCamera = closeCamera;
        }
if (typeof newSession === 'function') {
            window.newSession = newSession;
        }