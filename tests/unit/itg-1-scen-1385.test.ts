import { validateAndTransformSalesDataFormat } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業システムとCRM間データ互換性検証機能', () => {
  // SCEN-1385
  test('データ形式の不整合が検出され、必要な変換ルールが明確化される', () => {
    // 初期状態: 営業システムから不正なデータ形式を持つサンプルレコード
    const invalidSalesRecord = {
      customer_id: 'CUST-001',
      customer_name: '  株式会社ABC  ',
      contact_date: '15/01/2024',
      appointment_count: '5',
      contract_amount: '¥100,000',
      service_type: 'service_A',
      status: 'APPROVED ',
    };

    // CRMの標準フォーマット仕様
    const crmStandardSpec = {
      customer_id: { type: 'string', pattern: '^CUST-\\d+$' },
      customer_name: { type: 'string', trim: true },
      contact_date: { type: 'date', format: 'YYYY-MM-DD' },
      appointment_count: { type: 'number', min: 0 },
      contract_amount: { type: 'number' },
      service_type: { type: 'string', enum: ['service_A', 'service_B', 'service_C'] },
      status: { type: 'string', enum: ['APPROVED', 'PENDING', 'REJECTED'], trim: true },
    };

    // ビジネスルール: データ形式の不整合を検出し、エラーメッセージと不整合詳細情報を確認
    const result = validateAndTransformSalesDataFormat(invalidSalesRecord, crmStandardSpec);

    // 不整合エラーが検出される
    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);

    // エラーメッセージに不整合内容が明確に記載されている
    const errorMessages = result.errors.map((err: any) => err.message);
    expect(errorMessages.some((msg: string) => msg.includes('contact_date'))).toBe(true);
    expect(errorMessages.some((msg: string) => msg.includes('DD/MM/YYYY'))).toBe(true);
    expect(errorMessages.some((msg: string) => msg.includes('YYYY-MM-DD'))).toBe(true);

    // エラー詳細情報の構造を検証
    const dateError = result.errors.find((err: any) => err.field === 'contact_date');
    expect(dateError).toBeDefined();
    expect(dateError.field).toBe('contact_date');
    expect(dateError.expectedFormat).toBe('YYYY-MM-DD');
    expect(dateError.actualFormat).toBe('DD/MM/YYYY');
    expect(dateError.actualValue).toBe('15/01/2024');

    // appointment_count が数値として認識されない不整合を検出
    const appointmentError = result.errors.find((err: any) => err.field === 'appointment_count');
    expect(appointmentError).toBeDefined();
    expect(appointmentError.expectedType).toBe('number');
    expect(appointmentError.actualType).toBe('string');
    expect(appointmentError.actualValue).toBe('5');

    // contract_amount の通貨記号と数値形式の不整合を検出
    const amountError = result.errors.find((err: any) => err.field === 'contract_amount');
    expect(amountError).toBeDefined();
    expect(amountError.expectedType).toBe('number');
    expect(amountError.actualValue).toBe('¥100,000');

    // status の末尾空白を検出
    const statusError = result.errors.find((err: any) => err.field === 'status');
    expect(statusError).toBeDefined();
    expect(statusError.actualValue).toBe('APPROVED ');

    // 必要なデータ変換ルールが自動生成されている
    expect(result.transformationRules).toBeDefined();
    expect(result.transformationRules.length).toBeGreaterThanOrEqual(4);

    // 日付形式変換ルール
    const dateTransformRule = result.transformationRules.find(
      (rule: any) => rule.field === 'contact_date' && rule.type === 'dateFormatConversion'
    );
    expect(dateTransformRule).toBeDefined();
    expect(dateTransformRule.sourceFormat).toBe('DD/MM/YYYY');
    expect(dateTransformRule.targetFormat).toBe('YYYY-MM-DD');
    expect(dateTransformRule.transformationLogic).toBe('parseDate(input, "DD/MM/YYYY") -> formatDate(output, "YYYY-MM-DD")');

    // 数値型変換ルール（appointment_count）
    const appointmentTransformRule = result.transformationRules.find(
      (rule: any) => rule.field === 'appointment_count' && rule.type === 'typeConversion'
    );
    expect(appointmentTransformRule).toBeDefined();
    expect(appointmentTransformRule.sourceType).toBe('string');
    expect(appointmentTransformRule.targetType).toBe('number');
    expect(appointmentTransformRule.transformationLogic).toBe('parseInt(input)');

    // 数値型変換ルール（contract_amount - 通貨記号と数値型）
    const amountTransformRule = result.transformationRules.find(
      (rule: any) => rule.field === 'contract_amount' && rule.type === 'currencyToNumber'
    );
    expect(amountTransformRule).toBeDefined();
    expect(amountTransformRule.currencySymbol).toBe('¥');
    expect(amountTransformRule.transformationLogic).toBe('removeSymbol("¥") -> removeComma(",") -> parseInt(input)');

    // 文字列トリミングルール（status）
    const statusTransformRule = result.transformationRules.find(
      (rule: any) => rule.field === 'status' && rule.type === 'stringTrim'
    );
    expect(statusTransformRule).toBeDefined();
    expect(statusTransformRule.transformationLogic).toBe('trim()');

    // 文字列トリミングルール（customer_name）
    const customerNameTransformRule = result.transformationRules.find(
      (rule: any) => rule.field === 'customer_name' && rule.type === 'stringTrim'
    );
    expect(customerNameTransformRule).toBeDefined();

    // 生成された変換ルールが正しく適用され、データが正常に変換される
    const transformedRecord = result.transformedData;
    expect(transformedRecord).toBeDefined();
    expect(transformedRecord.customer_id).toBe('CUST-001');
    expect(transformedRecord.customer_name).toBe('株式会社ABC'); // トリミング適用
    expect(transformedRecord.contact_date).toBe('2024-01-15'); // 日付形式変換適用
    expect(transformedRecord.appointment_count).toBe(5); // 数値型変換適用
    expect(transformedRecord.contract_amount).toBe(100000); // 通貨記号削除と数値型変換適用
    expect(transformedRecord.service_type).toBe('service_A');
    expect(transformedRecord.status).toBe('APPROVED'); // トリミング適用

    // 変換プロセスが完全に記録されている
    expect(result.transformationLog).toBeDefined();
    expect(result.transformationLog.length).toBeGreaterThanOrEqual(5);

    // 変換ログエントリの構造検証
    const dateTransformLog = result.transformationLog.find((log: any) => log.field === 'contact_date');
    expect(dateTransformLog).toBeDefined();
    expect(dateTransformLog.field).toBe('contact_date');
    expect(dateTransformLog.originalValue).toBe('15/01/2024');
    expect(dateTransformLog.transformedValue).toBe('2024-01-15');
    expect(dateTransformLog.appliedRule).toBe('dateFormatConversion');
    expect(dateTransformLog.timestamp).toBeDefined();
    expect(typeof dateTransformLog.timestamp).toBe('string');

    const appointmentTransformLog = result.transformationLog.find(
      (log: any) => log.field === 'appointment_count'
    );
    expect(appointmentTransformLog).toBeDefined();
    expect(appointmentTransformLog.originalValue).toBe('5');
    expect(appointmentTransformLog.transformedValue).toBe(5);
    expect(appointmentTransformLog.appliedRule).toBe('typeConversion');

    const amountTransformLog = result.transformationLog.find((log: any) => log.field === 'contract_amount');
    expect(amountTransformLog).toBeDefined();
    expect(amountTransformLog.originalValue).toBe('¥100,000');
    expect(amountTransformLog.transformedValue).toBe(100000);
    expect(amountTransformLog.appliedRule).toBe('currencyToNumber');

    const statusTransformLog = result.transformationLog.find((log: any) => log.field === 'status');
    expect(statusTransformLog).toBeDefined();
    expect(statusTransformLog.originalValue).toBe('APPROVED ');
    expect(statusTransformLog.transformedValue).toBe('APPROVED');
    expect(statusTransformLog.appliedRule).toBe('stringTrim');

    const customerNameTransformLog = result.transformationLog.find(
      (log: any) => log.field === 'customer_name'
    );
    expect(customerNameTransformLog).toBeDefined();
    expect(customerNameTransformLog.originalValue).toBe('  株式会社ABC  ');
    expect(customerNameTransformLog.transformedValue).toBe('株式会社ABC');
    expect(customerNameTransformLog.appliedRule).toBe('stringTrim');

    // ルールベース構築の検証
    expect(result.ruleBaseCreated).toBe(true);
    expect(result.ruleBaseId).toBeDefined();
    expect(typeof result.ruleBaseId).toBe('string');
  });
});