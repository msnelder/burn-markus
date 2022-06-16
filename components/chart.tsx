import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Chart({
  data,
  xAxisKey,
  areaKey,
}: {
  data: any;
  xAxisKey: string;
  areaKey: string;
}) {
  const gradientOffset = () => {
    if (data && data[0]) {
      // console.log(data);
      // console.log(data[0]);
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

  const moneyFormatter = (number) => {
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

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart
        width={800}
        height={240}
        data={data}
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis tickFormatter={moneyFormatter} />
        <Tooltip />
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
