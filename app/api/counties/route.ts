import { NextRequest, NextResponse } from "next/server";
import countiesData from "@/data/generated/counties.json";
import type { CountySeries } from "@/lib/pophive/types";

interface CountiesPayload {
  flu: CountySeries;
  covid: CountySeries;
  rsv: CountySeries;
}

export async function GET(request: NextRequest) {
  const stateFips = request.nextUrl.searchParams.get("stateFips");

  if (!stateFips) {
    return NextResponse.json(
      { error: "stateFips query parameter required" },
      { status: 400 }
    );
  }

  const data = countiesData as CountiesPayload;

  // Filter county data for the requested state(s)
  const result = {
    flu: {
      ...data.flu,
      counties: data.flu.counties.filter((c) => c.countyFips.startsWith(stateFips)),
    },
    covid: {
      ...data.covid,
      counties: data.covid.counties.filter((c) => c.countyFips.startsWith(stateFips)),
    },
    rsv: {
      ...data.rsv,
      counties: data.rsv.counties.filter((c) => c.countyFips.startsWith(stateFips)),
    },
  };

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
