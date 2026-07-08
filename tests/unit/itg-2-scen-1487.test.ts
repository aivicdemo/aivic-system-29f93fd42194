import { validateRegistrationDataQuality } from '../../src/logic/it-6-2-2-1';

describe('登録データ品質検証 - 部分的重複データの警告と続行処理', () => {
  test('SCEN-1487: 部分的に重複するデータ入力時に警告メッセージが表示され、ユーザー判断で続行可能である', () => {
    // 既に登録済みのデータ（参照データ）
    const existingData = {
      productCode: 'PROD-001',
      productSize: 'M',
      customerId: 'CUST-A001',
      registrationDate: '2024-01-10',
    };

    // 部分的に重複するデータ（同じ品番で異なるサイズ）
    const partiallyDuplicateInputData = {
      productCode: 'PROD-001', // 既存と同じ品番
      productSize: 'L', // 異なるサイズ
      customerId: 'CUST-A001', // 既存と同じ顧客
      registrationDate: '2024-01-15', // 異なる日付
    };

    // データ検証を実行
    const validationResult = validateRegistrationDataQuality(
      partiallyDuplicateInputData,
      [existingData]
    );

    // 期待結果: 警告が検出され、続行フラグが有効である
    expect(validationResult.hasWarning).toBe(true);
    expect(validationResult.warningMessage).toMatch(/部分的に重複/);
    expect(validationResult.canContinue).toBe(true);
    expect(validationResult.duplicateFields).toEqual([
      'productCode',
      'customerId',
    ]);
    expect(validationResult.conflictingFields).toEqual([
      'productSize',
      'registrationDate',
    ]);

    // ユーザーが「続行」を選択した場合、処理が中断されない
    const proceedResult = validateRegistrationDataQuality(
      partiallyDuplicateInputData,
      [existingData],
      { userChoice: 'continue' }
    );

    expect(proceedResult.isProcessContinued).toBe(true);
    expect(proceedResult.allowRegistration).toBe(true);
    expect(proceedResult.registrationStatus).toBe('completed');
    expect(proceedResult.newDataId).toBeDefined();
    expect(proceedResult.newDataId).toMatch(/REG-\d{6}/);

    // 登録データが正常に記録される
    expect(proceedResult.recordedData).toEqual({
      productCode: 'PROD-001',
      productSize: 'L',
      customerId: 'CUST-A001',
      registrationDate: '2024-01-15',
      registrationId: proceedResult.newDataId,
      registrationTimestamp: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      ),
      warningApplied: true,
      userConfirmation: true,
    });

    // 登録完了時に確認メッセージが表示される
    expect(proceedResult.completionMessage).toMatch(/正常に登録されました/);
  });
});