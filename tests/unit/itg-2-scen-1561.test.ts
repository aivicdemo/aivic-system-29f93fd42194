import { registerKnowledgeBase } from '../../src/logic/it-6-3-1';

describe('ナレッジベース登録・分類体系化機能', () => {
  // SCEN-1561
  test('分類タグが未指定の場合にバリデーションエラーが発生する', () => {
    const input = {
      title: '査定部署での運用ガイドライン',
      content: 'OCR精度基準、判定ロジック、データ更新手順、異常対応フローを記載した運用マニュアル',
      description: '初期30名運用での3ヶ月間の実績ナレッジを体系化',
      classification_tags: []
    };

    expect(() => registerKnowledgeBase(input)).toThrow(/分類タグ/);
  });
});