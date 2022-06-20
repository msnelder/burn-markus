import { Report } from "../../types/types";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { supabase } from "../../utils/supabase-client";

const createReport = () => {
  const today = new Date();
  const newReport: Report = {
    id: uuidv4(),
    created_at: today,
    name: `Untitled ${format(today, "yyyy-mm-dd")}`,
    projected_months: 6,
    expense_projecion: "min",
    active: true,
  };

  return newReport;
};

async function getReports() {
  try {
    let { data, error, status } = await supabase.from("reports").select("*");

    if (error && status !== 406) {
      throw error;
    }

    return data;
  } catch (error) {
    alert(error.message);
  }
}

const getActiveReport = (reports: Report[]) => {
  return reports.find((report) => report.active === true);
};

export { createReport, getActiveReport, getReports };
