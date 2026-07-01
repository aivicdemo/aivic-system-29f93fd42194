import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質チェック結果表示機能', () => {
  // SCEN-703: [normal] 営業データ品質チェック結果表示機能 - エラー件数・エラー内容・対象項目を構造化して表示する
  test('複数のエラーを含む営業データの品質チェック結果が構造化フォーマットで表示される', () => {
    const salesDataWithErrors = [
      {
        recordId: 'REC001',
        customerName: '',
        contactDate: '2024-01-15',
        dealAmount: 100000,
        appointmentStatus: 'confirmed',
      },
      {
        recordId: 'REC002',
        customerName: '株式会社A',
        contactDate: 'invalid-date',
        dealAmount: -50000,
        appointmentStatus: 'confirmed',
      },
      {
        recordId: 'REC003',
        customerName: '株式会社B',
        contactDate: '2024-01-20',
        dealAmount: 200000,
        appointmentStatus: 'unknown_status',
      },
      {
        recordId: 'REC004',
        customerName: '株式会社C',
        contactDate: '2024-01-25',
        dealAmount: 150000,
        appointmentStatus: 'confirmed',
      },
    ];

    const result = validateSalesDataQuality(salesDataWithErrors);

    // 総エラー件数が正確に表示される: REC001は必須項目欠落、REC002は日付形式と金額異常値、REC003はステータス値異常 = 5件
    expect(result.totalErrorCount).toBe(5);

    // エラー情報が構造化されたフォーマット（配列）で返される
    expect(Array.isArray(result.errors)).toBe(true);

    // 各エラーの詳細内容と対象項目が明確に含まれている
    const errorMessages = result.errors.map((err: any) => err.message);
    const errorFields = result.errors.map((err: any) => err.field);
    const errorRecords = result.errors.map((err: any) => err.recordId);

    // REC001: customerName が必須フィールド欠落
    expect(errorMessages).toContain(expect.stringMatching(/必須項目/));
    expect(errorFields).toContain('customerName');
    expect(errorRecords).toContain('REC001');

    // REC002: contactDate が日付形式不正
    expect(errorMessages).toContain(expect.stringMatching(/日付形式/));
    expect(errorFields).toContain('contactDate');
    expect(errorRecords).toContain('REC002');

    // REC002: dealAmount が負の金額（異常値）
    expect(errorMessages).toContain(expect.stringMatching(/金額範囲/));
    expect(errorFields).toContain('dealAmount');
    expect(errorRecords).toContain('REC002');

    // REC003: appointmentStatus が値の範囲外
    expect(errorMessages).toContain(expect.stringMatching(/ステータス値/));
    expect(errorFields).toContain('appointmentStatus');
    expect(errorRecords).toContain('REC003');

    // エラー情報が視認性の高い形式で整理されている: 各エラーオブジェクトが必須フィールドを持つ
    result.errors.forEach((error: any) => {
      expect(error).toHaveProperty('recordId');
      expect(error).toHaveProperty('field');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('severity');
      expect(['error', 'warning']).toContain(error.severity);
    });

    // 複数のエラーがある場合、それぞれが区別可能な形式で表示される
    const rec001Errors = result.errors.filter((err: any) => err.recordId === 'REC001');
    const rec002Errors = result.errors.filter((err: any) => err.recordId === 'REC002');
    const rec003Errors = result.errors.filter((err: any) => err.recordId === 'REC003');

    expect(rec001Errors.length).toBeGreaterThan(0);
    expect(rec002Errors.length).toBeGreaterThan(0);
    expect(rec003Errors.length).toBeGreaterThan(0);

    // ユーザーがエラーを容易に特定し、対応できる状態で表示されている
    // (構造化された情報で recordId, field, message が揃っている)
    expect(result.errors.length).toBe(result.totalErrorCount);
    expect(result.qualityStatus).toBe('fail');
  });
});