import { validateAndNotifyQualityIssues } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-742: [normal] 営業データ品質確認と修正サイクル - 検出された不備データに対する修正指示が営業担当者に通知され、修正後のデータが再検証される
  test("不備データが検出され、修正指示が通知され、修正後のデータが再検証時に合格すること", () => {
    // === 初期状態: 不備を含むサンプルデータを営業データベースに登録 ===
    const defectiveData = {
      salesDataId: "SALES_001",
      customerId: "CUST_ABC",
      contactDate: "2024-01-15", // 必須項目
      contactContent: "", // 不備: 必須項目の欠落
      appointmentStatus: "confirmed",
      appointmentCount: 5,
      contractCount: 2,
      serviceType: "Standard",
      amount: 150000,
      inputStaffId: "STAFF_001",
      createdAt: new Date("2024-01-15T09:00:00Z"),
    };

    const defectiveData2 = {
      salesDataId: "SALES_002",
      customerId: "CUST_DEF",
      contactDate: "2024-01-16",
      contactContent: "商談実施",
      appointmentStatus: "invalid_status", // 不備: 形式エラー
      appointmentCount: -1, // 不備: 値の範囲外
      contractCount: 3,
      serviceType: "Premium",
      amount: 250000,
      inputStaffId: "STAFF_002",
      createdAt: new Date("2024-01-16T10:00:00Z"),
    };

    const defectiveData3 = {
      salesDataId: "SALES_003",
      customerId: "CUST_GHI",
      contactDate: "2024-01-17",
      contactContent: "初回面談",
      appointmentStatus: "pending",
      appointmentCount: 3,
      contractCount: 1,
      serviceType: "Standard",
      amount: "invalid_amount", // 不備: データ型不整合（文字列が渡されている）
      inputStaffId: "STAFF_003",
      createdAt: new Date("2024-01-17T11:00:00Z"),
    };

    // === Step 1: データ品質確認機能を実行し、不備データが検出されることを確認 ===
    const validationResult = validateAndNotifyQualityIssues({
      salesDataList: [defectiveData, defectiveData2, defectiveData3],
      validationRules: {
        requiredFields: ["contactContent", "appointmentStatus", "amount"],
        numericFields: ["appointmentCount", "contractCount", "amount"],
        appointmentStatusAllowedValues: ["confirmed", "pending", "rejected"],
        amountRange: { min: 0, max: 1000000 },
        appointmentCountRange: { min: 0, max: 1000 },
      },
      staffNotificationEndpoint: "https://api.example.com/notify",
    });

    // === Step 2: 不備データが正確に検出されていることを確認 ===
    expect(validationResult.defectiveRecords.length).toBe(3);

    // 不備レコード 1: 必須項目欠落（contactContent が空）
    const defect1 = validationResult.defectiveRecords.find(
      (r) => r.salesDataId === "SALES_001"
    );
    expect(defect1).toBeDefined();
    expect(defect1?.issues).toContain("必須項目欠落");
    expect(defect1?.defectiveFields).toContain("contactContent");
    expect(defect1?.status).toBe("detected");

    // 不備レコード 2: 形式エラー＋値の範囲外
    const defect2 = validationResult.defectiveRecords.find(
      (r) => r.salesDataId === "SALES_002"
    );
    expect(defect2).toBeDefined();
    expect(defect2?.issues).toContain("形式エラー");
    expect(defect2?.issues).toContain("値の範囲外");
    expect(defect2?.defectiveFields).toContain("appointmentStatus");
    expect(defect2?.defectiveFields).toContain("appointmentCount");
    expect(defect2?.status).toBe("detected");

    // 不備レコード 3: データ型不整合
    const defect3 = validationResult.defectiveRecords.find(
      (r) => r.salesDataId === "SALES_003"
    );
    expect(defect3).toBeDefined();
    expect(defect3?.issues).toContain("データ型不整合");
    expect(defect3?.defectiveFields).toContain("amount");
    expect(defect3?.status).toBe("detected");

    // === Step 3: 修正指示通知の内容を確認 ===
    expect(validationResult.notificationsSent.length).toBe(3);

    const notification1 = validationResult.notificationsSent.find(
      (n) => n.staffId === "STAFF_001"
    );
    expect(notification1).toBeDefined();
    expect(notification1?.message).toMatch(/必須項目欠落/);
    expect(notification1?.defectDetails).toContain("contactContent");
    expect(notification1?.correctionDeadline).toBe(
      new Date("2024-01-18T23:59:59Z").toISOString()
    );

    // === Step 4: 営業担当者が不備データを修正 ===
    const correctedData1 = {
      ...defectiveData,
      contactContent: "顧客との初回打ち合わせ実施", // 修正
      modifiedAt: new Date("2024-01-17T14:00:00Z"),
      modificationReason: "必須項目を入力しました",
    };

    const correctedData2 = {
      ...defectiveData2,
      appointmentStatus: "confirmed", // 修正: 正しい値に変更
      appointmentCount: 2, // 修正: 正の値に変更
      modifiedAt: new Date("2024-01-17T15:00:00Z"),
      modificationReason: "形式エラーと範囲外エラーを修正しました",
    };

    const correctedData3 = {
      ...defectiveData3,
      amount: 175000, // 修正: 数値型に修正
      modifiedAt: new Date("2024-01-17T16:00:00Z"),
      modificationReason: "データ型を修正しました",
    };

    // === Step 5: 修正済みデータを再検証 ===
    const revalidationResult = validateAndNotifyQualityIssues({
      salesDataList: [correctedData1, correctedData2, correctedData3],
      validationRules: {
        requiredFields: ["contactContent", "appointmentStatus", "amount"],
        numericFields: ["appointmentCount", "contractCount", "amount"],
        appointmentStatusAllowedValues: ["confirmed", "pending", "rejected"],
        amountRange: { min: 0, max: 1000000 },
        appointmentCountRange: { min: 0, max: 1000 },
      },
      staffNotificationEndpoint: "https://api.example.com/notify",
    });

    // === Step 6: 修正済みデータが品質チェックに合格していることを確認 ===
    expect(revalidationResult.passedRecords.length).toBe(3);
    expect(revalidationResult.defectiveRecords.length).toBe(0);

    const passedRecord1 = revalidationResult.passedRecords.find(
      (r) => r.salesDataId === "SALES_001"
    );
    expect(passedRecord1).toBeDefined();
    expect(passedRecord1?.status).toBe("passed");
    expect(passedRecord1?.validationTimestamp).toBeDefined();

    const passedRecord2 = revalidationResult.passedRecords.find(
      (r) => r.salesDataId === "SALES_002"
    );
    expect(passedRecord2).toBeDefined();
    expect(passedRecord2?.status).toBe("passed");

    const passedRecord3 = revalidationResult.passedRecords.find(
      (r) => r.salesDataId === "SALES_003"
    );
    expect(passedRecord3).toBeDefined();
    expect(passedRecord3?.status).toBe("passed");

    // === Step 7: 修正履歴とステータス変更が記録されていることを確認 ===
    expect(revalidationResult.modificationHistory.length).toBe(3);

    const history1 = revalidationResult.modificationHistory.find(
      (h) => h.salesDataId === "SALES_001"
    );
    expect(history1).toBeDefined();
    expect(history1?.originalStatus).toBe("detected");
    expect(history1?.newStatus).toBe("passed");
    expect(history1?.modifiedFields).toContain("contactContent");
    expect(history1?.modificationTimestamp).toBe(
      new Date("2024-01-17T14:00:00Z").toISOString()
    );
    expect(history1?.modificationReason).toBe(
      "必須項目を入力しました"
    );

    const history2 = revalidationResult.modificationHistory.find(
      (h) => h.salesDataId === "SALES_002"
    );
    expect(history2).toBeDefined();
    expect(history2?.modifiedFields).toContain("appointmentStatus");
    expect(history2?.modifiedFields).toContain("appointmentCount");

    // === Step 8: 修正完了通知が営業担当者に送信されていることを確認 ===
    expect(revalidationResult.completionNotificationsSent.length).toBe(3);

    const completionNotification1 = revalidationResult.completionNotificationsSent.find(
      (n) => n.staffId === "STAFF_001"
    );
    expect(completionNotification1).toBeDefined();
    expect(completionNotification1?.message).toMatch(/修正完了/);
    expect(completionNotification1?.approvalStatus).toBe("approved");
    expect(completionNotification1?.sentAt).toBeDefined();

    const completionNotification2 = revalidationResult.completionNotificationsSent.find(
      (n) => n.staffId === "STAFF_002"
    );
    expect(completionNotification2).toBeDefined();
    expect(completionNotification2?.approvalStatus).toBe("approved");

    const completionNotification3 = revalidationResult.completionNotificationsSent.find(
      (n) => n.staffId === "STAFF_003"
    );
    expect(completionNotification3).toBeDefined();
    expect(completionNotification3?.approvalStatus).toBe("approved");

    // === 総合検証: 品質確認と修正サイクルが正常に機能していることを確認 ===
    expect(revalidationResult.qualityCycleStatus).toBe("completed");
    expect(revalidationResult.allDataPassedValidation).toBe(true);
    expect(revalidationResult.totalProcessedRecords).toBe(3);
    expect(revalidationResult.totalCorrectedRecords).toBe(3);
    expect(revalidationResult.correctionRate).toBe(1.0); // 100%
  });
});