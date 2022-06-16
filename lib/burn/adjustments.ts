import { Bucket, Adjustment } from "../../types/types";
import { v4 as uuidv4 } from "uuid";

const createAdjustment = (bucket: Bucket, amount: number) => {
  let adjustment: Adjustment = {
    id: uuidv4(),
    name: null,
    amount: amount,
    bucket_id: bucket.id,
  };

  return adjustment;
};

export { createAdjustment };
