import { recordExplanationMaterialPresentation } from "../../src/logic/it-6-3-1";

describe("説明資料のゼネコン提示記録機能", () => {
  test("SCEN-1027: 部署長承認未完了の説明資料はゼネコン提示が拒否されエラーが返される", () => {
    const material_id = "MAT-20240115-001";
    const material_status = "未承認";
    const department_head_approval_status = "未完了";
    const presentation_date = "2024-01-15T14:00:00Z";
    const contractor_id = "GC-20240115-X001";

    const result = recordExplanationMaterialPresentation({
      material_id,
      material_status,
      department_head_approval_status,
      presentation_date,
      contractor_id,
    });

    expect(result.success).toBe(false);
    expect(result.error_code).toBe("APPROVAL_NOT_COMPLETED");
    expect(result.error_message).toBe(
      "部署長の承認が完了していないため、ゼネコンへの提示はできません"
    );
    expect(result.material_status_after).toBe("未承認");
    expect(result.presentation_recorded).toBe(false);
  });
});