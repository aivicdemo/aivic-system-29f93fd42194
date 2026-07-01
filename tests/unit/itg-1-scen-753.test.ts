import { validateMetadataCalculationLogic } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - 計算ロジック循環参照検出', () => {
  test('SCEN-753: メタデータの計算ロジックが循環参照を形成する場合、バリデーションエラーが発生する', () => {
    // セットアップ: メタデータA、B、Cを定義し、循環参照を形成させる
    const metadataA = {
      id: 'meta-001',
      name: 'メタデータA',
      dataType: 'number',
      unit: '件',
      calculationLogic: '=メタデータB',
      reportMapping: 'report_field_a',
    };

    const metadataB = {
      id: 'meta-002',
      name: 'メタデータB',
      dataType: 'number',
      unit: '件',
      calculationLogic: '=メタデータC',
      reportMapping: 'report_field_b',
    };

    const metadataC = {
      id: 'meta-003',
      name: 'メタデータC',
      dataType: 'number',
      unit: '件',
      calculationLogic: '=メタデータA',
      reportMapping: 'report_field_c',
    };

    // 全メタデータを参照可能な状態で循環参照チェック実行
    const allMetadata = [metadataA, metadataB, metadataC];

    // 期待結果: 循環参照が検出され、具体的なエラーメッセージが返される
    expect(() => {
      validateMetadataCalculationLogic(metadataA, allMetadata);
    }).toThrow(/循環参照/);

    // エラーメッセージの内容を詳細検証：参照チェーンの明示
    try {
      validateMetadataCalculationLogic(metadataA, allMetadata);
      fail('バリデーションエラーが発生すべき');
    } catch (error) {
      const errorMessage = (error as Error).message;
      expect(errorMessage).toMatch(/メタデータA/);
      expect(errorMessage).toMatch(/メタデータB/);
      expect(errorMessage).toMatch(/メタデータC/);
    }
  });
});