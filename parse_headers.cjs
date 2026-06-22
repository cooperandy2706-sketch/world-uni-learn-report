const XLSX = require('xlsx');
const workbook = XLSX.readFile('/Users/novara/Desktop/SKY TERM 3.1.xlsx');
const sheet = workbook.Sheets['Fee Receipt (Class-wise)'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log(JSON.stringify(data.slice(0, 5), null, 2));
