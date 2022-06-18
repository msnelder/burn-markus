import clsx from "clsx";

import styles from "./app-tabs.module.css";

const AppTabs = () => {
  return (
    <div className={styles["tabs"]}>
      <div
        className={clsx(styles["tab-square"], styles["tab-icon"], {
          [styles["active"]]: false,
        })}
      >
        &#10061;
      </div>
      <div
        className={clsx(styles["tab"], {
          [styles["active"]]: true,
        })}
      >
        <span className={styles["tab-icon"]}>&#10065;</span>
        Active report
      </div>
      <div
        className={clsx(styles["tab-add"], {
          [styles["active"]]: false,
        })}
      >
        <div className={styles["tab-add-button"]}>&#10158;</div>
        New Report
      </div>
    </div>
  );
};

export default AppTabs;
