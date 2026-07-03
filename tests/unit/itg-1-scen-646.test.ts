import { detectAnomaliesAndGenerateCorrectionInstructions } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データの異常値検出・補正指示生成機能', () => {
  // SCEN-646
  test('営業データ内の異常値と漏れを検出し、補正指示が自動生成される', () => {
    // 意図的に異常値と漏れを含むテストデータ
    const salesData = {
      customerId: 'C001',
      contactDate: '2024-13-45', // 無効な日付形式
      appointmentCount: 5,
      contractCount: -2, // 負の数
      revenue: -50000, // 負の金額
      serviceType: '', // 必須項目の漏れ
      customerResponse: 'positive',
      notes: null, // 必須項目の漏れ
    };

    // データ検証機能を実行
    const result = detectAnomaliesAndGenerateCorrectionInstructions(salesData);

    // 異常値が検出されたことを確認
    expect(result.hasAnomalies).toBe(true);

    // 検出された異常の総数を確認
    expect(result.detectedIssues.length).toBe(5);

    // 異常値の詳細情報が含まれていることを確認
    const contactDateIssue = result.detectedIssues.find(
      (issue: any) => issue.fieldName === 'contactDate'
    );
    expect(contactDateIssue).toBeDefined();
    expect(contactDateIssue.issueType).toBe('invalid_format');
    expect(contactDateIssue.currentValue).toBe('2024-13-45');
    expect(contactDateIssue.recommendedValue).toMatch(/YYYY-MM-DD/);

    // 負の契約数の異常を確認
    const contractCountIssue = result.detectedIssues.find(
      (issue: any) => issue.fieldName === 'contractCount'
    );
    expect(contractCountIssue).toBeDefined();
    expect(contractCountIssue.issueType).toBe('negative_value');
    expect(contractCountIssue.currentValue).toBe(-2);
    expect(contractCountIssue.recommendedValue).toBe(0);

    // 負の金額の異常を確認
    const revenueIssue = result.detectedIssues.find(
      (issue: any) => issue.fieldName === 'revenue'
    );
    expect(revenueIssue).toBeDefined();
    expect(revenueIssue.issueType).toBe('negative_value');
    expect(revenueIssue.currentValue).toBe(-50000);
    expect(revenueIssue.recommendedValue).toBeGreaterThanOrEqual(0);

    // 漏れた項目（serviceType）の異常を確認
    const serviceTypeIssue = result.detectedIssues.find(
      (issue: any) => issue.fieldName === 'serviceType'
    );
    expect(serviceTypeIssue).toBeDefined();
    expect(serviceTypeIssue.issueType).toBe('missing_value');
    expect(serviceTypeIssue.currentValue).toBe('');

    // 漏れた項目（notes）の異常を確認
    const notesIssue = result.detectedIssues.find(
      (issue: any) => issue.fieldName === 'notes'
    );
    expect(notesIssue).toBeDefined();
    expect(notesIssue.issueType).toBe('missing_value');
    expect(notesIssue.currentValue).toBeNull();

    // 生成された補正指示を確認
    expect(result.correctionInstructions).toBeDefined();
    expect(result.correctionInstructions.length).toBeGreaterThan(0);

    // 補正指示に詳細情報が含まれていることを確認
    const instruction = result.correctionInstructions[0];
    expect(instruction.instructionId).toBeDefined();
    expect(instruction.fieldName).toBeDefined();
    expect(instruction.issueDescription).toBeDefined();
    expect(instruction.correctionAction).toBeDefined();
    expect(instruction.suggestedValue).toBeDefined();
    expect(instruction.priority).toMatch(/high|medium|low/);

    // 補正指示のステータスが「未対応」であることを確認
    expect(instruction.status).toBe('pending');

    // 各補正指示に対応期限が設定されていることを確認
    expect(instruction.dueDate).toBeDefined();
    const dueDate = new Date(instruction.dueDate);
    expect(dueDate.getTime()).toBeGreaterThan(new Date('2024-01-01').getTime());

    // 補正指示が優先度に基づいて整理されていることを確認
    const highPriorityCount = result.correctionInstructions.filter(
      (instr: any) => instr.priority === 'high'
    ).length;
    expect(highPriorityCount).toBeGreaterThan(0);

    // 生成された補正指示の総数が異常の総数と対応していることを確認
    expect(result.correctionInstructions.length).toBe(result.detectedIssues.length);

    // 補正指示の自動生成タイムスタンプが記録されていることを確認
    expect(result.generatedAt).toBeDefined();
    expect(new Date(result.generatedAt).getTime()).toBeLessThanOrEqual(
      new Date().getTime()
    );

    // システム全体の検証結果サマリーを確認
    expect(result.summary).toBeDefined();
    expect(result.summary.totalIssues).toBe(5);
    expect(result.summary.criticalIssues).toBeGreaterThanOrEqual(0);
    expect(result.summary.warningIssues).toBeGreaterThanOrEqual(0);
  });
});