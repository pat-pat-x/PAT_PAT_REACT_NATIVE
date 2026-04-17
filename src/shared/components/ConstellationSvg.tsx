import { Pt, samplePolyline } from '@/lib/zodiac';
import { useMemo } from 'react';
import Svg, {
  Circle,
  Defs,
  Line,
  RadialGradient,
  Stop,
  G,
} from 'react-native-svg';

type StarThemeType = 'default' | 'healing' | 'warm' | 'deep' | 'lumi' | 'birthday';

type ConstellationSvgProps = {
  anchorPoints?: Pt[];
  starPoints?: Pt[];
  daysCount?: number;
  entries: Record<
    string,
    {
      content: string;
      emotion_polarity?: string;
      emotion_intensity?: number | null;
    }
  >;
  dates: string[];
  todayDate: string;
  onStarPress?: (date: string, index: number) => void;
  theme?: StarThemeType;
  size?: number;
};

const THEMES: Record<StarThemeType, { positive: string; negative: string }> = {
  default: { positive: '#A6CAF6', negative: '#E78F3D' },
  healing: { positive: '#2DD4BF', negative: '#A78BFA' },
  warm: { positive: '#FDE68A', negative: '#FB7185' },
  deep: { positive: '#22D3EE', negative: '#94A3B8' },
  lumi: { positive: '#A6CAF6', negative: '#E78F3D' },
  birthday: { positive: '#FFD700', negative: '#E8A317' },
};

function getStarColor(
  polarity: string | undefined,
  intensity: number | null | undefined,
  theme: StarThemeType
): string {
  if (!polarity || polarity === 'UNSET') return '#FEF9C3';
  const colors = THEMES[theme];

  if (polarity === 'POSITIVE') {
    if (intensity != null && intensity >= 4) return '#4B9CE8';
    if (intensity === 3) return colors.positive;
    return '#D8EDFB';
  }
  if (polarity === 'NEGATIVE') {
    if (intensity != null && intensity >= 4) return '#B5601A';
    if (intensity === 3) return colors.negative;
    return '#F5C897';
  }
  return colors.positive;
}

export default function ConstellationSvg({
  anchorPoints,
  starPoints: starPointsProp,
  daysCount,
  entries,
  dates,
  todayDate,
  onStarPress,
  theme = 'default',
  size = 300,
}: ConstellationSvgProps) {
  const starPoints = useMemo(() => {
    if (starPointsProp && starPointsProp.length > 0) return starPointsProp;
    if (!anchorPoints || anchorPoints.length === 0 || !daysCount) return [];
    return samplePolyline(anchorPoints, daysCount);
  }, [starPointsProp, anchorPoints, daysCount]);

  const starStates = useMemo(() => {
    return dates.map((date, index) => {
      const entry = entries[date];
      const hasEntry = !!entry;
      const isToday = date === todayDate;
      const starColor = hasEntry
        ? getStarColor(entry.emotion_polarity, entry.emotion_intensity, theme)
        : 'rgba(200,230,255,1)';
      return { date, index, hasEntry, isToday, isActive: hasEntry || isToday, starColor };
    });
  }, [dates, entries, todayDate, theme]);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {starPoints.map((_, index) => {
          const state = starStates[index];
          if (!state) return null;
          const colorStop = state.hasEntry ? state.starColor : 'rgba(200,230,255,1)';
          const outerOp = state.hasEntry ? 0.35 : 0;
          return (
            <RadialGradient key={`grad-${index}`} id={`starGrad-${index}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="white" stopOpacity={1} />
              <Stop offset="20%" stopColor="white" stopOpacity={0.9} />
              <Stop offset="60%" stopColor={colorStop} stopOpacity={outerOp} />
              <Stop offset="100%" stopColor={colorStop} stopOpacity={0} />
            </RadialGradient>
          );
        })}
      </Defs>

      {/* 연결선 */}
      {starPoints.slice(0, -1).map((p, i) => {
        const q = starPoints[i + 1];
        const isActive =
          (starStates[i]?.isActive ?? false) && (starStates[i + 1]?.isActive ?? false);
        return (
          <Line
            key={`line-${i}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke="white"
            strokeWidth={isActive ? 0.3 : 0.1}
            strokeOpacity={isActive ? 0.6 : 0.2}
          />
        );
      })}

      {/* 별들 */}
      {starPoints.map((point, index) => {
        const state = starStates[index];
        if (!state) return null;
        const entry = entries[state.date];
        const r = !state.hasEntry
          ? 1.5
          : entry?.emotion_intensity != null && entry.emotion_intensity >= 4
            ? 3.5
            : entry?.emotion_intensity === 3
              ? 2.5
              : 1.8;

        return (
          <G
            key={`star-${index}`}
            onPress={() => onStarPress?.(state.date, index)}
          >
            <Circle
              cx={point.x}
              cy={point.y}
              r={r}
              fill={`url(#starGrad-${index})`}
            />
            <Circle
              cx={point.x}
              cy={point.y}
              r={r * 0.2}
              fill="white"
              fillOpacity={state.hasEntry ? 1 : 0.7}
            />
          </G>
        );
      })}
    </Svg>
  );
}
