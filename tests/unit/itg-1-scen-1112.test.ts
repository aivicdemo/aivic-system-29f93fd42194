import { validateBusinessRulesAndClassifyExceptions } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証ルール定義・実行機能', () => {
  // SCEN-1112
  test('新入スタッフの実行結果から検出された例外ケースが優先度に基づいて正しく分類される', () => {
    // テストデータ: 新入スタッフ用営業データサンプル
    const staffExecutionResults = [
      {
        recordId: 'SALES_001',
        customerId: 'CUST_A',
        appointmentCount: 5,
        contractCount: 2,
        serviceType: 'TYPE_A',
        recordDate: '2024-01-15',
        amount: 50000,
        status: 'completed',
      },
      {
        recordId: 'SALES_002',
        customerId: 'CUST_B',
        appointmentCount: -1, // 異常値: 負数
        contractCount: 1,
        serviceType: 'TYPE_B',
        recordDate: '2024-01-16',
        amount: 75000,
        status: 'completed',
      },
      {
        recordId: 'SALES_003',
        customerId: '', // 異常値: 必須項目欠落
        appointmentCount: 3,
        contractCount: 0,
        serviceType: 'TYPE_A',
        recordDate: '2024-01-17',
        amount: 100000,
        status: 'pending',
      },
      {
        recordId: 'SALES_004',
        customerId: 'CUST_C',
        appointmentCount: 10,
        contractCount: 15, // 異常値: 商談数より成約数が多い矛盾
        serviceType: 'INVALID_TYPE', // 異常値: 無効なサービスタイプ
        recordDate: '2024-01-18',
        amount: 250000,
        status: 'completed',
      },
      {
        recordId: 'SALES_005',
        customerId: 'CUST_D',
        appointmentCount: 2,
        contractCount: 1,
        serviceType: 'TYPE_C',
        recordDate: 'invalid-date', // 異常値: 不正な日付フォーマット
        amount: -5000, // 異常値: 負の金額
        status: 'completed',
      },
    ];

    // 定義した検証ルール（優先度: 高、中、低）
    const validationRules = [
      {
        ruleId: 'RULE_HIGH_01',
        ruleName: '必須項目チェック',
        priority: 'HIGH',
        condition: 'customerId が空文字列である',
        checkFunction: (record: any) => record.customerId === '',
      },
      {
        ruleId: 'RULE_HIGH_02',
        ruleName: '金額有効性チェック',
        priority: 'HIGH',
        condition: 'amount が負数である',
        checkFunction: (record: any) => record.amount < 0,
      },
      {
        ruleId: 'RULE_MID_01',
        ruleName: '商談成約矛盾チェック',
        priority: 'MEDIUM',
        condition: 'contractCount が appointmentCount を超過している',
        checkFunction: (record: any) =>
          record.contractCount > record.appointmentCount,
      },
      {
        ruleId: 'RULE_MID_02',
        ruleName: '数値範囲チェック',
        priority: 'MEDIUM',
        condition: 'appointmentCount が負数である',
        checkFunction: (record: any) => record.appointmentCount < 0,
      },
      {
        ruleId: 'RULE_LOW_01',
        ruleName: 'サービスタイプ妥当性チェック',
        priority: 'LOW',
        condition: 'serviceType が有効なマスタに存在しない',
        checkFunction: (record: any) =>
          !['TYPE_A', 'TYPE_B', 'TYPE_C'].includes(record.serviceType),
      },
      {
        ruleId: 'RULE_LOW_02',
        ruleName: '日付フォーマットチェック',
        priority: 'LOW',
        condition: 'recordDate が YYYY-MM-DD フォーマットに合致しない',
        checkFunction: (record: any) =>
          !/^\d{4}-\d{2}-\d{2}$/.test(record.recordDate),
      },
    ];

    // 関数実行
    const result = validateBusinessRulesAndClassifyExceptions({
      staffResults: staffExecutionResults,
      rules: validationRules,
    });

    // assertion 1: 検出された例外ケースの総件数を確認
    expect(result.detectedExceptions.length).toBe(6);

    // assertion 2: 優先度『高』に分類された例外ケースの件数
    const highPriorityExceptions = result.detectedExceptions.filter(
      (ex: any) => ex.priority === 'HIGH'
    );
    expect(highPriorityExceptions.length).toBe(2);
    expect(highPriorityExceptions.map((ex: any) => ex.recordId).sort()).toEqual(
      ['SALES_003', 'SALES_005']
    );

    // assertion 3: 優先度『中』に分類された例外ケースの件数
    const mediumPriorityExceptions = result.detectedExceptions.filter(
      (ex: any) => ex.priority === 'MEDIUM'
    );
    expect(mediumPriorityExceptions.length).toBe(2);
    expect(mediumPriorityExceptions.map((ex: any) => ex.recordId).sort()).toEqual(
      ['SALES_002', 'SALES_004']
    );

    // assertion 4: 優先度『低』に分類された例外ケースの件数
    const lowPriorityExceptions = result.detectedExceptions.filter(
      (ex: any) => ex.priority === 'LOW'
    );
    expect(lowPriorityExceptions.length).toBe(2);
    expect(lowPriorityExceptions.map((ex: any) => ex.recordId).sort()).toEqual(
      ['SALES_004', 'SALES_005']
    );

    // assertion 5: 優先度別ソート順序を確認
    const priorityOrder = result.detectedExceptions.map(
      (ex: any) => ex.priority
    );
    const expectedOrder = [
      'HIGH',
      'HIGH',
      'MEDIUM',
      'MEDIUM',
      'LOW',
      'LOW',
    ];
    expect(priorityOrder).toEqual(expectedOrder);

    // assertion 6: 各例外ケースの詳細情報と対応するルール条件の合致を検証
    const exception_SALES_003 = result.detectedExceptions.find(
      (ex: any) => ex.recordId === 'SALES_003'
    );
    expect(exception_SALES_003.priority).toBe('HIGH');
    expect(exception_SALES_003.violatedRuleIds).toContain('RULE_HIGH_01');
    expect(exception_SALES_003.description).toMatch(/customerId/);

    const exception_SALES_005 = result.detectedExceptions.find(
      (ex: any) => ex.recordId === 'SALES_005'
    );
    expect(exception_SALES_005.priority).toBe('HIGH');
    expect(exception_SALES_005.violatedRuleIds).toContain('RULE_HIGH_02');
    expect(exception_SALES_005.violatedRuleIds).toContain('RULE_LOW_02');
    expect(exception_SALES_005.description).toMatch(/amount|recordDate/);

    const exception_SALES_002 = result.detectedExceptions.find(
      (ex: any) => ex.recordId === 'SALES_002'
    );
    expect(exception_SALES_002.priority).toBe('MEDIUM');
    expect(exception_SALES_002.violatedRuleIds).toContain('RULE_MID_02');

    const exception_SALES_004 = result.detectedExceptions.find(
      (ex: any) => ex.recordId === 'SALES_004'
    );
    expect(exception_SALES_004.priority).toBe('MEDIUM');
    expect(exception_SALES_004.violatedRuleIds).toContain('RULE_MID_01');
    expect(exception_SALES_004.violatedRuleIds).toContain('RULE_LOW_01');

    // assertion 7: 優先度別の分類結果が後続処理へ正しく連携されるか確認
    expect(result.priorityClassification.HIGH.count).toBe(2);
    expect(result.priorityClassification.HIGH.recordIds).toEqual(
      ['SALES_003', 'SALES_005']
    );

    expect(result.priorityClassification.MEDIUM.count).toBe(2);
    expect(result.priorityClassification.MEDIUM.recordIds).toEqual(
      ['SALES_002', 'SALES_004']
    );

    expect(result.priorityClassification.LOW.count).toBe(2);
    expect(result.priorityClassification.LOW.recordIds).toEqual(
      ['SALES_004', 'SALES_005']
    );

    // assertion 8: 処理結果が成功状態であることを確認
    expect(result.processStatus).toBe('success');
    expect(result.totalRecordsProcessed).toBe(5);
    expect(result.totalExceptionsDetected).toBe(6);
    expect(result.readyForBillingProcessing).toBe(false); // 例外があるため請求処理へは進まない

    // assertion 9: 各例外ケースが複数ルール違反の場合、すべての違反ルール ID が記録されているか確認
    const multiViolationExceptions = result.detectedExceptions.filter(
      (ex: any) => ex.violatedRuleIds.length > 1
    );
    expect(multiViolationExceptions.length).toBe(2); // SALES_004 と SALES_005
    multiViolationExceptions.forEach((ex: any) => {
      expect(Array.isArray(ex.violatedRuleIds)).toBe(true);
      expect(ex.violatedRuleIds.length).toBeGreaterThan(1);
    });

    // assertion 10: 例外ケース分類結果のメタデータが完全であることを確認
    expect(result.classificationTimestamp).toBeDefined();
    expect(result.classificationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.rulesetVersion).toBe(validationRules.length);
  });
});