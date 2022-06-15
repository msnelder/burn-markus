import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

let PLAID_SECRET;
switch (process.env.PLAID_ENV) {
  case "sandbox":
    PLAID_SECRET = process.env.PLAID_SECRET_SANDBOX;
    break;
  case "development":
    PLAID_SECRET = process.env.PLAID_SECRET_DEVELOPMENT;
    break;
  case "production":
    PLAID_SECRET = process.env.PLAID_SECRET;
}

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export default async function handler(req, res) {
  try {
    const { public_token } = JSON.parse(req.body);

    const response = await client.itemPublicTokenExchange({
      public_token,
    });
    const access_token = response.data.access_token;
    const accounts_response = await client.accountsGet({ access_token });
    const accounts = accounts_response.data.accounts;

    res.status(201).json({ access_token: access_token, accounts: accounts });
  } catch (error) {
    res.status(500).json({ msg: "There was an error reaching the Plaid API" });
  }
}
