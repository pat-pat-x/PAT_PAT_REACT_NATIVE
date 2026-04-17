import { supabase } from '@/utils/supabase';

export type Pt = { x: number; y: number };

export type ZodiacTemplate = {
  zodiac_code?: string;
  star_code?: string;
  name_ko: string;
  start_mmdd?: string;
  start_day?: string;
  end_mmdd?: string;
  end_day?: string;
  primary_month?: string;
  points: Pt[];
  path_index?: number[];
  edges?: [number, number][];
};

export async function loadTemplates(): Promise<ZodiacTemplate[]> {
  const { data, error } = await supabase
    .from('constellation_master')
    .select('*');

  if (error) throw new Error('Failed to load constellation data');
  if (!data) return [];

  return data.map((item: any) => ({
    zodiac_code: item.code || item.star_code || item.zodiac_code,
    star_code: item.code || item.star_code,
    name_ko: item.name_ko,
    start_mmdd: item.start_mmdd_tx || item.start_day || item.start_mmdd,
    start_day: item.start_mmdd_tx || item.start_day,
    end_mmdd: item.end_mmdd_tx || item.end_day || item.end_mmdd,
    end_day: item.end_mmdd_tx || item.end_day,
    primary_month: item.primary_month,
    points: item.points || [],
    path_index: item.path_index,
    edges: item.edges,
  }));
}

export function inRange(mmdd: string, start: string, end: string) {
  return start <= end
    ? mmdd >= start && mmdd <= end
    : mmdd >= start || mmdd <= end;
}

export function resolveZodiacByDate(date: Date, list: ZodiacTemplate[]) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const mmdd = `${mm}-${dd}`;
  return (
    list.find((z) => {
      const start = z.start_mmdd || z.start_day || '';
      const end = z.end_mmdd || z.end_day || '';
      return inRange(mmdd, start, end);
    }) ?? list[0]
  );
}

/* ---------- polyline sampling ---------- */
function buildMeta(points: Pt[]) {
  const seg: number[] = [];
  const acc: number[] = [0];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const L = Math.hypot(dx, dy);
    seg.push(L);
    total += L;
    acc.push(total);
  }
  return { seg, acc, total };
}

function sampleAt(points: Pt[], seg: number[], acc: number[], s: number): Pt {
  let i = 0;
  while (i < seg.length && acc[i + 1] < s) i++;
  if (i >= seg.length) return points[points.length - 1];
  const t = seg[i] === 0 ? 0 : (s - acc[i]) / seg[i];
  return {
    x: points[i].x + (points[i + 1].x - points[i].x) * t,
    y: points[i].y + (points[i + 1].y - points[i].y) * t,
  };
}

export function samplePolyline(
  points: Pt[] | undefined | null,
  N: number
): Pt[] {
  if (!points || points.length === 0) {
    return Array.from({ length: Math.max(0, N) }, () => ({ x: 0, y: 0 }));
  }
  if (points.length < 2 || N <= 1) {
    const first = points[0] ?? { x: 0, y: 0 };
    return Array.from({ length: Math.max(0, N) }, () => first);
  }
  const { seg, acc, total } = buildMeta(points);
  return Array.from({ length: N }, (_, k) =>
    sampleAt(points, seg, acc, total * (k / Math.max(1, N - 1)))
  );
}

export function daysInMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0).getDate();
}

/* ---------- 별자리 시즌 계산 ---------- */
export type ZodiacSign =
  | 'capricorn'
  | 'aquarius'
  | 'pisces'
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius';

export type ZodiacSeasonRange = {
  start: Date;
  end: Date;
  daysCount: number;
  dates: string[];
};

const ZODIAC_DEFINITIONS: Record<
  ZodiacSign,
  { name_ko: string; start_mmdd: string; end_mmdd: string }
> = {
  capricorn: { name_ko: '염소자리', start_mmdd: '12-22', end_mmdd: '01-19' },
  aquarius: { name_ko: '물병자리', start_mmdd: '01-20', end_mmdd: '02-18' },
  pisces: { name_ko: '물고기자리', start_mmdd: '02-19', end_mmdd: '03-20' },
  aries: { name_ko: '양자리', start_mmdd: '03-21', end_mmdd: '04-19' },
  taurus: { name_ko: '황소자리', start_mmdd: '04-20', end_mmdd: '05-20' },
  gemini: { name_ko: '쌍둥이자리', start_mmdd: '05-21', end_mmdd: '06-20' },
  cancer: { name_ko: '게자리', start_mmdd: '06-21', end_mmdd: '07-22' },
  leo: { name_ko: '사자자리', start_mmdd: '07-23', end_mmdd: '08-22' },
  virgo: { name_ko: '처녀자리', start_mmdd: '08-23', end_mmdd: '09-22' },
  libra: { name_ko: '천칭자리', start_mmdd: '09-23', end_mmdd: '10-22' },
  scorpio: { name_ko: '전갈자리', start_mmdd: '10-23', end_mmdd: '11-21' },
  sagittarius: { name_ko: '사수자리', start_mmdd: '11-22', end_mmdd: '12-21' },
};

export function getZodiacSign(date: Date): ZodiacSign {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const mmdd = `${mm}-${dd}`;

  for (const [sign, def] of Object.entries(ZODIAC_DEFINITIONS)) {
    if (inRange(mmdd, def.start_mmdd, def.end_mmdd)) {
      return sign as ZodiacSign;
    }
  }
  return 'capricorn';
}

export function getZodiacSeasonRange(
  date: Date,
  sign: ZodiacSign
): ZodiacSeasonRange {
  const def = ZODIAC_DEFINITIONS[sign];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const [startMonth, startDay] = def.start_mmdd.split('-').map(Number);
  const [endMonth, endDay] = def.end_mmdd.split('-').map(Number);

  let startYear = year;
  let endYear = year;

  const crossesYear =
    startMonth > endMonth || (startMonth === endMonth && startDay > endDay);

  if (crossesYear) {
    if (month > startMonth || (month === startMonth && day >= startDay)) {
      startYear = year;
      endYear = year + 1;
    } else {
      startYear = year - 1;
      endYear = year;
    }
  } else {
    if (month < startMonth || (month === startMonth && day < startDay)) {
      startYear = year - 1;
    }
    if (month > endMonth || (month === endMonth && day > endDay)) {
      endYear = year + 1;
    }
  }

  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(toDateString(current));
    current.setDate(current.getDate() + 1);
  }

  return { start, end, daysCount: dates.length, dates };
}

export function toDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function displayDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export function getZodiacNameKo(sign: ZodiacSign): string {
  return ZODIAC_DEFINITIONS[sign].name_ko;
}

export function expandToDays(
  points: Pt[] | undefined,
  pathIndex: number[] | undefined,
  days: number
): Pt[] {
  if (!points || points.length === 0) return Array(days).fill({ x: 0, y: 0 });
  const path = (
    pathIndex && pathIndex.length > 0 ? pathIndex : points.map((_, i) => i)
  )
    .map((i) => points[i])
    .filter(Boolean);
  return samplePolyline(path, days);
}
