import { validateImprovementPlan } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-1482: 改善計画妥当性自動検証 - 必須項目欠落時に却下判定を返す', () => {
    const improvement_plan = {
      plan_name: '',
      responsible_person: '田中太郎',
      deadline: '2024-02-29',
      concrete_content: 'OCRモデルの再学習を実施し、精度を現在の75%から85%に改善する'
    };

    const result = validateImprovementPlan(improvement_plan);

    expect(result.status).toBe('rejected');
    expect(result.error_message).toMatch(/計画名/);
    expect(result.missing_fields).toContain('plan_name');
  });
});