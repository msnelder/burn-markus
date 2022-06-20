import { Report } from "../types/types";
import s from "./report-tabs.module.css";
import clsx from "clsx";
import { createReport } from "../lib/burn/reports";
import { File, FileText, Plus, PlusCircle, Terminal, X } from "react-feather";

const ReportTabs = ({
  reports,
  setReports,
}: {
  reports: Report[];
  setReports: (reports: Report[]) => void;
}) => {
  const setActiveReport = (updatedReport: Report) => {
    let newReports: Report[] = [...reports];

    newReports.map((report: Report) => {
      if (report.id === updatedReport.id) {
        report.active = true;
      } else {
        report.active = false;
      }
    });

    setReports(newReports);
  };

  const deleteReport = (deletedReport: Report) => {
    let newReports: Report[] = [...reports];
    let deletedReportIndex: number = newReports.findIndex((report) => report.id === deletedReport.id);
    newReports = newReports.filter((report) => report.id !== deletedReport.id);
    if (deletedReportIndex > 0) newReports[deletedReportIndex - 1].active = true;

    setReports(newReports);
  };

  return (
    <div className={s["tabs"]}>
      <div
        className={clsx(s["tab-square"], {
          [s["active"]]: false,
        })}
      >
        <Terminal size={18} />
      </div>

      {reports.map((report: Report) => (
        <div
          className={clsx(s["tab"], {
            [s["active"]]: report.active,
          })}
          onClick={(e) => setActiveReport(report)}
          key={report.id}
        >
          <FileText size={18} />
          <span>{report.name}</span>
          <div
            className={s["tab-delete"]}
            onClick={(e) => {
              e.stopPropagation();
              deleteReport(report);
            }}
          >
            <X size={12} color={"currentColor"} />
          </div>
        </div>
      ))}

      <div
        className={s["tab-add"]}
        onClick={() => {
          let newReport: Report = createReport();
          let newReports: Report[] = [...reports, newReport];

          setActiveReport(newReport);
          setReports(newReports);
        }}
      >
        <div className={s["tab-add-button"]}>
          <Plus size={18} />
        </div>
        New Model
      </div>
    </div>
  );
};

export default ReportTabs;
