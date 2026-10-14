/**
 * Safe client-side CSV export utility.
 * Formats table rows into RFC-4180 compliant CSV and triggers browser download.
 * Includes UTF-8 BOM so non-ASCII characters and currency symbols display properly in Excel.
 *
 * @param {string} filename Base name of the downloaded file (without .csv extension)
 * @param {Array<Object>} rows Array of records to export
 * @param {Array<{key: string, label: string}>} headers Column configuration
 */
export const exportToCsv = (filename, rows, headers) => {
  if (!rows || !rows.length) return;

  const separator = ',';
  const headerKeys = headers.map((h) => h.key);
  const headerLabels = headers.map(
    (h) => `"${(h.label || h.key).replace(/"/g, '""')}"`
  );

  const csvRows = [headerLabels.join(separator)];

  for (const row of rows) {
    const line = headerKeys.map((key) => {
      let cell = row[key];
      if (cell === null || cell === undefined) {
        cell = '';
      } else if (typeof cell === 'object') {
        cell = cell.en || Object.values(cell)[0] || '';
      }
      cell = String(cell).replace(/"/g, '""');
      return `"${cell}"`;
    });
    csvRows.push(line.join(separator));
  }

  const csvContent = csvRows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
