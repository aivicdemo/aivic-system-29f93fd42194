import { describe, test, expect } from '@jest/globals';
import { generateCorrectionInstructions } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-707: [normal] 営業データ補正指示生成機能 - 複数の補正指示が必要な場合に優先度順に提示する
  test('複数の補正指示が優先度順に提示される', () => {
    const inputData = {
      recordId: 'REC-20240115-001',
      customerId: '',
      amount: -5000,
      transactionDate: '2024-13-45',
      serviceType: null,
      appointmentCount: 'abc',
      contractStatus: 'invalid_status',
      notes: ''
    };

    const result = generateCorrectionInstructions(inputData);

    expect(result).toEqual({
      recordId: 'REC-20240115-001',
      correctionInstructions: [
        {
          instructionId: 'INSTR-001',
          field: 'transactionDate',
          priority: 'high',
          priorityLevel: 1,
          issueType: '日付形式',
          currentValue: '2024-13-45',
          expectedFormat: 'YYYY-MM-DD',
          errorDescription: '日付が無効です',
          suggestedValue: null,
          displayOrder: 0
        },
        {
          instructionId: 'INSTR-002',
          field: 'amount',
          priority: 'high',
          priorityLevel: 1,
          issueType: '金額異常',
          currentValue: -5000,
          expectedFormat: '正の数値',
          errorDescription: '金額が負数です',
          suggestedValue: 5000,
          displayOrder: 1
        },
        {
          instructionId: 'INSTR-003',
          field: 'customerId',
          priority: 'high',
          priorityLevel: 1,
          issueType: '必須項目欠落',
          currentValue: '',
          expectedFormat: '文字列',
          errorDescription: '顧客IDが必須項目です',
          suggestedValue: null,
          displayOrder: 2
        },
        {
          instructionId: 'INSTR-004',
          field: 'appointmentCount',
          priority: 'medium',
          priorityLevel: 2,
          issueType: 'データ型不整合',
          currentValue: 'abc',
          expectedFormat: '数値',
          errorDescription: 'アポ数は数値である必要があります',
          suggestedValue: null,
          displayOrder: 3
        },
        {
          instructionId: 'INSTR-005',
          field: 'serviceType',
          priority: 'medium',
          priorityLevel: 2,
          issueType: '必須項目欠落',
          currentValue: null,
          expectedFormat: '文字列',
          errorDescription: 'サービス種別が必須項目です',
          suggestedValue: null,
          displayOrder: 4
        },
        {
          instructionId: 'INSTR-006',
          field: 'contractStatus',
          priority: 'low',
          priorityLevel: 3,
          issueType: '値の範囲外',
          currentValue: 'invalid_status',
          expectedFormat: 'active|inactive|pending',
          errorDescription: '契約ステータスが無効です',
          suggestedValue: null,
          displayOrder: 5
        }
      ],
      totalInstructionCount: 6,
      highPriorityCount: 3,
      mediumPriorityCount: 2,
      lowPriorityCount: 1,
      generatedAt: '2024-01-15T11:00:00Z',
      status: 'generated',
      isSorted: true,
      sortedByPriority: true
    });

    expect(result.correctionInstructions.length).toBe(6);
    expect(result.highPriorityCount).toBe(3);
    expect(result.mediumPriorityCount).toBe(2);
    expect(result.lowPriorityCount).toBe(1);
    expect(result.isSorted).toBe(true);
    expect(result.sortedByPriority).toBe(true);

    const priorities = result.correctionInstructions.map(instr => instr.priorityLevel);
    expect(priorities).toEqual([1, 1, 1, 2, 2, 3]);

    for (let i = 0; i < result.correctionInstructions.length - 1; i++) {
      const current = result.correctionInstructions[i];
      const next = result.correctionInstructions[i + 1];
      expect(current.priorityLevel).toBeLessThanOrEqual(next.priorityLevel);
    }

    const highPriorityInstructions = result.correctionInstructions.filter(
      instr => instr.priority === 'high'
    );
    expect(highPriorityInstructions.length).toBe(3);
    highPriorityInstructions.forEach(instr => {
      expect(instr.priorityLevel).toBe(1);
    });

    const mediumPriorityInstructions = result.correctionInstructions.filter(
      instr => instr.priority === 'medium'
    );
    expect(mediumPriorityInstructions.length).toBe(2);
    mediumPriorityInstructions.forEach(instr => {
      expect(instr.priorityLevel).toBe(2);
    });

    const lowPriorityInstructions = result.correctionInstructions.filter(
      instr => instr.priority === 'low'
    );
    expect(lowPriorityInstructions.length).toBe(1);
    lowPriorityInstructions.forEach(instr => {
      expect(instr.priorityLevel).toBe(3);
    });

    result.correctionInstructions.forEach((instr, index) => {
      expect(instr.displayOrder).toBe(index);
    });

    expect(result.status).toBe('generated');
    expect(result.recordId).toBe('REC-20240115-001');
  });
});