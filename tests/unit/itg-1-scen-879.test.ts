import { calculateContractChangeVerificationDeadline } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-879: [error] 契約変更検証完了期限の自動計算 - 検証対象契約データが不完全な場合、期限計算が失敗し適切なエラーが返される
  test("不完全な契約データを入力すると、期限計算が失敗し適切なエラーが返される", () => {
    // テストデータ: 必須項目が欠落している契約データ
    const incompleteContractData = {
      contract_id: "CTR-20240115-001",
      customer_id: "CST-20240115-001",
      // contract_type が欠落（必須項目）
      contract_start_date: "2024-01-15",
      // contract_end_date が欠落（必須項目）
      service_name: "営業代行サービス",
    };

    // エラーテスト: 必須項目が欠落していることを検出
    expect(() =>
      calculateContractChangeVerificationDeadline(incompleteContractData as any)
    ).toThrow(/contract_type/);
  });

  test("複数の必須項目が欠落している場合、最初に検出された欠落項目に関するエラーが返される", () => {
    // テストデータ: 複数の必須項目が欠落
    const contractDataMissingMultipleFields = {
      contract_id: "CTR-20240115-002",
      // customer_id が欠落
      // contract_type が欠落
      contract_start_date: "2024-01-15",
      contract_end_date: "2024-12-31",
    };

    // 複数の欠落があっても、1 つのエラーを返す
    expect(() =>
      calculateContractChangeVerificationDeadline(
        contractDataMissingMultipleFields as any
      )
    ).toThrow(/customer_id|contract_type/);
  });

  test("契約開始日が無効な形式の場合、期限計算が失敗しエラーが返される", () => {
    // テストデータ: 無効な日付形式
    const contractDataInvalidDate = {
      contract_id: "CTR-20240115-003",
      customer_id: "CST-20240115-003",
      contract_type: "基本契約",
      contract_start_date: "2024-13-45", // 無効な日付
      contract_end_date: "2024-12-31",
      service_name: "営業代行サービス",
    };

    expect(() =>
      calculateContractChangeVerificationDeadline(contractDataInvalidDate as any)
    ).toThrow(/contract_start_date|日付/);
  });

  test("有効な契約データを入力すると、検証完了期限が正確に計算されて返される", () => {
    // テストデータ: 完全で有効な契約データ
    const completeContractData = {
      contract_id: "CTR-20240115-004",
      customer_id: "CST-20240115-004",
      contract_type: "基本契約",
      contract_start_date: "2024-01-15",
      contract_end_date: "2024-12-31",
      service_name: "営業代行サービス",
      last_change_date: "2024-01-14",
    };

    const result = calculateContractChangeVerificationDeadline(
      completeContractData
    );

    // 期限計算ロジック: 契約変更通知受領日から営業日ベース1営業日以内に検証完了
    // 2024-01-15 が月曜日なので、検証完了期限は 2024-01-15（その日中）
    expect(result).toEqual({
      contract_id: "CTR-20240115-004",
      verification_deadline: "2024-01-15",
      verification_deadline_time: "17:00:00",
      status: "deadline_calculated",
    });
  });

  test("契約終了日が契約開始日より前の場合、期限計算が失敗しエラーが返される", () => {
    // テストデータ: 終了日が開始日より前
    const contractDataInvalidDateRange = {
      contract_id: "CTR-20240115-005",
      customer_id: "CST-20240115-005",
      contract_type: "基本契約",
      contract_start_date: "2024-12-31",
      contract_end_date: "2024-01-15", // 開始日より前
      service_name: "営業代行サービス",
    };

    expect(() =>
      calculateContractChangeVerificationDeadline(
        contractDataInvalidDateRange as any
      )
    ).toThrow(/contract_end_date|開始日/);
  });

  test("契約 ID が空文字列または null の場合、期限計算が失敗しエラーが返される", () => {
    // テストデータ: 契約 ID が null
    const contractDataNullContractId = {
      contract_id: null,
      customer_id: "CST-20240115-006",
      contract_type: "基本契約",
      contract_start_date: "2024-01-15",
      contract_end_date: "2024-12-31",
      service_name: "営業代行サービス",
    };

    expect(() =>
      calculateContractChangeVerificationDeadline(
        contractDataNullContractId as any
      )
    ).toThrow(/contract_id/);
  });

  test("顧客 ID が空文字列の場合、期限計算が失敗しエラーが返される", () => {
    // テストデータ: 顧客 ID が空
    const contractDataEmptyCustomerId = {
      contract_id: "CTR-20240115-007",
      customer_id: "",
      contract_type: "基本契約",
      contract_start_date: "2024-01-15",
      contract_end_date: "2024-12-31",
      service_name: "営業代行サービス",
    };

    expect(() =>
      calculateContractChangeVerificationDeadline(
        contractDataEmptyCustomerId as any
      )
    ).toThrow(/customer_id/);
  });

  test("契約タイプが空文字列の場合、期限計算が失敗しエラーが返される", () => {
    // テストデータ: 契約タイプが空
    const contractDataEmptyContractType = {
      contract_id: "CTR-20240115-008",
      customer_id: "CST-20240115-008",
      contract_type: "",
      contract_start_date: "2024-01-15",
      contract_end_date: "2024-12-31",
      service_name: "営業代行サービス",
    };

    expect(() =>
      calculateContractChangeVerificationDeadline(
        contractDataEmptyContractType as any
      )
    ).toThrow(/contract_type/);
  });
});