import { useState, useEffect } from "react";
import Head from "next/head";
import moment from "moment";
import clsx from "clsx";
import styles from "./index.module.css";
import PlaidLink from "../components/simple-plaid-link";

export default function Home() {
  const [transactions, setTransactions] = useState<any | null>([]);
  const [transactionMonths, setTransactionMonths] = useState<[] | null>([]);

  useEffect(() => {
    console.log("State:", transactions);

    const transactionBuckets = () => {
      let date;
      let buckets = [];
      transactions.map((t) => {
        if (t.date != date) {
          date = moment(t.date).format("YYYY-MM");
          // If it's a new month, create a new array for that month as a "bucket"
          // Put the transaction into that bucket
        }
      });
    };

    transactionBuckets();
  });

  const getTransactions = async () => {
    const accessToken = sessionStorage.getItem("access_token");
    const response = await fetch("/api/plaid/transactions", {
      method: "POST",
      body: JSON.stringify({ access_token: accessToken }),
    });
    let data = await response.json();
    data = data.transactions;
    console.log("Request:", data);

    return data;
  };

  return (
    <div className="container">
      <Head>
        <title>Burn: We all die someday</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <h1 className="title">Burn</h1>

        <p className="description">Connect your bank account to get started</p>
        <div className="actions">
          <PlaidLink />
        </div>
        <div className="actions">
          <button
            onClick={() => {
              getTransactions().then((data) => {
                setTransactions(data);
              });
            }}
            className="button"
          >
            Get transactions
          </button>
        </div>
      </header>

      <main>
        <ul>
          {transactions.map((t) => (
            <li key={t.transaction_id}>
              <pre>${t.amount}</pre>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
