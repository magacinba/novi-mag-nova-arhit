// Bootstrap / exports
window.addEventListener("load", () => {
  if (typeof initApiBase === "function") {
    initApiBase();
  }
  if (typeof loadSession === "function") {
    loadSession();
  }
  if (typeof initScanner === "function") {
    initScanner();
  }
  if (SESSION_ID) {
    refreshWave().catch(err => console.error(err));
  }
});

window.addEventListener("beforeunload", () => {
  if (typeof saveSession === "function") {
    saveSession();
  }
});

// Global exports for inline handlers
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
