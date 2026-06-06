import { determineDistributionDepartments } from '../../src/logic/it-1';

describe('製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能', () => {
  test('SCEN-360: 指示書配信先判定機能 - 未定義の製品種類が指定された場合にエラーが発生する', () => {
    expect(() => 
      determineDistributionDepartments(
        "UNKNOWN_TYPE",
        ["工程A", "工程B"],
        ["資材1", "資材2"],
        {
          "工程A": ["部署1"],
          "工程B": ["部署2"]
        }
      )
    ).toThrow(/製品/);
  });
});