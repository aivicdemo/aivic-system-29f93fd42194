import { validateSalesDataIntegrity } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ完全性・正確性自動検証機能', () => {
  test('SCEN-1029: 複数の検証ルール違反が検出された場合、すべての違反が通知される', () => {
    // 準備: 複数の検証ルール違反を含む営業データレコード
    const salesDataWithViolations = {
      customer_id: '', // 違反1: 必須項目の欠落
      contact_date: '2024-13-45', // 違反2: データ型の不一致（無効な日付形式）
      deal_amount: -5000, // 違反3: 範囲外の値（負の金額）
      appointment_status: 'INVALID_STATUS', // 違反4: 無効な列挙値
      contact_method: 123, // 違反5: データ型不一致（数値が文字列であるべき）
      notes: null, // 違反6: 必須項目の欠落（nullは許容されない）
    };

    // 検証ルール定義
    const validationRules = [
      {
        rule_id: 'R001',
        field: 'customer_id',
        rule_type: 'required',
        error_message: '顧客ID',
      },
      {
        rule_id: 'R002',
        field: 'contact_date',
        rule_type: 'date_format',
        expected_format: 'YYYY-MM-DD',
        error_message: '接触日付形式',
      },
      {
        rule_id: 'R003',
        field: 'deal_amount',
        rule_type: 'range',
        min: 0,
        max: 999999999,
        error_message: '金額範囲',
      },
      {
        rule_id: 'R004',
        field: 'appointment_status',
        rule_type: 'enum',
        allowed_values: ['CONFIRMED', 'PENDING', 'CANCELLED'],
        error_message: 'ステータス値',
      },
      {
        rule_id: 'R005',
        field: 'contact_method',
        rule_type: 'data_type',
        expected_type: 'string',
        error_message: '連絡方法型',
      },
      {
        rule_id: 'R006',
        field: 'notes',
        rule_type: 'not_null',
        error_message: '備考',
      },
    ];

    // 検証プロセスの実行
    const validationResult = validateSalesDataIntegrity(
      salesDataWithViolations,
      validationRules
    );

    // 期待値の確定
    // 違反数: 6件すべてが検出されることを期待
    expect(validationResult.violations.length).toBe(6);

    // 違反1: 顧客IDが空文字列
    expect(validationResult.violations).toContainEqual(
      expect.objectContaining({
        rule_id: 'R001',
        field: 'customer_id',
        violation_type: 'required',
        message: expect.stringContaining('顧客ID'),
        severity: 'error',
      })
    );

    // 違反2: 接触日付の形式不正
    expect(validationResult.violations).toContainEqual(
      expect.objectContaining({
        rule_id: 'R002',
        field: 'contact_date',
        violation_type: 'date_format',
        message: expect.stringContaining('接触日付形式'),
        severity: 'error',
      })
    );

    // 違反3: 金額が負数
    expect(validationResult.violations).toContainEqual(
      expect.objectContaining({
        rule_id: 'R003',
        field: 'deal_amount',
        violation_type: 'range',
        message: expect.stringContaining('金額範囲'),
        severity: 'error',
      })
    );

    // 違反4: ステータス値が無効
    expect(validationResult.violations).toContainEqual(
      expect.objectContaining({
        rule_id: 'R004',
        field: 'appointment_status',
        violation_type: 'enum',
        message: expect.stringContaining('ステータス値'),
        severity: 'error',
      })
    );

    // 違反5: 連絡方法のデータ型不正
    expect(validationResult.violations).toContainEqual(
      expect.objectContaining({
        rule_id: 'R005',
        field: 'contact_method',
        violation_type: 'data_type',
        message: expect.stringContaining('連絡方法型'),
        severity: 'error',
      })
    );

    // 違反6: 備考がnull
    expect(validationResult.violations).toContainEqual(
      expect.objectContaining({
        rule_id: 'R006',
        field: 'notes',
        violation_type: 'not_null',
        message: expect.stringContaining('備考'),
        severity: 'error',
      })
    );

    // 全体的な検証結果の確認
    expect(validationResult.is_valid).toBe(false);
    expect(validationResult.total_violations).toBe(6);

    // 通知情報の確認: すべての違反が通知に含まれている
    const notificationPayload = validationResult.notification;
    expect(notificationPayload.violation_summary).toBe(
      '営業データの検証で6件の違反が検出されました'
    );

    expect(notificationPayload.detailed_violations).toBeDefined();
    expect(notificationPayload.detailed_violations.length).toBe(6);

    // 通知に含まれるすべての違反が準備したデータの違反と対応している
    const violationFieldsInNotification = notificationPayload.detailed_violations.map(
      (v: any) => v.field
    );
    expect(violationFieldsInNotification).toEqual(
      expect.arrayContaining([
        'customer_id',
        'contact_date',
        'deal_amount',
        'appointment_status',
        'contact_method',
        'notes',
      ])
    );

    // 通知フォーマットの適切性確認: 各違反の詳細情報が含まれている
    notificationPayload.detailed_violations.forEach((violation: any) => {
      expect(violation.field).toBeDefined();
      expect(violation.violation_type).toBeDefined();
      expect(violation.message).toBeDefined();
      expect(violation.severity).toBe('error');
      expect(violation.rule_id).toBeDefined();
    });

    // 通知の可読性確認: 違反メッセージがすべて文字列で有効
    expect(notificationPayload.readable_summary).toBeDefined();
    expect(typeof notificationPayload.readable_summary).toBe('string');
    expect(notificationPayload.readable_summary.length).toBeGreaterThan(0);
    expect(notificationPayload.readable_summary).toContain('顧客ID');
    expect(notificationPayload.readable_summary).toContain('接触日付形式');
    expect(notificationPayload.readable_summary).toContain('金額範囲');
  });
});