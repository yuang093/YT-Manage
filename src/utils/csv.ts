// CSV 處理工具

export const arrayToCSV = (items) => {
  const headers = ['id', 'type', 'title', 'description', 'url', 'urls', 'createdAt', 'visits', 'downloads'];
  const csvRows = items.map(item => {
    return headers.map(header => {
      let val = item[header];
      if (header === 'urls') val = JSON.stringify(val || []);
      if (val === undefined || val === null) val = '';
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    }).join(',');
  });
  return [headers.join(','), ...csvRows].join('\n');
};

export const csvToArray = (csvText) => {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
    const values = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match[1] !== undefined) values.push(match[1].replace(/""/g, '"'));
      else values.push(match[2]);
    }
    if (values.length === 0) continue;
    const obj = {};
    headers.forEach((header, index) => {
      let val = values[index];
      if (val === undefined) val = '';
      if (header === 'urls') {
        try { val = JSON.parse(val); } catch (e) { val = []; }
      }
      obj[header] = val;
    });
    result.push(obj);
  }
  return result;
};
