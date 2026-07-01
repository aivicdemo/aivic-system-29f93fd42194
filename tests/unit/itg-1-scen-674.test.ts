import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質自動検証機能', () => {
  // SCEN-674: すべてのデータが検証ルール違反の場合、全件がエラーリストに含まれる
  test('すべてのレコードが検証ルール違反となる場合、全件がエラーリストに含まれ、各レコードの違反詳細が正確に記録されること', () => {
    // 検証ルール定義
    const validationRules = [
      {
        ruleId: 'RULE_001',
        ruleName: '顧客名必須',
        fieldName: 'customerName',
        condition: 'required',
        errorMessage: '顧客名は必須項目です',
      },
      {
        ruleId: 'RULE_002',
        ruleName: 'アポ数データ型',
        fieldName: 'appointmentCount',
        condition: 'dataType:number',
        errorMessage: 'アポ数は数値である必要があります',
      },
      {
        ruleId: 'RULE_003',
        ruleName: 'アポ数範囲',
        fieldName: 'appointmentCount',
        condition: 'range:0-1000',
        errorMessage: 'アポ数は0～1000の範囲である必要があります',
      },
      {
        ruleId: 'RULE_004',
        ruleName: '成約数データ型',
        fieldName: 'contractCount',
        condition: 'dataType:number',
        errorMessage: '成約数は数値である必要があります',
      },
      {
        ruleId: 'RULE_005',
        ruleName: '接触日時形式',
        fieldName: 'contactDate',
        condition: 'format:ISO8601',
        errorMessage: '接触日時はISO8601形式である必要があります',
      },
    ];

    // すべてのレコードが検証ルール違反となるテストデータセット
    const testDataSet = [
      {
        recordId: 'REC_001',
        customerName: '', // 必須項目欠落
        appointmentCount: 'invalid', // データ型不正
        contractCount: 'abc', // データ型不正
        contactDate: '2024/01/15', // 形式不正
      },
      {
        recordId: 'REC_002',
        customerName: null, // 必須項目欠落
        appointmentCount: 2000, // 範囲外（0-1000を超過）
        contractCount: 'xyz', // データ型不正
        contactDate: '15-01-2024', // 形式不正
      },
      {
        recordId: 'REC_003',
        customerName: '', // 必須項目欠落
        appointmentCount: -100, // 範囲外（0未満）
        contractCount: null, // データ型不正
        contactDate: 'invalid-date', // 形式不正
      },
    ];

    // 検証処理を実行
    const validationResult = validateSalesData(testDataSet, validationRules);

    // エラーリストが存在することを確認
    expect(validationResult).toBeDefined();
    expect(validationResult.errorList).toBeDefined();
    expect(Array.isArray(validationResult.errorList)).toBe(true);

    // エラーリストのレコード件数を確認
    // 3レコード × 複数違反ルール = 最小限全レコード以上が含まれる
    expect(validationResult.errorList.length).toBeGreaterThanOrEqual(
      testDataSet.length
    );

    // テストデータセット内のすべてのレコードがエラーリストに含まれていることを確認
    const errorRecordIds = validationResult.errorList.map(
      (err: any) => err.recordId
    );
    testDataSet.forEach((record: any) => {
      expect(errorRecordIds).toContain(record.recordId);
    });

    // 各レコードに対する違反ルール情報を検証
    const rec001Errors = validationResult.errorList.filter(
      (err: any) => err.recordId === 'REC_001'
    );
    expect(rec001Errors.length).toBeGreaterThanOrEqual(3); // customerName, appointmentCount, contactDate 違反
    expect(
      rec001Errors.some(
        (err: any) =>
          err.fieldName === 'customerName' && err.ruleId === 'RULE_001'
      )
    ).toBe(true);
    expect(
      rec001Errors.some(
        (err: any) =>
          err.fieldName === 'appointmentCount' && err.ruleId === 'RULE_002'
      )
    ).toBe(true);
    expect(
      rec001Errors.some(
        (err: any) =>
          err.fieldName === 'contactDate' && err.ruleId === 'RULE_005'
      )
    ).toBe(true);

    const rec002Errors = validationResult.errorList.filter(
      (err: any) => err.recordId === 'REC_002'
    );
    expect(rec002Errors.length).toBeGreaterThanOrEqual(4); // customerName, appointmentCount(range), contractCount, contactDate 違反
    expect(
      rec002Errors.some(
        (err: any) =>
          err.fieldName === 'appointmentCount' && err.ruleId === 'RULE_003'
      )
    ).toBe(true);
    expect(
      rec002Errors.some(
        (err: any) =>
          err.fieldName === 'contractCount' && err.ruleId === 'RULE_004'
      )
    ).toBe(true);

    const rec003Errors = validationResult.errorList.filter(
      (err: any) => err.recordId === 'REC_003'
    );
    expect(rec003Errors.length).toBeGreaterThanOrEqual(4); // customerName, appointmentCount(range), contractCount, contactDate 違反
    expect(
      rec003Errors.some(
        (err: any) =>
          err.fieldName === 'customerName' && err.ruleId === 'RULE_001'
      )
    ).toBe(true);
    expect(
      rec003Errors.some(
        (err: any) =>
          err.fieldName === 'appointmentCount' && err.ruleId === 'RULE_003'
      )
    ).toBe(true);

    // 各エラーレコードに違反ルール情報が記録されていることを確認
    validationResult.errorList.forEach((errorRecord: any) => {
      expect(errorRecord.recordId).toBeDefined();
      expect(errorRecord.fieldName).toBeDefined();
      expect(errorRecord.ruleId).toBeDefined();
      expect(errorRecord.ruleName).toBeDefined();
      expect(errorRecord.errorMessage).toBeDefined();
      expect(typeof errorRecord.errorMessage).toBe('string');
      expect(errorRecord.errorMessage.length).toBeGreaterThan(0);
    });

    // 検証結果の全体ステータスを確認
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.totalRecords).toBe(testDataSet.length);
    expect(validationResult.failedRecords).toBe(testDataSet.length);
    expect(validationResult.passedRecords).toBe(0);
  });
});