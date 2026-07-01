import { detectDeprecatedMaterial } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 非推奨版資料の自動検出・警告機能", () => {
  // SCEN-784
  test("営業担当者が旧バージョン資料を選択しようとした場合、警告表示またはロックが実行される", () => {
    // Arrange
    const customerId = "CUST-001";
    const proposalId = "PROP-2024-001";
    const selectedMaterialId = "MAT-OLD-001";

    const availableMaterials = [
      {
        materialId: "MAT-OLD-001",
        version: 1,
        fileName: "proposal_v1.pdf",
        createdAt: new Date("2023-06-15T10:00:00Z"),
        isDeprecated: true,
        status: "deprecated",
      },
      {
        materialId: "MAT-LATEST-001",
        version: 3,
        fileName: "proposal_v3.pdf",
        createdAt: new Date("2024-01-20T14:30:00Z"),
        isDeprecated: false,
        status: "active",
      },
      {
        materialId: "MAT-OLD-002",
        version: 2,
        fileName: "proposal_v2.pdf",
        createdAt: new Date("2023-11-10T09:15:00Z"),
        isDeprecated: true,
        status: "deprecated",
      },
    ];

    const detectionConfig = {
      enforceLatestVersion: true,
      showWarningDialog: true,
      lockDeprecatedMaterials: true,
    };

    // Act
    const detectionResult = detectDeprecatedMaterial({
      customerId: customerId,
      proposalId: proposalId,
      selectedMaterialId: selectedMaterialId,
      availableMaterials: availableMaterials,
      config: detectionConfig,
    });

    // Assert - 非推奨版資料が正しく検出されている
    expect(detectionResult.isDeprecated).toBe(true);
    expect(detectionResult.selectedMaterial.version).toBe(1);
    expect(detectionResult.selectedMaterial.status).toBe("deprecated");

    // Assert - ロック状態が有効
    expect(detectionResult.isLocked).toBe(true);

    // Assert - 警告メッセージが含まれている
    expect(detectionResult.warningMessage).toMatch(/旧バージョン/);
    expect(detectionResult.warningMessage).toMatch(/最新版/);

    // Assert - 推奨される最新版資料が正しく特定されている
    expect(detectionResult.recommendedMaterial).toBeDefined();
    expect(detectionResult.recommendedMaterial?.materialId).toBe(
      "MAT-LATEST-001"
    );
    expect(detectionResult.recommendedMaterial?.version).toBe(3);
    expect(detectionResult.recommendedMaterial?.isDeprecated).toBe(false);

    // Assert - 非推奨版資料一覧に旧バージョンが含まれている
    expect(detectionResult.deprecatedMaterials.length).toBe(2);
    expect(
      detectionResult.deprecatedMaterials.some(
        (m) => m.materialId === "MAT-OLD-001"
      )
    ).toBe(true);
    expect(
      detectionResult.deprecatedMaterials.some(
        (m) => m.materialId === "MAT-OLD-002"
      )
    ).toBe(true);

    // Assert - ユーザーアクション（選択操作）が阻止される
    expect(detectionResult.allowSelection).toBe(false);

    // Assert - 理由・推奨資料・代替案情報が構造化されている
    expect(detectionResult.reason).toMatch(/非推奨/);
    expect(detectionResult.actionRequired).toBe("switchToLatestVersion");
    expect(detectionResult.switchTarget?.materialId).toBe("MAT-LATEST-001");
    expect(detectionResult.switchTarget?.switchReason).toMatch(/品質向上/);

    // Assert - ロック時刻とロック理由がタイムスタンプ付きで記録される
    expect(detectionResult.lockedAt).toBeDefined();
    expect(typeof detectionResult.lockedAt).toBe("string");
    expect(detectionResult.lockReason).toMatch(/非推奨版/);

    // Assert - ダイアログ表示設定が正しく反映されている
    expect(detectionResult.displayWarningDialog).toBe(true);
    expect(detectionResult.dialogTitle).toMatch(/注意/);
    expect(detectionResult.dialogMessage).toMatch(/最新版を使用してください/);

    // Assert - ビジネス要件: 営業担当者への切り替え促進メッセージが明確
    expect(detectionResult.userPromptMessage).toBeDefined();
    expect(detectionResult.userPromptMessage).toMatch(/切り替え/);
  });
});