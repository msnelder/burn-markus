import { Report } from "../types/types";
import s from "./report-tabs.module.css";
import clsx from "clsx";
import { createReport, deleteReport, setActiveReport } from "../lib/burn/reports";
import { FileText, Plus, Terminal, X } from "react-feather";

const ReportTabs = ({
  reports,
  setReports,
}: {
  reports: Report[];
  setReports: (reports: Report[]) => void;
}) => {
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
          onClick={(e) => {
            setActiveReport(report, setReports);
          }}
          key={report.id}
        >
          <FileText size={18} />
          <span>{report.name}</span>
          {reports.length > 0 ? (
            <div
              className={s["tab-delete"]}
              onClick={(e) => {
                e.stopPropagation();
                deleteReport(report, reports, setReports);
              }}
            >
              <X size={12} color={"currentColor"} />
            </div>
          ) : null}
        </div>
      ))}

      <div
        className={s["tab-add"]}
        onClick={() => {
          createReport(reports, setReports);
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
