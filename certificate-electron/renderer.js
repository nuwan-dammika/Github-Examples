const uploadBtn = document.getElementById('upload');
const generateBtn = document.getElementById('generate');
const filePathSpan = document.getElementById('filePath');
let selectedPath;

uploadBtn.addEventListener('click', async () => {
  selectedPath = await window.electronAPI.openFile();
  filePathSpan.textContent = selectedPath || '';
  generateBtn.disabled = !selectedPath;
});

generateBtn.addEventListener('click', async () => {
  const outPath = await window.electronAPI.generateExport(selectedPath);
  if (outPath) alert(`Exported to ${outPath}`);
});
