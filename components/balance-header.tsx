import clsx from "clsx";
import { formatUSD } from "../utils/format";
import { format, startOfMonth, parseISO } from "date-fns";
import { Account, Bucket } from "../types/types";
import { percentChange } from "../utils/math";

import s from "./balance-header.module.css";

const BalanceHeader = ({
  accounts,
  accountBalance,
  projectedBuckets,
}: {
  accounts: Account[];
  accountBalance: number;
  projectedBuckets: Bucket[] | null;
}) => {
  const finalMonthBalance: {
    amount: number;
    change: number;
    changePercentage: number;
  } = {
    amount: projectedBuckets?.slice(-1).pop().balance,
    change: projectedBuckets?.slice(-1).pop().balance - accountBalance,
    changePercentage: percentChange(accountBalance, projectedBuckets?.slice(-1).pop().balance),
  };

  return (
    <div className={s["balance-header"]}>
      <div className={clsx(s["transaction-date"])}>
        Available Balance as of {format(startOfMonth(new Date()), "MMM dd ’yy")} (All Accounts)
      </div>
      <h2 className="font-mono">
        {accounts
          ? formatUSD(accountBalance, {
              maximumFractionDigits: 2,
            })
          : formatUSD(0, {
              maximumFractionDigits: 2,
            })}
      </h2>
      {projectedBuckets ? (
        <div className={s["balance-summary"]}>
          {formatUSD(finalMonthBalance.amount, {
            maximumFractionDigits: 2,
          })}

          <span
            className={clsx(
              {
                "text-green-400": finalMonthBalance.change - accountBalance > 0,
                "text-red-400": finalMonthBalance.change - accountBalance < 0,
              },
              "font-mono"
            )}
          >
            {" "}
            ({finalMonthBalance.change >= 0 ? "+" : null}
            {`${finalMonthBalance.changePercentage}%`})
          </span>

          <span className={s["balance-summary-date"]}>
            {format(parseISO(projectedBuckets?.slice(-1).pop().month), "MMM ’yy")}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default BalanceHeader;
