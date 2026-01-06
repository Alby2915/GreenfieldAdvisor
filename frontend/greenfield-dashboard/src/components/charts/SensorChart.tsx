import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import dayjs from 'dayjs';

export type SeriesDef = { key: string; color: string; name: string; unit?: string };

export default function SensorChartSplitSynced({
  data,
  series,
  height = 180,
  syncId = 'sensors-sync',
}: {
  data: { ts: number; [k: string]: number }[];
  series: SeriesDef[];
  height?: number;
  syncId?: string;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {series.map((s) => (
        <div key={s.key} style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <LineChart data={data} syncId={syncId} margin={{ top: 10, right: 20, left: 70, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ts" tickFormatter={(t) => dayjs(t).format('HH:mm')} />
              <YAxis
                width={70} 
                label={{
                  value: s.unit ? `${s.name} (${s.unit})` : s.name,
                  angle: -90,
                  position: 'insideLeft', 
                  offset: -5, 
                  style: { fontSize: 12, textAnchor: 'middle' }, 
                }}

              />
              <Tooltip
                labelFormatter={(t) => dayjs(t).format('HH:mm:ss')}
                formatter={(v) => [`${v}${s.unit ? ` ${s.unit}` : ''}`, s.name]}
              />
              <Line
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
