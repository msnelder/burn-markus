import { useState, useEffect } from "react";
import Head from "next/head";
import moment from "moment";
import clsx from "clsx";
import { formatUSD } from "../utils/format";
import Chart from "../components/chart";
import PlaidLink from "../components/simple-plaid-link";
import { Account, Transaction, Bucket, Adjustment } from "../types/types";
import { getTransactions } from "../lib/plaid/transactions";
import {
  createHistoricalBuckets,
  createProjectedBuckets,
  getBucketIndex,
} from "../lib/burn/buckets";
import styles from "./index.module.css";
import { useSessionStorage } from "../lib/hooks/useSessionStorage";

export default function Home() {
  const [accessToken, setAccessToken] = useSessionStorage("access_token", null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(0);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [monthlyBuckets, setMonthyBuckets] = useState<{
    historical: Bucket[];
    projected: Bucket[];
  }>({
    historical: [],
    projected: [],
  });

  const sumAccountBalances = (accounts: Account[]) => {
    let balances: number[] = [];
    let accountBalance: number = 0;
    accounts?.map((account: Account) => {
      balances.push(account.balances.available);
    });

    accountBalance = balances.reduce((a, b) => a + b, 0);
    return accountBalance;
  };

  const createMonthlyBuckets = async (
    transactions: Transaction[],
    accountBalance: number
  ) => {
    const historicalBuckets = await createHistoricalBuckets(
      transactions,
      accountBalance
    );
    const projectedBuckets = await createProjectedBuckets(
      6,
      historicalBuckets,
      accountBalance
    );

    setMonthyBuckets({
      historical: historicalBuckets,
      projected: projectedBuckets,
    });
  };

  const addAdjustment = (index: number) => {
    // Find the bucket this adjustment happened in

    setMonthyBuckets({
      ...monthlyBuckets,
      projected: monthlyBuckets.projected.map((month, bucketIndex) => {
        if (bucketIndex === index) {
          month["adjustments"] = [
            ...month["adjustments"],
            {
              name: null,
              amount: 0,
            },
          ];
        }
        return month;
      }),
    });
  };

  const calculateAdjustments = (
    bucketIndex: number,
    amount: string,
    adjustmentIndex: number
  ) => {
    // Find the bucket this adjustment happened in and get it's index
    let adjustmentList = [];
    let buckets = [...monthlyBuckets.projected];
    let bucket = buckets[bucketIndex];
    // Create an array with the buckets you have to update subsequently
    let remaining = buckets.slice(bucketIndex + 1);

    // Update the current bucket according to the latest adjustment
    // Convert the adjustment from a string to a number
    bucket["adjustments"][adjustmentIndex].amount = ~~amount;
    bucket["adjustments"].map((adjustment: Adjustment) => {
      adjustmentList.push(adjustment.amount);
    });
    bucket["total"] =
      bucket["base_total"] +
      adjustmentList.reduce((partialSum, a) => partialSum + a, 0);

    // Set the new balance for the bucket and subsequent buckets
    if (bucketIndex > 0) {
      bucket["balance"] = buckets[bucketIndex - 1]["balance"] + bucket["total"];
    } else {
      bucket["balance"] = accountBalance + bucket["total"];
    }

    // Start with the next bucket in the list
    // Loop through each bucket, and update the balance based on the previous bucket
    for (let i = bucketIndex + 1; i <= remaining.length; i++) {
      buckets[i]["balance"] = buckets[i - 1]["balance"] + buckets[i]["total"];
    }

    setMonthyBuckets({
      ...monthlyBuckets,
      projected: buckets,
    });
  };

  useEffect(() => {
    if (!accessToken) return;
    getTransactions(accessToken).then((data) => {
      let accountBalance: number = sumAccountBalances(data.accounts);
      setAccountBalance(accountBalance);
      setTransactions(data.transactions);
      setAccounts(data.accounts);
    });
  }, [accessToken]); // <-- dependency array

  useEffect(() => {
    if (transactions) {
      createMonthlyBuckets(transactions, accountBalance);
    }
  }, [transactions]); // <-- dependency array

  console.log(monthlyBuckets);

  return (
    <div className="container">
      <Head>
        <title>Burn: We all die someday</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles["header"]}>
        <h1 className="title">Burn</h1>

        <div className={styles["actions"]}>
          <PlaidLink
            setAccessToken={setAccessToken}
            accessToken={accessToken}
          />
        </div>
      </header>

      <main>
        <Chart
          data={monthlyBuckets.historical.concat(monthlyBuckets.projected)}
          xAxisKey="month"
          areaKey="balance"
        />

        {/* start: balance-header */}
        <div className={styles["balance-header"]}>
          <div className={clsx(styles["transaction-date"])}>
            Available Balance (All Accounts)
          </div>
          <h2>
            {accounts
              ? formatUSD(accountBalance, {
                  maximumFractionDigits: 2,
                })
              : formatUSD(0, {
                  maximumFractionDigits: 2,
                })}
          </h2>
        </div>
        {/* end: balance-header */}

        {/* start: monthly-layout */}
        <div className={styles["month-layout"]}>
          {monthlyBuckets.historical
            ? monthlyBuckets.historical.map((bucket: Bucket) => (
                <div key={bucket.month} className={styles["month"]}>
                  <div>{moment(bucket.month).format("MMMM - YYYY")}</div>
                  <div className={styles["amount-total"]}>
                    {formatUSD(bucket.total, { maximumFractionDigits: 2 })}
                  </div>
                  <div
                    className={clsx(
                      styles["transaction-date"],
                      "text-green-500"
                    )}
                  >
                    {formatUSD(bucket.balance, { maximumFractionDigits: 2 })}
                  </div>
                  {/* start: transaction-list */}
                  <ul className={styles["transaction-list"]}>
                    {bucket.transactions.map((transaction: Transaction) => (
                      <li
                        key={transaction.transaction_id}
                        className={clsx(styles["transaction-item"])}
                      >
                        <div className={clsx(styles["transaction-date"])}>
                          {moment(transaction.date).format("MM-DD")}
                        </div>
                        <div
                          className={clsx(
                            styles["transaction-amount"],
                            transaction.amount < 1 && styles["income"],
                            transaction.amount > 1 && styles["expense"]
                          )}
                        >
                          {formatUSD(transaction.amount * -1, {
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {/* end: transaction-list */}
                </div>
              ))
            : null}

          {/* start: projected-months */}
          {monthlyBuckets.projected
            ? monthlyBuckets.projected.map((bucket: Bucket, bucketIndex) => (
                <div key={bucket.id} className={styles["month"]}>
                  <div>{moment(bucket.month).format("MMMM - YYYY")}</div>
                  <div className={styles["amount-total"]}>
                    {formatUSD(bucket.total, {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div
                    className={clsx(
                      styles["transaction-date"],
                      "text-green-500"
                    )}
                  >
                    {formatUSD(bucket.balance, { maximumFractionDigits: 2 })}
                  </div>

                  {/* start: adjustment-list */}
                  {/* TODO: 
                    - [ ] UUID on adjustment (npm add UUID) "UUIDv4"
                    - [ ] Enable / Disable adjustment
                    - [ ] Replace bucket IDs on bucket
                    - [ ] Fix the bucket math
                    - [ ] Move away from indexes wherever possible
                    - [ ] Restructure adjustments
                          - Move adjustments out of buckets
                          adjustments = {
                            bucketUUID: [...], 
                            bucketUUID2: [...],
                          }
                    - [ ] Store adjustments in local storage
                    - [ ] Move to reducers
                    - [ ] Storing the adjustments - move to stupabase
                   */}
                  <div className={styles["transaction-list"]}>
                    {bucket.adjustments.map(
                      (adjustment: Adjustment, adjustmentIndex) => (
                        <div
                          key={adjustmentIndex}
                          className="input-group-inline"
                        >
                          <input
                            className={styles["adjustment-input-name"]}
                            type="text"
                            defaultValue={adjustment.name || null}
                            placeholder={`Adjustment ${adjustmentIndex + 1}`}
                          />
                          <input
                            className={styles["adjustment-input-value"]}
                            type="number"
                            defaultValue={adjustment.amount || "0"}
                            onChange={(e) => {
                              calculateAdjustments(
                                bucketIndex,
                                e.target.value,
                                adjustmentIndex
                              );
                            }}
                          />
                        </div>
                      )
                    )}
                  </div>
                  {/* end: adjustment-list */}
                  <div
                    className={clsx(
                      "button button-text button-small",
                      styles["button-adjustment-add"]
                    )}
                    onClick={(e) => {
                      addAdjustment(bucketIndex);
                    }}
                  >
                    Add Adjustment
                  </div>
                </div>
              ))
            : null}
          {/* end: projected-months */}
        </div>
        {/* end: monthly-layout */}
      </main>
    </div>
  );
}
