import React, {useState} from 'react';
import {Button, SafeAreaView, Text} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import XLSX from 'xlsx';

export default function App() {
  const [sourcePath, setSourcePath] = useState(null);

  const handleUpload = async () => {
    try {
      const res = await DocumentPicker.pickSingle({type: DocumentPicker.types.allFiles});
      setSourcePath(res.uri.replace('file://', ''));
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.warn(err);
      }
    }
  };

  const handleGenerate = async () => {
    if (!sourcePath) {
      return;
    }
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
          if (!achieved) {
            return;
          }
          certSeq[cls] ??= {Sinhala: 0, Buddhism: 0};
          certSeq[cls][subject]++;
          const certNo = `G${cls}${subject === 'Buddhism' ? 'B' : 'S'}${String(certSeq[cls][subject]).padStart(3,'0')}`;
          certificateRows.push({
            NAME: fullName,
            Gender: genderWord,
            Achievement: achieved,
            Subject: subject,
            Teacher: teacher,
            CertificateNo: certNo,
          });
          if (String(row['Stanzas']).match(/^(x|yes|1)$/i)) {
            stanzaSeq[cls] ??= 0;
            stanzaSeq[cls]++;
            const stanzaNo = `G${cls}G${String(stanzaSeq[cls]).padStart(3,'0')}`;
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

    const outWB = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(outWB, XLSX.utils.json_to_sheet(certificateRows), 'Certificate');
    XLSX.utils.book_append_sheet(outWB, XLSX.utils.json_to_sheet(stanzaRows), 'Stanza');

    const outPath = `${RNFS.DownloadDirectoryPath}/Sample Data export.xlsx`;
    XLSX.writeFile(outWB, outPath);
    alert(`Exported to ${outPath}`);
  };

  return (
    <SafeAreaView>
      <Button title="Upload Excel" onPress={handleUpload} />
      <Button title="Generate Export" onPress={handleGenerate} disabled={!sourcePath} />
      {sourcePath ? <Text>{sourcePath}</Text> : null}
    </SafeAreaView>
  );
}
