import { Adjustments, Bucket, Adjustment, Report } from "../types/types";
import clsx from "clsx";
import { formatUSD } from "../utils/format";
import { format, parseISO } from "date-fns";
import { sumArray } from "../utils/math";
import { sumBucketAmounts } from "../lib/burn/buckets";
import { getTransactionAmounts } from "../lib/burn/transactions";
import { v4 as uuidv4 } from "uuid";

import s from "./buckets.module.css";
import { Delete, Eye, EyeOff, PlusSquare, Trash2 } from "react-feather";

const BucketProjected = ({
  bucket,
  adjustments,
  setAdjustments,
  activeReport,
}: {
  bucket: Bucket;
  adjustments: Adjustments;
  setAdjustments: (adjustments: Adjustments) => void;
  activeReport: Report;
}) => {
  const createAdjustment = (modifiedBucket: Bucket) => {
    let newAdjustment: Adjustment = {
      id: uuidv4(),
      name: null,
      amount: 0,
      bucket_id: modifiedBucket.id,
      enabled: true,
      report_id: activeReport.id,
    };

    setAdjustments({
      ...adjustments,
      [modifiedBucket.month]: adjustments?.hasOwnProperty(modifiedBucket.month)
        ? [{ ...newAdjustment }, ...adjustments[modifiedBucket.month]]
        : [newAdjustment],
    });
  };

  const updateAdjustments = (
    modifiedBucket: Bucket,
    updatedAdjustment: Adjustment,
    newAmount?: string,
    newName?: string,
    enabled?: boolean
  ) => {
    // Udpate the adjustments state
    const newAdjustments = { ...adjustments };

    if (newAmount) {
      newAdjustments[modifiedBucket.month].find(
        (adjustment) => adjustment.id === updatedAdjustment.id
      ).amount = ~~newAmount;
    }

    if (newName) {
      newAdjustments[modifiedBucket.month].find((adjustment) => adjustment.id === updatedAdjustment.id).name =
        newName;
    }

    if (enabled !== null) {
      newAdjustments[modifiedBucket.month].find(
        (adjustment) => adjustment.id === updatedAdjustment.id
      ).enabled = enabled;
    }

    setAdjustments(newAdjustments);
  };

  const deleteAdjustment = (modifiedBucket: Bucket, updatedAdjustment: Adjustment) => {
    // Udpate the adjustments state
    let newAdjustments = { ...adjustments };

    newAdjustments[modifiedBucket.month] = newAdjustments[modifiedBucket.month].filter(
      (adjustment: Adjustment) => adjustment.id !== updatedAdjustment.id
    );

    setAdjustments(newAdjustments);
  };

  return (
    <div className={s["bucket"]}>
      <div className={s["bucket-month"]}>{format(parseISO(bucket.month), "MMM ’yy")}</div>
      <div className={s["bucket-balance"]}>
        {formatUSD(bucket.balance, {
          maximumFractionDigits: 2,
        })}
      </div>
      {/* start: balance-group */}
      <div className={s["bucket-balance-group"]}>
        <div className={clsx(s["profit-loss-total"])}>
          Net {formatUSD(bucket.total, { maximumFractionDigits: 2 })}
        </div>
        <div className={s["profit-loss"]}>
          {bucket.transactions.length > 0 ? (
            <>
              <div className={clsx(s["profit-loss-revenue"])}>
                {formatUSD(
                  sumArray(getTransactionAmounts(bucket.transactions).filter((amount) => amount > 0)),
                  { maximumFractionDigits: 2 }
                )}
              </div>
            </>
          ) : null}
          <div className={clsx(s["profit-loss-revenue"])}>
            {formatUSD(sumBucketAmounts(bucket).revenue, {
              maximumFractionDigits: 2,
            })}
          </div>
          <div className={clsx(s["profit-loss-expense"])}>
            {formatUSD(bucket.projected_total, {
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

      {/* start: adjustment-list */}
      <div className={s["button-adjustment-actions"]}>
        <div
          className={clsx("button button-small button-primary button-text right", s["button-adjustment-add"])}
          onClick={(e) => {
            createAdjustment(bucket);
          }}
        >
          <PlusSquare size={14} /> Add Adjustment
        </div>
      </div>
      <div className={s["transaction-list"]}>
        {adjustments && adjustments[bucket.month]
          ? adjustments[bucket.month].map((adjustment: Adjustment, i) =>
              adjustment.report_id === activeReport.id ? (
                <div key={adjustment.id} className={clsx("input-group-inline", s["adjustment-row"])}>
                  <input
                    className={clsx(s["adjustment-input-name"], {
                      [s["disabled"]]: !adjustment.enabled,
                    })}
                    type="text"
                    defaultValue={adjustment.name || null}
                    placeholder={`Adjustment ${i + 1}`}
                    onChange={(e) => {
                      updateAdjustments(bucket, adjustment, undefined, e.target.value, true);
                    }}
                  />
                  <input
                    className={clsx(s["adjustment-input-value"], {
                      [s["disabled"]]: !adjustment.enabled,
                    })}
                    type="number"
                    defaultValue={adjustment.amount || "0"}
                    onChange={(e) => {
                      updateAdjustments(bucket, adjustment, e.target.value, undefined, true);
                    }}
                    onWheel={() => {
                      return false;
                    }}
                  />
                  <div className={s["adjustment-actions"]}>
                    <div
                      className={clsx("button button-xsmall button-primary", s["adjustment-toggle"])}
                      onClick={(e) => {
                        updateAdjustments(bucket, adjustment, undefined, undefined, !adjustment.enabled);
                      }}
                    >
                      {adjustment.enabled ? <EyeOff size={10} /> : <Eye size={10} />}
                    </div>
                    <div
                      className={clsx("button button-xsmall button-primary", s["adjustment-delete"])}
                      onClick={(e) => {
                        deleteAdjustment(bucket, adjustment);
                      }}
                    >
                      <Delete size={11} />
                    </div>
                  </div>
                </div>
              ) : null
            )
          : null}
      </div>
      {/* end: adjustment-list */}
    </div>
  );
};

export default BucketProjected;
