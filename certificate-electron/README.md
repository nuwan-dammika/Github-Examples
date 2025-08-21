# Certificate Electron App

This simple Electron app converts a raw data workbook into two sheets:
- **Certificate** for printing certificates
- **Stanza** for students with stanzas

The source workbook is expected to have its first two rows merged as headers.
Sinhala grade flags occupy columns 6–10 and Buddhism flags occupy columns 12–16.

### Output columns

*Certificate sheet*

| Column | Description |
| --- | --- |
| `NAME` | First, middle and last names joined with spaces |
| `Gender` | "His" for male students, otherwise "Her" |
| `Achievement` | First marked grade from the subject's grade columns |
| `Subject` | `Sinhala` or `Buddhism` |
| `Class` | Class identifier from the source sheet |
| `Teacher` | Class teacher's name |
| `Certificate No` | `G` + class + `S`/`B` + zero-padded sequence |

*Stanza sheet*

| Column | Description |
| --- | --- |
| `Student Name` | Same as `NAME` above |
| `Class` | Class identifier |
| `CertificateNumber` | `G` + class + `G` + zero-padded sequence |
| `Teacher` | Class teacher's name |

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm start
   ```
3. Click **Select Excel** to choose the source workbook.
4. Click **Generate Export** to save *Sample Data export.xlsx* with the two sheets.
