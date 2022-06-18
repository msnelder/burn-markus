import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { format, startOfMonth, endOfMonth, sub } from "date-fns";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export default async function handler(req, res) {
  try {
    const { access_token } = JSON.parse(req.body);

    const firstOfMonth = startOfMonth(new Date());
    const startDate = format(sub(firstOfMonth, { months: 3 }), "yyyy-MM-dd");
    const endDate = format(endOfMonth(new Date()), "yyyy-MM-dd");

    const response = await client.transactionsGet({
      access_token,
      start_date: startDate,
      end_date: endDate,
    });
    const transactions = response.data.transactions;
    const accounts = response.data.accounts;

    res.status(201).json({ accounts, transactions });
  } catch (error) {
    res.status(500).json({ msg: "There was an error reaching the Plaid API" });
  }
}
