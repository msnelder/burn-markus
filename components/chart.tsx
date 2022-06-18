import { formatUSD } from "../utils/format";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import moment from "moment";

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
      const dataMax = Math.max(...data.map((i) => i[areaKey]));
      const dataMin = Math.min(...data.map((i) => i[areaKey]));

      if (dataMax <= 0) {
        return 0;
      }
      if (dataMin >= 0) {
        return 1;
      }

      return dataMax / (dataMax - dataMin);
    }
  };

  const off = gradientOffset();

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
    return moment(month).format("MMM 'YY");
  };

  const percentGainColor = (newValue: number, originalValue: number) => {
    if (newValue - originalValue > 0) {
      return "var(--green)";
    } else {
      return "var(--red)";
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p style={{ margin: 0 }}>{moment(label).format("MMM 'YY")}</p>
          <p style={{ margin: 0, fontSize: "0.75rem" }}>
            {formatUSD(payload[0].value, {
              maximumFractionDigits: 2,
            })}{" "}
            <span
              style={{ color: percentGainColor(payload[0].value, balance) }}
            >
              ({payload[0].value - balance >= 0 ? "+" : null}
              {Math.round(100 * ((payload[0].value - balance) / balance))}
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
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        {/* <CartesianGrid strokeDasharray="3 3" /> */}
        <XAxis
          dataKey={xAxisKey}
          tickFormatter={monthFormatter}
          tickLine={false}
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
        <Tooltip
          position={{ y: 0 }}
          content={<CustomTooltip />}
          isAnimationActive={false}
        />
        <defs>
          <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
            <stop offset={off} stopColor="#63cb63" stopOpacity={1} />
            <stop offset={off} stopColor="#fb806c" stopOpacity={1} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={areaKey}
          stroke="transparent"
          fill="url(#splitColor)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
