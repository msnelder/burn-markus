import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import s from "./index.module.css";
import { Account, Transaction, Bucket, Report } from "../types/types";
import { sumArray } from "../utils/math";
import { useSessionStorage } from "../lib/hooks/useSessionStorage";
import { getTransactions } from "../lib/plaid/transactions";
import { getHistoricalBuckets, getProjectedBuckets } from "../lib/burn/buckets";
import { createReport, getActiveReport, getReports } from "../lib/burn/reports";
import { getTransactionAmounts } from "../lib/burn/transactions";
import { supabase } from "../utils/supabase-client";
import Auth from "../components/auth";
import UserAccount from "../components/account";
import PlaidLink from "../components/simple-plaid-link";
import Chart from "../components/chart";
import ReportTabs from "../components/reports-tabs";
import BalanceHeader from "../components/balance-header";
import BucketHistorical from "../components/bucket-historical";
import BucketProjected from "../components/bucket-projected";
import Avatar from "boring-avatars";

export default function Home() {
  const [session, setSession] = useState(null);
  const [userAccountOpen, setUserAccountOpen] = useState<boolean | null>(false);
  const [accessToken, setAccessToken] = useSessionStorage("access_token", null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(0);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [historicalBuckets, setHistoricalBuckets] = useState<Bucket[] | null>(null);
  const [adjustments, setAdjustments] = useSessionStorage("adjustments", null);
  const [reports, setReports] = useSessionStorage("reports", null);

  /* TODO:
    - [ ] Move to supabase
    - [ ] Deleting related adjustments on report delete
    - [ ] Disconnect bank account
    ===== Future State
    - [ ] Move to reducers
    */

  const sumAccountBalances = (accounts: Account[], transactions: Transaction[]) => {
    let balances: number[] = [];
    let accountBalance: number = 0;
    accounts?.map((account: Account) => {
      balances.push(account.balances.available);
    });
    const thisMonthsTransactions = getTransactionAmounts(transactions, new Date());

    accountBalance = sumArray(balances) - sumArray(thisMonthsTransactions);
    return accountBalance;
  };

  const createHistoricalBuckets = (transactions: Transaction[], accountBalance: number) => {
    const historicalBuckets = getHistoricalBuckets(transactions, accountBalance);

    setHistoricalBuckets(historicalBuckets);
  };

  const projectedBuckets = useMemo(() => {
    if (historicalBuckets) {
      let buckets: Bucket[] = getProjectedBuckets(
        6,
        historicalBuckets,
        adjustments,
        accountBalance,
        transactions,
        getActiveReport(reports)
      );
      return buckets;
    }
  }, [historicalBuckets, adjustments, reports]);

  useEffect(() => {
    setSession(supabase.auth.session());

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    if (!accessToken) return;
    getTransactions(accessToken).then((data) => {
      if (data.accounts) {
        let accountBalance: number = sumAccountBalances(data.accounts, data.transactions);
        setAccountBalance(accountBalance);
        setTransactions(data.transactions);
        setAccounts(data.accounts);
      } else {
        setAccessToken(null);
      }
    });
  }, [accessToken]); // <-- dependency array

  useEffect(() => {
    if (transactions) {
      createHistoricalBuckets(transactions, accountBalance);
    }
  }, [transactions]); // <-- dependency array

  useEffect(() => {
    if (session) {
      getReports();
    }
    if (!reports || reports.length === 0) {
      let newReport = createReport();
      let newReports: Report[] = [newReport];

      setReports(newReports);
    }
  }, [reports]); // <-- dependency array

  return (
    <div className="container">
      {!session ? <Auth /> : null}
      {userAccountOpen ? (
        <UserAccount
          key={session.user.id}
          session={session}
          userAccountOpen={userAccountOpen}
          setUserAccountOpen={setUserAccountOpen}
        />
      ) : null}
      <Head>
        <title>Burn: We all die someday</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={s["header"]}>
        <div className={s["header-left"]}>
          <div className={s["header-logo"]}>
            <img className={s["header-mark"]} src="/images/logo.svg" alt="" />
            Burn
          </div>
          {reports ? <ReportTabs reports={reports} setReports={setReports} /> : null}
        </div>

        <div className={s["header-right"]}>
          <div className={s["header-actions"]}>
            <PlaidLink setAccessToken={setAccessToken} accessToken={accessToken} />
            <div
              className={s["header-avatar"]}
              onClick={(e) => {
                setUserAccountOpen(!userAccountOpen);
              }}
            >
              {session ? (
                <Avatar
                  size={22}
                  name={session.user.email}
                  variant="marble"
                  colors={["#E7EDEA", "#FFC52C", "#FB0D06", "#030D4F", "#CEECEF"]}
                />
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main>
        <BalanceHeader
          accounts={accounts}
          accountBalance={accountBalance}
          projectedBuckets={projectedBuckets}
        />

        <Chart
          data={historicalBuckets?.concat(projectedBuckets)}
          xAxisKey="month"
          areaKey="balance"
          balance={accountBalance}
        />

        {/* start: bucket-layout */}
        <div className={s["bucket-layout"]}>
          {/* start: historical-months */}
          {historicalBuckets
            ? historicalBuckets.map((bucket: Bucket) => (
                <BucketHistorical bucket={bucket} key={bucket.month} />
              ))
            : null}
          {/* end: historical-months */}

          {/* start: projected-buckets */}
          {projectedBuckets
            ? projectedBuckets.map((bucket: Bucket) => (
                <BucketProjected
                  bucket={bucket}
                  adjustments={adjustments}
                  setAdjustments={setAdjustments}
                  activeReport={getActiveReport(reports)}
                  key={bucket.month}
                />
              ))
            : null}
          {/* end: projected-buckets */}
        </div>
        {/* end: bucket-layout */}
      </main>
    </div>
  );
}
