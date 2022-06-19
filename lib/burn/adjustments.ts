import { Bucket, Adjustment, Report } from "../../types/types";
import { v4 as uuidv4 } from "uuid";

const createAdjustment = (bucket: Bucket, amount: number, report: Report) => {
  let adjustment: Adjustment = {
    id: uuidv4(),
    name: null,
    amount: amount,
    enabled: true,
    bucket_id: bucket.id,
    report_id: report.id,
  };

  return adjustment;
};

export { createAdjustment };
