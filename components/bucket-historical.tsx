import clsx from "clsx";
import { formatUSD } from "../utils/format";
import { format, parseISO } from "date-fns";
import { sumBucketAmounts } from "../lib/burn/buckets";
import { Bucket, Transaction } from "../types/types";

import s from "./buckets.module.css";

const BucketHistorical = ({ bucket }: { bucket: Bucket }) => {
  return (
    <div className={s["bucket"]}>
      <div className={s["bucket-month"]}>{format(parseISO(bucket.month), "MMM ’yy")}</div>
      <div className={s["bucket-balance"]}>{formatUSD(bucket.balance, { maximumFractionDigits: 2 })}</div>
      {/* start: balance-group */}
      <div className={s["bucket-balance-group"]}>
        <div className={clsx(s["profit-loss-total"])}>
          Net {formatUSD(bucket.total, { maximumFractionDigits: 2 })}
        </div>
        <div className={s["profit-loss"]}>
          <div className={clsx(s["profit-loss-revenue"])}>
            {formatUSD(sumBucketAmounts(bucket).revenue, {
              maximumFractionDigits: 2,
            })}
          </div>
          <div className={clsx(s["profit-loss-expense"])}>
            {formatUSD(sumBucketAmounts(bucket).expenses, {
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>
      {/* end: balance-group */}
      {/* start: transaction-list */}
      <ul className={s["transaction-list"]}>
        {bucket.transactions.map((transaction: Transaction) => (
          <li key={transaction.transaction_id} className={clsx(s["transaction-item"])}>
            <div className={clsx(s["transaction-date"])}>{format(parseISO(transaction.date), "MM-dd")}</div>
            <div
              className={clsx(
                s["transaction-amount"],
                transaction.amount < 1 && s["income"],
                transaction.amount > 1 && s["expense"]
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
  );
};

export default BucketHistorical;
