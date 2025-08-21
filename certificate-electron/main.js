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


  const grades = ['Higher Distinction', 'Distinction', 'Credit', 'Pass', 'Participate'];

  Object.values(wb.Sheets).forEach(sheet => {
    // Skip first two header rows and read raw arrays to map by column index
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2 });
    rows.forEach(cols => {
      const cls = cols[0];
      if (!cls) return;
      const fullName = [cols[1], cols[2], cols[3]].filter(Boolean).join(' ');
      const genderWord = cols[4] === 'Male' ? 'His' : 'Her';
      const teacher = cols[19];

      // Sinhala grades occupy columns 6-10
      const sinAch = grades.find((g, i) =>
        String(cols[5 + i]).match(/^(x|yes|1)$/i)
      );
      if (sinAch) {
        certSeq[cls] ??= { Sinhala: 0, Buddhism: 0 };
        certSeq[cls].Sinhala++;
        const certNo = `G${cls}S${String(certSeq[cls].Sinhala).padStart(3, '0')}`;
        certificateRows.push({
          NAME: fullName,
          Gender: genderWord,
          Achievement: sinAch,
          Subject: 'Sinhala',
          Class: cls,
          Teacher: teacher,
          'Certificate No': certNo,
        });
      }

      // Buddhism grades occupy columns 12-16
      const budAch = grades.find((g, i) =>
        String(cols[11 + i]).match(/^(x|yes|1)$/i)
      );
      if (budAch) {
        certSeq[cls] ??= { Sinhala: 0, Buddhism: 0 };
        certSeq[cls].Buddhism++;
        const certNo = `G${cls}B${String(certSeq[cls].Buddhism).padStart(3, '0')}`;
        certificateRows.push({
          NAME: fullName,
          Gender: genderWord,
          Achievement: budAch,
          Subject: 'Buddhism',
          Class: cls,
          Teacher: teacher,
          'Certificate No': certNo,
        });
      }

      // Stanza column after attendance
      if (String(cols[18]).match(/^(x|yes|1)$/i)) {
        stanzaSeq[cls] ??= 0;
        stanzaSeq[cls]++;
        const stanzaNo = `G${cls}G${String(stanzaSeq[cls]).padStart(3, '0')}`;
        stanzaRows.push({
          'Student Name': fullName,
          Class: cls,
          CertificateNumber: stanzaNo,
          Teacher: teacher,
        });
      }

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
