import { validateSalesAchievementData } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1199: [error] 営業成果データ変更の自動検知・登録機能 - 変更内容が不正な値である場合、登録がブロックされエラーが返される
  test('不正な営業成果金額値をバリデーションしてエラーを返す', () => {
    // ハッピーパス: 正常な営業成果データ
    const validData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 5,
      contractCount: 2,
      salesAmount: 150000,
      customerFeedback: 'positive',
      recordDate: '2024-01-15'
    };
    
    const validResult = validateSalesAchievementData(validData);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toEqual([]);

    // エラーケース: 負の数値を営業成果金額に入力
    const negativeAmountData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 5,
      contractCount: 2,
      salesAmount: -150000,
      customerFeedback: 'positive',
      recordDate: '2024-01-15'
    };
    
    expect(() => validateSalesAchievementData(negativeAmountData)).toThrow(/金額/);

    // エラーケース: 特殊文字を営業成果金額に入力
    const specialCharData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 5,
      contractCount: 2,
      salesAmount: '150000@#$' as any,
      customerFeedback: 'positive',
      recordDate: '2024-01-15'
    };
    
    expect(() => validateSalesAchievementData(specialCharData)).toThrow(/金額/);

    // エラーケース: 空文字を営業成果金額に入力
    const emptyAmountData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 5,
      contractCount: 2,
      salesAmount: '' as any,
      customerFeedback: 'positive',
      recordDate: '2024-01-15'
    };
    
    expect(() => validateSalesAchievementData(emptyAmountData)).toThrow(/金額/);

    // エラーケース: null値
    const nullAmountData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 5,
      contractCount: 2,
      salesAmount: null as any,
      customerFeedback: 'positive',
      recordDate: '2024-01-15'
    };
    
    expect(() => validateSalesAchievementData(nullAmountData)).toThrow(/金額/);

    // エラーケース: 必須フィールド欠落
    const missingFieldData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 5,
      contractCount: 2,
      // salesAmount フィールド欠落
      customerFeedback: 'positive',
      recordDate: '2024-01-15'
    };
    
    expect(() => validateSalesAchievementData(missingFieldData as any)).toThrow(/必須/);

    // エラーケース: 無効な日付形式
    const invalidDateData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 5,
      contractCount: 2,
      salesAmount: 150000,
      customerFeedback: 'positive',
      recordDate: '2024-13-45'
    };
    
    expect(() => validateSalesAchievementData(invalidDateData)).toThrow(/日付/);

    // ハッピーパス: 許容可能な最小値
    const minAmountData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 0,
      contractCount: 0,
      salesAmount: 0,
      customerFeedback: 'neutral',
      recordDate: '2024-01-15'
    };
    
    const minResult = validateSalesAchievementData(minAmountData);
    expect(minResult.isValid).toBe(true);
    expect(minResult.errors).toEqual([]);

    // ハッピーパス: 大きな値
    const largeAmountData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 100,
      contractCount: 50,
      salesAmount: 9999999,
      customerFeedback: 'positive',
      recordDate: '2024-01-15'
    };
    
    const largeResult = validateSalesAchievementData(largeAmountData);
    expect(largeResult.isValid).toBe(true);
    expect(largeResult.errors).toEqual([]);

    // エラーケース: appointmentCount が負数
    const negativeAppointmentData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: -5,
      contractCount: 2,
      salesAmount: 150000,
      customerFeedback: 'positive',
      recordDate: '2024-01-15'
    };
    
    expect(() => validateSalesAchievementData(negativeAppointmentData)).toThrow(/アポ数/);

    // エラーケース: contractCount が負数
    const negativeContractData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 5,
      contractCount: -2,
      salesAmount: 150000,
      customerFeedback: 'positive',
      recordDate: '2024-01-15'
    };
    
    expect(() => validateSalesAchievementData(negativeContractData)).toThrow(/成約数/);

    // ハッピーパス: 複数のフィードバック種別が許容される
    const feedbackNegativeData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 5,
      contractCount: 2,
      salesAmount: 150000,
      customerFeedback: 'negative',
      recordDate: '2024-01-15'
    };
    
    const feedbackResult = validateSalesAchievementData(feedbackNegativeData);
    expect(feedbackResult.isValid).toBe(true);
    expect(feedbackResult.errors).toEqual([]);

    // エラーケース: 無効な customerFeedback 値
    const invalidFeedbackData = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      appointmentCount: 5,
      contractCount: 2,
      salesAmount: 150000,
      customerFeedback: 'invalid_feedback',
      recordDate: '2024-01-15'
    };
    
    expect(() => validateSalesAchievementData(invalidFeedbackData)).toThrow(/フィードバック/);
  });
});