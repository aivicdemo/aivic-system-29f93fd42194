import { validateContractRegistration } from "../../src/logic/it-1781935279444-1-1-1";

describe("契約書登録内容検証機能", () => {
  test("SCEN-1081: 顧客情報が部分的に不完全な場合に具体的な修正項目が指摘される", () => {
    const contractData = {
      customer_name: "○○株式会社",
      address: "東京都渋谷区",
      phone_number: "",
      email_address: "",
      representative_name: "",
    };

    expect(() => validateContractRegistration(contractData)).toThrow(
      /電話番号は必須項目です/
    );
  });
});