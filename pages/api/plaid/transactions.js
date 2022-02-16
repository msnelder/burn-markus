import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import moment from "moment";

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
    const { access_token } = JSON.parse(req.body);

    const now = moment();
    const today = now.format("YYYY-MM-DD");
    // const thirtyDaysAgo = now.subtract(30, "days").format("YYYY-MM-DD");
    const firstOfCurrentMonth = moment(today)
      .startOf("month")
      .format("YYYY-MM-DD");
    const lastDayOfLastMonth = moment(today)
      .subtract(1, "months")
      .endOf("month")
      .format("YYYY-MM-DD");
    const threeMonthsAgo = moment(firstOfCurrentMonth)
      .subtract(3, "months")
      .format("YYYY-MM-DD");

    const response = await client.transactionsGet({
      access_token,
      start_date: threeMonthsAgo,
      end_date: lastDayOfLastMonth,
      // start_date: thirtyDaysAgo,
      // end_date: today,
    });
    const transactions = response.data.transactions;

    res.status(201).json({ transactions });
  } catch (error) {
    res.status(500).json({ msg: "There was an error reaching the Plaid API" });
  }
}
