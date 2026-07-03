import { describe, test, expect } from '@jest/globals';
import { validateValidationRuleVersionReference } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ版管理機能', () => {
  test('SCEN-1351: 検証ルール定義の変更が無効なバージョン参照を含む場合、エラーが発生する', () => {
    // 前提: 既存の検証ルール定義が存在し、バージョン参照フィールドを変更する状態
    // 手順: バージョン参照フィールドに存在しないバージョン番号を入力
    // 期待結果: 無効なバージョン参照を含む検証ルール定義の変更時に、適切なエラーが発生

    const validationRuleDefId = 'rule_001';
    const invalidVersionNumber = 9999; // 存在しないバージョン番号
    const availableVersions = [1, 2, 3, 4, 5]; // 実際に存在するバージョン番号

    const input = {
      validationRuleDefId,
      versionReference: invalidVersionNumber,
      availableVersionNumbers: availableVersions,
    };

    // 無効なバージョン参照を含む変更時にエラーが発生することを検証
    expect(() => validateValidationRuleVersionReference(input)).toThrow(/バージョン/);
  });
});