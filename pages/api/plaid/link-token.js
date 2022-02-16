import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET_SANDBOX,
    },
  },
});

const client = new PlaidApi(configuration);

export default async function handler(req, res) {
  try {
    const response = await client.linkTokenCreate({
      user: {
        client_user_id: "123-test-me",
      },
      client_name: "Burn App",
      products: ["auth", "transactions"],
      country_codes: ["US"],
      language: "en",
      account_filters: {
        depository: {
          account_subtypes: ["checking"],
        },
      },
    });

    res.status(201).json(response.data);
  } catch (error) {
    res.status(500).json({ msg: "There was an error reaching the Plaid API" });
  }
}
