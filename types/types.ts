// export type User = {
//   app_metadata: {
//     provider: string;
//     providers: [];
//   };
//   aud: string;
//   confirmation_sent_at: Date;
//   confirmed_at: Date;
//   created_at: Date;
//   email: string;
//   email_confirmed_at: Date;
//   id: string;
//   identities: [];
//   last_sign_in_at: Date;
//   phone: string;
//   role: string;
//   updated_at: Date;
//   user_metadata: {};
// };

// export type Session = {
//   access_token: string;
//   expires_at: number;
//   expires_in: number;
//   provider_token?: string;
//   refresh_token: string;
//   token_type?: string;
//   user: User;
// };

export type Account = {
  account_id: string;
  name: string;
  balances: {
    available: number | null;
    current: number | null;
    mask: string;
    iso_currency_code: string;
    limit: number | null;
    unofficial_currency_code: number | null;
  };
  official_name: string | null;
  subtype: string | null;
  type: string | null;
};

export type Transaction = {
  transaction_id: string;
  date: string;
  amount: number;
};

export type Adjustment = {
  id: string;
  created_at?: Date;
  name: string;
  amount: number;
  enabled: boolean;
  bucket_id: string;
  report_id: string;
};

export type Adjustments = {
  [bucket_month: string]: Adjustment[];
};

export type Bucket = {
  id: string;
  month: string;
  transactions: Transaction[];
  amounts: number[];
  total: number;
  projected_total: number;
  balance: number;
};

export type Report = {
  id?: string;
  created_at?: Date;
  name?: string;
  projected_months?: number;
  expense_projection?: string;
  active?: boolean;
  created_by: string;
};
