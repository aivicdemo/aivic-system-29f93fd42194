import { determineNextMonthStaffingNeed } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-967: 翌月応援要請の必要性判定 - 繁忙度予測が現員配置処理能力を20%超過する場合、応援要請が必須と判定される', () => {
    // 前提条件: 翌月の繁忙度予測データを20%超過する値で設定
    // 現員配置の処理能力を基準値として取得
    // 翌月繁忙度予測が現員配置処理能力の120%を超える状態

    // 設定値
    const current_staff_count = 30;
    const average_processing_time_per_case = 120; // 分
    const current_monthly_capacity = (current_staff_count * 20 * 8 * 60) / average_processing_time_per_case;
    // 現員配置処理能力 = (30人 × 20営業日 × 8時間/日 × 60分/時間) / 120分/件
    // = (30 × 20 × 8 × 60) / 120 = 2400件/月

    // 翌月繁忙度予測を20%超過する値で設定
    const next_month_predicted_cases = current_monthly_capacity * 1.2;
    // = 2400 × 1.2 = 2880件/月

    // 翌月の処理時間短縮率（現状の平均処理時間に対する改善率）
    const processing_time_improvement_rate = 0.0; // 改善なし（基準値）

    // 入力データ
    const input = {
      current_staff_count,
      average_processing_time_per_case,
      next_month_predicted_cases,
      processing_time_improvement_rate,
    };

    // ロジック実行
    const result = determineNextMonthStaffingNeed(input);

    // 期待結果の検証
    // 1. 応援要請フラグが『必須』と判定されること
    expect(result.support_request_required).toBe(true);

    // 2. 応援要請の理由に「超過」が含まれること
    expect(result.support_request_reason).toMatch(/超過/);

    // 3. 必要追加人員数の計算
    // 翌月必要人員 = 翌月予測件数 × 平均処理時間 / (営業日数 × 1日の総処理時間)
    // = 2880 × 120 / (20 × 480) = 345600 / 9600 = 36人
    const required_staff_count = Math.ceil(
      (next_month_predicted_cases * average_processing_time_per_case) /
        (20 * 8 * 60)
    );
    expect(result.required_staff_count).toBe(36);

    // 4. 必要応援人員数 = 必要人員数 - 現員人数
    const required_support_staff = required_staff_count - current_staff_count;
    expect(result.required_support_staff).toBe(6);

    // 5. 応援要請レベルの判定
    // 応援要請人員 / 現員人員 > 15% の場合 = 「高」
    const support_ratio = required_support_staff / current_staff_count;
    expect(support_ratio).toBeGreaterThan(0.15);
    expect(result.support_request_level).toBe('高');

    // 6. 複数の配置シナリオが提示されることを確認
    expect(result.staffing_scenarios).toBeDefined();
    expect(Array.isArray(result.staffing_scenarios)).toBe(true);
    expect(result.staffing_scenarios.length).toBeGreaterThan(1);

    // 7. 各配置シナリオに応援要請が必須であることが標記されていることを確認
    result.staffing_scenarios.forEach((scenario: any) => {
      expect(scenario.support_request_required).toBe(true);
    });

    // 8. 配置シナリオ選択画面に表示するメッセージ
    expect(result.display_message).toMatch(/応援要請が必須/);

    // 9. 繁忙度超過の判定確認
    expect(next_month_predicted_cases).toBeGreaterThan(
      current_monthly_capacity * 1.2
    );

    // 10. 全体的な結果構造の確認
    expect(result).toHaveProperty('support_request_required');
    expect(result).toHaveProperty('support_request_reason');
    expect(result).toHaveProperty('required_staff_count');
    expect(result).toHaveProperty('required_support_staff');
    expect(result).toHaveProperty('support_request_level');
    expect(result).toHaveProperty('staffing_scenarios');
    expect(result).toHaveProperty('display_message');
  });
});