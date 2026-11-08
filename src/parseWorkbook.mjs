import * as XLSX from 'xlsx';

export function parseWorkbook(workbook) {
  const pages = workbook.SheetNames.filter((name) => !name.startsWith('_')).map((name) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' });
    const items = rows
      .filter((row) => row['메뉴명'] !== '')
      .map((row) => ({
        name: row['메뉴명'],
        price: row['가격'],
        desc: row['설명'],
        soldOut: row['품절'] === 'Y',
        category: row['카테고리'],
      }));
    const groups = [];
    for (const item of items) {
      let group = groups.find((g) => g.category === item.category);
      if (!group) {
        group = { category: item.category, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    }
    return { title: name, items, groups };
  });
  return { pages };
}
