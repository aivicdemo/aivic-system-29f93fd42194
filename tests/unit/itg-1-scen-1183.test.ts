import { describe, test, expect } from "@jest/globals";
import { structureVerificationResultsAndSupportingMaterials } from "../../src/logic/it-1781935279444-2-2-1";

describe("検証結果と根拠資料の構造化整理機能", () => {
  test("SCEN-1183: 無効な判定内容が指定された場合、バリデーションエラーを返す", () => {
    // 前提: 検証結果と根拠資料の構造化整理機能へのアクセス権限がある状態
    // 発生条件: 無効な判定内容（null、空文字列、未定義の判定ステータス）を指定して検証リクエストを送信

    // ケース 1: 判定内容が null の場合
    const inputWithNullJudgment = {
      verification_id: "VER-20240115-001",
      judgment_result: null,
      supporting_materials: [
        {
          material_id: "MAT-001",
          material_type: "営業活動記録",
          reference_info: "顧客A との接触日時: 2024-01-10"
        }
      ],
      verification_timestamp: "2024-01-15T11:00:00Z"
    };

    expect(() =>
      structureVerificationResultsAndSupportingMaterials(inputWithNullJudgment)
    ).toThrow(/判定内容/);

    // ケース 2: 判定内容が空文字列の場合
    const inputWithEmptyJudgment = {
      verification_id: "VER-20240115-002",
      judgment_result: "",
      supporting_materials: [
        {
          material_id: "MAT-002",
          material_type: "契約書",
          reference_info: "契約書第3条: 請求ルール定義"
        }
      ],
      verification_timestamp: "2024-01-15T11:00:00Z"
    };

    expect(() =>
      structureVerificationResultsAndSupportingMaterials(inputWithEmptyJudgment)
    ).toThrow(/判定内容/);

    // ケース 3: 判定内容が未定義の判定ステータスの場合
    const inputWithInvalidStatus = {
      verification_id: "VER-20240115-003",
      judgment_result: "UNKNOWN_STATUS",
      supporting_materials: [
        {
          material_id: "MAT-003",
          material_type: "提案資料",
          reference_info: "提案資料: 割引ルール変更"
        }
      ],
      verification_timestamp: "2024-01-15T11:00:00Z"
    };

    expect(() =>
      structureVerificationResultsAndSupportingMaterials(inputWithInvalidStatus)
    ).toThrow(/判定ステータス/);

    // ケース 4: 正常系 - 有効な判定内容が指定された場合、エラーを返さない
    const inputWithValidJudgment = {
      verification_id: "VER-20240115-004",
      judgment_result: "正確",
      supporting_materials: [
        {
          material_id: "MAT-004",
          material_type: "営業活動記録",
          reference_info: "顧客B との成約日時: 2024-01-12"
        },
        {
          material_id: "MAT-005",
          material_type: "契約書",
          reference_info: "契約ID: CTR-20240101-001"
        }
      ],
      verification_timestamp: "2024-01-15T11:00:00Z"
    };

    const result = structureVerificationResultsAndSupportingMaterials(
      inputWithValidJudgment
    );

    expect(result).toEqual({
      verification_id: "VER-20240115-004",
      judgment_result: "正確",
      supporting_materials: [
        {
          material_id: "MAT-004",
          material_type: "営業活動記録",
          reference_info: "顧客B との成約日時: 2024-01-12"
        },
        {
          material_id: "MAT-005",
          material_type: "契約書",
          reference_info: "契約ID: CTR-20240101-001"
        }
      ],
      verification_timestamp: "2024-01-15T11:00:00Z",
      structured_status: "確定"
    });

    // ケース 5: 有効な判定内容「誤り」の場合
    const inputWithErrorJudgment = {
      verification_id: "VER-20240115-005",
      judgment_result: "誤り",
      supporting_materials: [
        {
          material_id: "MAT-006",
          material_type: "営業活動記録",
          reference_info: "営業データ: アポ数計算誤り"
        }
      ],
      verification_timestamp: "2024-01-15T11:00:00Z"
    };

    const resultWithError = structureVerificationResultsAndSupportingMaterials(
      inputWithErrorJudgment
    );

    expect(resultWithError).toEqual({
      verification_id: "VER-20240115-005",
      judgment_result: "誤り",
      supporting_materials: [
        {
          material_id: "MAT-006",
          material_type: "営業活動記録",
          reference_info: "営業データ: アポ数計算誤り"
        }
      ],
      verification_timestamp: "2024-01-15T11:00:00Z",
      structured_status: "要修正"
    });

    // ケース 6: 有効な判定内容「要確認」の場合
    const inputWithRequiresConfirmation = {
      verification_id: "VER-20240115-006",
      judgment_result: "要確認",
      supporting_materials: [
        {
          material_id: "MAT-007",
          material_type: "提案資料",
          reference_info: "提案資料バージョン確認必要"
        }
      ],
      verification_timestamp: "2024-01-15T11:00:00Z"
    };

    const resultRequiresConfirmation =
      structureVerificationResultsAndSupportingMaterials(
        inputWithRequiresConfirmation
      );

    expect(resultRequiresConfirmation).toEqual({
      verification_id: "VER-20240115-006",
      judgment_result: "要確認",
      supporting_materials: [
        {
          material_id: "MAT-007",
          material_type: "提案資料",
          reference_info: "提案資料バージョン確認必要"
        }
      ],
      verification_timestamp: "2024-01-15T11:00:00Z",
      structured_status: "確認待ち"
    });

    // ケース 7: 支援資料が空配列の場合でも、判定内容が有効なら処理継続
    const inputWithEmptySupportingMaterials = {
      verification_id: "VER-20240115-007",
      judgment_result: "正確",
      supporting_materials: [],
      verification_timestamp: "2024-01-15T11:00:00Z"
    };

    const resultEmptyMaterials =
      structureVerificationResultsAndSupportingMaterials(
        inputWithEmptySupportingMaterials
      );

    expect(resultEmptyMaterials).toEqual({
      verification_id: "VER-20240115-007",
      judgment_result: "正確",
      supporting_materials: [],
      verification_timestamp: "2024-01-15T11:00:00Z",
      structured_status: "確定"
    });
  });
});