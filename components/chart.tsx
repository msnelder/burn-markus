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
      console.log(data);
      console.log(data[0]);
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

  return (
    <AreaChart
      width={800}
      height={250}
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
      <YAxis />
      <Tooltip />
      <defs>
        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
          <stop offset={off} stopColor="green" stopOpacity={1} />
          <stop offset={off} stopColor="red" stopOpacity={1} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey={areaKey}
        stroke="#000"
        fill="url(#splitColor)"
      />
    </AreaChart>
  );
}
