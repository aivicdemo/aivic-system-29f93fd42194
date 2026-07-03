import { describe, test, expect, beforeEach } from "@jest/globals";
import { evaluateStaffCompetency } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-922
  test("スタッフ情報が不完全または必須項目が欠落している場合、習熟度判定を実行せずエラーを返す", () => {
    // 必須項目: staffId, staffName, department, hireDate, trainingStatus
    // 習熟度判定に必要なすべての必須項目を含む正常系データ
    const validStaffData = {
      staffId: "STF001",
      staffName: "山田太郎",
      department: "営業部",
      hireDate: "2024-01-15",
      trainingStatus: "onboarding",
    };

    // 正常系: 習熟度判定が実行される
    const result_valid = evaluateStaffCompetency(validStaffData);
    expect(result_valid).toHaveProperty("competencyLevel");
    expect(result_valid).toHaveProperty("evaluationDate");
    expect(["beginner", "intermediate", "advanced"]).toContain(
      result_valid.competencyLevel
    );

    // 欠落テスト1: staffId が null
    const missing_staffId = {
      staffId: null,
      staffName: "山田太郎",
      department: "営業部",
      hireDate: "2024-01-15",
      trainingStatus: "onboarding",
    };
    expect(() => evaluateStaffCompetency(missing_staffId)).toThrow(/staffId/);

    // 欠落テスト2: staffName が空文字
    const missing_staffName = {
      staffId: "STF001",
      staffName: "",
      department: "営業部",
      hireDate: "2024-01-15",
      trainingStatus: "onboarding",
    };
    expect(() => evaluateStaffCompetency(missing_staffName)).toThrow(
      /staffName/
    );

    // 欠落テスト3: department が undefined
    const missing_department = {
      staffId: "STF001",
      staffName: "山田太郎",
      department: undefined,
      hireDate: "2024-01-15",
      trainingStatus: "onboarding",
    };
    expect(() => evaluateStaffCompetency(missing_department)).toThrow(
      /department/
    );

    // 欠落テスト4: hireDate が無効な形式
    const invalid_hireDate = {
      staffId: "STF001",
      staffName: "山田太郎",
      department: "営業部",
      hireDate: "invalid-date",
      trainingStatus: "onboarding",
    };
    expect(() => evaluateStaffCompetency(invalid_hireDate)).toThrow(/hireDate/);

    // 欠落テスト5: trainingStatus が無効な値
    const invalid_trainingStatus = {
      staffId: "STF001",
      staffName: "山田太郎",
      department: "営業部",
      hireDate: "2024-01-15",
      trainingStatus: "invalid_status",
    };
    expect(() => evaluateStaffCompetency(invalid_trainingStatus)).toThrow(
      /trainingStatus/
    );

    // 複数項目欠落テスト: staffName と department が欠落
    const multiple_missing = {
      staffId: "STF001",
      staffName: "",
      department: null,
      hireDate: "2024-01-15",
      trainingStatus: "onboarding",
    };
    expect(() => evaluateStaffCompetency(multiple_missing)).toThrow(
      /staffName|department/
    );

    // エラーオブジェクト形式の検証
    try {
      evaluateStaffCompetency(missing_staffId);
      fail("Expected error was not thrown");
    } catch (error) {
      expect(error).toHaveProperty("message");
      expect(error.message).toMatch(/staffId/);
    }
  });
});