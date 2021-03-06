import { format, parseISO } from "date-fns";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatUSD } from "../utils/format";
import { percentChange } from "../utils/math";

import s from "./chart.module.css";

export default function Chart({
  data,
  xAxisKey,
  areaKey,
  balance,
}: {
  data: any;
  xAxisKey: string;
  areaKey: string;
  balance: number;
}) {
  const gradientOffset = () => {
    if (data && data[0]) {
      const dataMax = Math.max(...data.map((i: number) => i[areaKey]));
      const dataMin = Math.min(...data.map((i: number) => i[areaKey]));

      if (dataMax <= 0) {
        return 0;
      }
      if (dataMin >= 0) {
        return 1;
      }

      return dataMax / (dataMax - dataMin);
    }
  };

  const colorChangeOffset = gradientOffset();

  const moneyFormatter = (number: number) => {
    if (number > 1000000000 || number < -1000000000) {
      return "$" + (number / 1000000000).toString() + "B";
    } else if (number > 1000000 || number < -1000000) {
      return "$" + (number / 1000000).toString() + "M";
    } else if (number > 1000 || number < -1000) {
      return "$" + (number / 1000).toString() + "K";
    } else {
      return "$" + number.toString();
    }
  };

  const monthFormatter = (month: string) => {
    return format(parseISO(month), "MMM ’yy");
  };

  const percentGainColor = (newValue: number, originalValue: number) => {
    if (newValue - originalValue > 0) {
      return "var(--green-400)";
    } else if (newValue - originalValue < 0) {
      return "var(--red-400)";
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={s["tooltip"]}>
          <p className={s["tooltip-date"]}>{label ? format(parseISO(label), "MMM ’yy") : null}</p>
          <p className={s["tooltip-value"]}>
            {formatUSD(payload[0].value, {
              maximumFractionDigits: 2,
            })}{" "}
            <span style={{ color: percentGainColor(payload[0].value, balance) }}>
              ({payload[0].value - balance >= 0 ? "+" : null}
              {percentChange(balance, payload[0].value)}
              {"%"})
            </span>
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart
        width={800}
        height={240}
        data={data}
        margin={{
          top: 5,
          right: 20,
          bottom: 5,
          left: 20,
        }}
      >
        <XAxis
          dataKey={xAxisKey}
          tickFormatter={monthFormatter}
          axisLine={false}
          tickLine={false}
          tick={false}
          style={{
            fontSize: "0.75rem",
          }}
        />
        <YAxis
          tickFormatter={moneyFormatter}
          axisLine={false}
          tickLine={false}
          tick={false}
          width={0}
          style={{
            fontSize: "0.75rem",
          }}
        />
        <defs>
          <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
            <stop offset={0} stopColor="#7cda7c" stopOpacity={1} />
            <stop offset={colorChangeOffset} stopColor="#7cda7c" stopOpacity={0.05} />
            <stop offset={colorChangeOffset} stopColor="#fb806c" stopOpacity={0.05} />
            <stop offset={1} stopColor="#fb806c" stopOpacity={1} />
          </linearGradient>
        </defs>
        <Tooltip position={{ y: 0 }} content={<CustomTooltip />} isAnimationActive={false} />
        <Area
          type="monotone"
          dataKey={areaKey}
          stroke="#eff0ea"
          fill="url(#splitColor)"
          fillOpacity="0.9"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
