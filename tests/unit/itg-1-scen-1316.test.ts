import { validateBillingDataComparison } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1316: [edge] 請求データ自動検証 - 過去請求額と比較して30%以上の増減がある場合、差異理由が確認可能な状態で警告が記録される
  test('過去請求額との比較で30%以上の増減がある場合、差異理由を含む警告ログが記録される', () => {
    // テストケース1: 30%の増加（100,000円 → 130,000円）
    const result_increase = validateBillingDataComparison({
      previous_billing_amount: 100000,
      current_billing_amount: 130000,
      difference_reason: '契約内容変更により単価が10%上昇、利用量が20%増加',
    });

    expect(result_increase).toEqual({
      is_warning_recorded: true,
      warning_type: 'increase_30_percent',
      difference_percentage: 30,
      difference_reason: '契約内容変更により単価が10%上昇、利用量が20%増加',
      warning_message: expect.stringContaining('30%以上の増加'),
    });

    // テストケース2: 30%の減少（100,000円 → 70,000円）
    const result_decrease = validateBillingDataComparison({
      previous_billing_amount: 100000,
      current_billing_amount: 70000,
      difference_reason: '顧客からの値下げ交渉により契約変更',
    });

    expect(result_decrease).toEqual({
      is_warning_recorded: true,
      warning_type: 'decrease_30_percent',
      difference_percentage: -30,
      difference_reason: '顧客からの値下げ交渉により契約変更',
      warning_message: expect.stringContaining('30%以上の減少'),
    });

    // テストケース3: 差異理由が空白の場合（30%以上の変動あり）
    const result_no_reason = validateBillingDataComparison({
      previous_billing_amount: 100000,
      current_billing_amount: 135000,
      difference_reason: '',
    });

    expect(result_no_reason).toEqual({
      is_warning_recorded: false,
      warning_type: 'missing_difference_reason',
      difference_percentage: 35,
      difference_reason: '',
      warning_message: expect.stringContaining('差異理由'),
    });

    // テストケース4: 30%未満の増加（変動なし警告）
    const result_within_threshold = validateBillingDataComparison({
      previous_billing_amount: 100000,
      current_billing_amount: 125000,
      difference_reason: '通常の利用量変動',
    });

    expect(result_within_threshold).toEqual({
      is_warning_recorded: false,
      warning_type: 'within_threshold',
      difference_percentage: 25,
      difference_reason: '通常の利用量変動',
      warning_message: expect.stringContaining('閾値以内'),
    });

    // テストケース5: 増加パターンで差異理由が記録された確認
    const result_verified_reason = validateBillingDataComparison({
      previous_billing_amount: 50000,
      current_billing_amount: 70000,
      difference_reason: '新規サービス追加により40%の価格上昇',
    });

    expect(result_verified_reason).toEqual({
      is_warning_recorded: true,
      warning_type: 'increase_30_percent',
      difference_percentage: 40,
      difference_reason: '新規サービス追加により40%の価格上昇',
      warning_message: expect.stringContaining('警告記録'),
    });
    expect(result_verified_reason.difference_reason).not.toBe('');
    expect(result_verified_reason.difference_reason).toMatch(/新規サービス/);
  });
});