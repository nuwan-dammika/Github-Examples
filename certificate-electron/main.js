const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const XLSX = require('xlsx');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function processWorkbook(sourcePath) {
  const wb = XLSX.readFile(sourcePath);
  const certificateRows = [];
  const stanzaRows = [];
  const certSeq = {};
  const stanzaSeq = {};

  Object.values(wb.Sheets).forEach(sheet => {
    const json = XLSX.utils.sheet_to_json(sheet);
    json.forEach(row => {
      const fullName = [row['First Name'], row['Middle Name'], row['Last Name']]
        .filter(Boolean)
        .join(' ');
      const genderWord = row['Gender'] === 'Male' ? 'His' : 'Her';
      const cls = row['Class'];
      const teacher = row['Class Teacher Name'];
      ['Sinhala', 'Buddhism'].forEach(subject => {
        const grades = ['Higher Distinction', 'Distinction', 'Credit', 'Pass', 'Participate'];
        const achieved = grades.find(g =>
          String(row[`${subject}-Grade ${g}`]).match(/^(x|yes|1)$/i)
        );
        if (!achieved) return;
        certSeq[cls] ??= { Sinhala: 0, Buddhism: 0 };
        certSeq[cls][subject]++;
        const certNo = `G${cls}${subject === 'Buddhism' ? 'B' : 'S'}${String(
          certSeq[cls][subject]
        ).padStart(3, '0')}`;
        certificateRows.push({
          NAME: fullName,
          Gender: genderWord,
          Achievement: achieved,
          Subject: subject,
          Class: cls,
          Teacher: teacher,
          CertificateNo: certNo,
        });
        if (String(row['Stanzas']).match(/^(x|yes|1)$/i)) {
          stanzaSeq[cls] ??= 0;
          stanzaSeq[cls]++;
          const stanzaNo = `G${cls}G${String(stanzaSeq[cls]).padStart(3, '0')}`;
          stanzaRows.push({
            StudentName: fullName,
            Class: cls,
            CertificateNumber: stanzaNo,
            Teacher: teacher,
          });
        }
      });
    });
  });

  return { certificateRows, stanzaRows };
}

ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Excel', extensions: ['xlsx'] }],
  });
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('generate-export', async (_, sourcePath) => {
  if (!sourcePath) return null;
  const { certificateRows, stanzaRows } = processWorkbook(sourcePath);
  const outWB = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(outWB, XLSX.utils.json_to_sheet(certificateRows), 'Certificate');
  XLSX.utils.book_append_sheet(outWB, XLSX.utils.json_to_sheet(stanzaRows), 'Stanza');
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: path.join(path.dirname(sourcePath), 'Sample Data export.xlsx'),
  });
  if (filePath) {
    XLSX.writeFile(outWB, filePath);
    return filePath;
  }
  return null;
});
