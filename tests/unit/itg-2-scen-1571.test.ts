import { validateGuidelineDistribution } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-1571: 配信対象者が未指定の場合にバリデーションエラーが発生する', () => {
    // 配信対象者が未指定の状態でガイドライン配信を実行しようとする
    const guidelineData = {
      title: 'OCR精度向上ガイドライン',
      description: '過去案件データと物価本の更新基準',
      fileUrl: 'https://example.com/guideline.pdf',
      recipients: [], // 配信対象者が空
      distributionDate: new Date('2024-12-01T09:00:00Z'),
      createdBy: 'user-001'
    };

    // 配信対象者が未指定の場合、バリデーションエラーが発生する
    expect(() => validateGuidelineDistribution(guidelineData)).toThrow(/配信対象者/);
  });
});