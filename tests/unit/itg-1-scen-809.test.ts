import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-809: [edge] 請求データ妥当性自動検証機能 - 営業成果データの一部が不足している場合、部分的な妥当性検証を実施し警告が表示される
  test('営業成果データの必須項目は存在するがオプション項目が不足する場合、警告ステータスで部分的に有効と判定され、検証が継続される', () => {
    // 必須項目は含むが、オプション項目（プロジェクトコード、部門コード）を除外した営業成果データ
    const salesDataWithMissingOptional = {
      customerId: 'CUST-001',
      customerName: '株式会社テスト',
      transactionDate: '2024-01-15',
      appointmentCount: 5,
      closureCount: 2,
      serviceType: 'consulting',
      // オプション項目を意図的に除外
      // projectCode: undefined,
      // departmentCode: undefined,
    };

    const result = validateSalesDataCompleteness(salesDataWithMissingOptional);

    // 検証結果の確認
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('PARTIAL_VALID');
    expect(result.warnings).toHaveLength(2);

    // 不足項目の詳細確認
    const missingProjectCodeWarning = result.warnings.find(
      (w) => w.fieldName === 'projectCode'
    );
    expect(missingProjectCodeWarning).toBeDefined();
    expect(missingProjectCodeWarning?.message).toMatch(/プロジェクトコード/);
    expect(missingProjectCodeWarning?.severity).toBe('WARNING');

    const missingDepartmentCodeWarning = result.warnings.find(
      (w) => w.fieldName === 'departmentCode'
    );
    expect(missingDepartmentCodeWarning).toBeDefined();
    expect(missingDepartmentCodeWarning?.message).toMatch(/部門コード/);
    expect(missingDepartmentCodeWarning?.severity).toBe('WARNING');

    // 警告メッセージの確認
    expect(result.uiMessage).toMatch(/警告/);
    expect(result.uiMessage).toContain('プロジェクトコード');
    expect(result.uiMessage).toContain('部門コード');

    // 処理継続の確認
    expect(result.shouldContinueProcessing).toBe(true);

    // レコードのステータス確認
    expect(result.recordStatus).toBe('PARTIAL_VALID');

    // 検証対象が処理されていることを確認
    expect(result.processedFields).toContain('customerId');
    expect(result.processedFields).toContain('customerName');
    expect(result.processedFields).toContain('transactionDate');
    expect(result.processedFields).toContain('appointmentCount');
    expect(result.processedFields).toContain('closureCount');
    expect(result.processedFields).toContain('serviceType');
  });
});