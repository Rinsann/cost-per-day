import { ledgerRepository } from '@/repositories/ledgerRepository';
import { ExpenseRecord, ExpenseRecordType } from '@/types/expense';

const MOCK_LEDGER_PREFIX = 'mock-ledger-';

type Scenario = {
  amount: number;
  category: string;
  note: string;
  type: ExpenseRecordType;
};

const expenseScenarios: Scenario[] = [
  { amount: 8.5, category: '餐饮', note: '早餐', type: 'expense' },
  { amount: 28.8, category: '餐饮', note: '午餐', type: 'expense' },
  { amount: 46.6, category: '餐饮', note: '晚餐', type: 'expense' },
  { amount: 18.0, category: '餐饮', note: '奶茶', type: 'expense' },
  { amount: 22.5, category: '餐饮', note: '咖啡', type: 'expense' },
  { amount: 42.9, category: '餐饮', note: '外卖', type: 'expense' },
  { amount: 6.0, category: '交通', note: '地铁', type: 'expense' },
  { amount: 2.0, category: '交通', note: '公交', type: 'expense' },
  { amount: 38.6, category: '交通', note: '打车', type: 'expense' },
  { amount: 3200.0, category: '居住', note: '房租', type: 'expense' },
  { amount: 168.4, category: '居住', note: '水电', type: 'expense' },
  { amount: 180.0, category: '居住', note: '物业', type: 'expense' },
  { amount: 99.0, category: '其他', note: '手机话费', type: 'expense' },
  { amount: 129.0, category: '其他', note: '宽带', type: 'expense' },
  { amount: 26.8, category: '医疗', note: '挂号', type: 'expense' },
  { amount: 238.6, category: '医疗', note: '复诊', type: 'expense' },
  { amount: 76.3, category: '医疗', note: '药品', type: 'expense' },
  { amount: 86.2, category: '购物', note: '日用品', type: 'expense' },
  { amount: 399.0, category: '购物', note: '衣服', type: 'expense' },
  { amount: 129.9, category: '购物', note: '电子配件', type: 'expense' },
  { amount: 299.0, category: '学习', note: '课程', type: 'expense' },
  { amount: 58.0, category: '学习', note: '书籍', type: 'expense' },
  { amount: 45.0, category: '娱乐', note: '电影', type: 'expense' },
  { amount: 68.0, category: '娱乐', note: '游戏', type: 'expense' },
  { amount: 25.0, category: '娱乐', note: '会员订阅', type: 'expense' },
  { amount: 36.6, category: '其他', note: '临时支出', type: 'expense' }
];

const optionalIncomeScenarios: Scenario[] = [
  { amount: 860.0, category: '副业', note: '兼职设计', type: 'income' },
  { amount: 420.5, category: '退款', note: '报销', type: 'income' },
  { amount: 126.3, category: '其他', note: '理财收益', type: 'income' },
  { amount: 1200.0, category: '奖金', note: '项目奖金', type: 'income' }
];

function isMockRecord(record: ExpenseRecord) {
  return record.id.startsWith(MOCK_LEDGER_PREFIX);
}

function getDateString(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getMonthKey(year: number, month: number) {
  return `${year}${String(month).padStart(2, '0')}`;
}

function getDayForRecord(index: number, maxDay: number, monthSeed: number) {
  return Math.min(maxDay, ((index * 3 + monthSeed) % maxDay) + 1);
}

function getMonthRecordCount(year: number, month: number, currentYear: number, currentMonth: number) {
  if (year === currentYear && month === currentMonth) {
    return 18;
  }

  return 12 + ((year + month) % 5);
}

function buildIncomeScenario(year: number, month: number): Scenario {
  return {
    amount: 8800 + ((year + month) % 7) * 420 + (month % 2) * 188.56,
    category: '工资',
    note: '工资',
    type: 'income'
  };
}

function buildMonthlyMockRecords(
  year: number,
  month: number,
  recordCount: number,
  maxDay: number
) {
  const records: ExpenseRecord[] = [];
  const monthKey = getMonthKey(year, month);
  const pushRecord = (scenario: Scenario, day: number, sequence: number) => {
    const date = getDateString(year, month, day);
    const amountOffset = scenario.type === 'expense' ? ((year + month + sequence) % 9) * 0.17 : 0;
    const record: ExpenseRecord = {
      amount: Number((scenario.amount + amountOffset).toFixed(2)),
      category: scenario.category,
      createdAt: `${date}T${String(8 + (sequence % 12)).padStart(2, '0')}:30:00.000Z`,
      date,
      id: `${MOCK_LEDGER_PREFIX}${monthKey}-${String(sequence).padStart(4, '0')}`,
      note: scenario.note,
      type: scenario.type
    };

    records.push(record);
  };

  pushRecord(buildIncomeScenario(year, month), Math.min(10, maxDay), 1);

  if ((year + month) % 2 === 0) {
    pushRecord(optionalIncomeScenarios[(month + year) % optionalIncomeScenarios.length], Math.min(10, maxDay), 2);
  }

  if ((year + month) % 4 === 0) {
    pushRecord(optionalIncomeScenarios[2], Math.min(22, maxDay), 3);
  }

  const expenseSlots = Math.max(0, recordCount - records.length);

  Array.from({ length: expenseSlots }, (_, index) => {
    const scenario = expenseScenarios[(index * 5 + month + year) % expenseScenarios.length];
    const day = getDayForRecord(index, maxDay, month);

    pushRecord(scenario, day, index + 4);
  });

  return records;
}

export async function clearLedgerMockData() {
  const records = await ledgerRepository.getAllRecords();
  const nextRecords = records.filter((record) => !isMockRecord(record));
  const deletedCount = records.length - nextRecords.length;

  await ledgerRepository.saveAllRecords(nextRecords);

  return deletedCount;
}

export async function seedLedgerMockData() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const allRecords = await ledgerRepository.getAllRecords();
  const realRecords = allRecords.filter((record) => !isMockRecord(record));
  const monthTargets = [
    ...Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      year: currentYear - 1
    })),
    ...Array.from({ length: currentMonth }, (_, index) => ({
      month: index + 1,
      year: currentYear
    }))
  ];
  const mockRecords = monthTargets.flatMap(({ year, month }) => {
    const isCurrentMonth = year === currentYear && month === currentMonth;
    const maxDay = isCurrentMonth ? currentDay : new Date(year, month, 0).getDate();
    const recordCount = getMonthRecordCount(year, month, currentYear, currentMonth);

    return buildMonthlyMockRecords(year, month, recordCount, maxDay);
  });

  await ledgerRepository.saveAllRecords([...realRecords, ...mockRecords]);

  return mockRecords.length;
}
