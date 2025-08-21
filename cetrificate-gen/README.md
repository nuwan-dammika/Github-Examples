# Cetrificate Gen

React Native for Windows sample app that reads a class-wise Excel workbook and
produces a new workbook ready for certificate printing and stanza tracking.

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run on Windows:
   ```bash
   npx react-native-windows-init
   npm run windows
   ```
3. In the running app, press **Upload Excel** to select the source file and then
   **Generate Export** to create `Sample Data export.xlsx` in the downloads
   folder.

The export contains two sheets:
- `Certificate` – two rows per student (Sinhala & Buddhism).
- `Stanza` – only students who performed stanzas.
