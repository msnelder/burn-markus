import { Report } from "../../types/types";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

const createReport = () => {
  const today = new Date();
  const newReport: Report = {
    id: uuidv4(),
    created_on: today,
    name: `Untitled ${format(today, "yyyy-mm-dd")}`,
    projected_months: 6,
    expense_projecion: "min",
    active: true,
  };

  return newReport;
};

const getActiveReport = (reports: Report[]) => {
  return reports.find((report) => report.active === true);
};

export { createReport, getActiveReport };
