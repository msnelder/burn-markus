import { Report } from "../../types/types";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { supabase } from "../../utils/supabase-client";

const fetchReports = async () => {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    // .eq("created_by", user.id)
    .order("created_at", { ascending: true });
  if (error) console.log("error", error);

  return data;
};

const createReport = async (reports: Report[], setReports: (reports: Report[]) => void) => {
  const user = supabase.auth.user();
  const today = new Date();

  const newReport: Report = {
    id: uuidv4(),
    created_at: today,
    name: `Untitled ${format(today, "yyyy-mm-dd")}`,
    projected_months: 6,
    expense_projection: "MIN",
    active: true,
    created_by: user.id,
  };

  // Set all of the old reports to innactive
  const { data: existingReportData, error: existingReportError } = await supabase
    .from("reports")
    .update({ active: false })
    .eq("active", true);

  // Create the new report
  const { data: newReportData, error: newReportError } = await supabase.from("reports").insert([newReport]);

  // Get all of the reports again ... gross
  const { data: updatedReportData, error: updatedReportError } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: true });

  setReports(updatedReportData);
};

const updateReport = async (report: Report, reports: Report[], setReports: (reports: Report[]) => void) => {
  const { data, error } = await supabase.from("reports").update(report).eq("id", report.id);
};

const deleteReport = async (
  deletedReport: Report,
  reports: Report[],
  setReports: (reports: Report[]) => void
) => {
  let newReports: Report[] = [...reports];
  let newActiveReport: Report;
  let deletedReportIndex: number = newReports.findIndex((report) => report.id === deletedReport.id);

  // Delete the report
  const { data: deletedReportData, error: deletedReportError } = await supabase
    .from("reports")
    .delete()
    .eq("id", deletedReport.id);

  // Check if it's the last report before trying to set an existing one to active
  if (deletedReportIndex > 0) {
    newActiveReport = newReports[deletedReportIndex - 1];
    newActiveReport.active = true;

    const { data: newActiveReportData, error: newActiveReportError } = await supabase
      .from("reports")
      .update({ active: true })
      .eq("id", newActiveReport.id);
  }

  // Get all of the reports again ... gross
  const { data: updatedReportData, error: updatedReportError } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: true });

  setReports(updatedReportData);
};

const setActiveReport = async (report: Report, setReports: (reports: Report[]) => void) => {
  // Set all of the old reports to innactive
  const { data: existingReportData, error: existingReportError } = await supabase
    .from("reports")
    .update({ active: false })
    .eq("active", true);

  // Set the requested report to active
  const { data, error } = await supabase.from("reports").update({ active: true }).eq("id", report.id);

  // Get all of the reports again ... gross
  const { data: updatedReportData, error: updatedReportError } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: true });

  setReports(updatedReportData);
};

const getActiveReport = (reports: Report[]) => {
  console.log("Get Active Reports:", reports);
  return reports.find((report) => report.active === true);
};

export { fetchReports, createReport, updateReport, deleteReport, setActiveReport, getActiveReport };
