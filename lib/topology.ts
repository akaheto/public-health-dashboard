import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import statesTopology from "us-atlas/states-albers-10m.json";
import countiesTopology from "us-atlas/counties-albers-10m.json";

type StateProps = { name: string };
type CountyProps = { name: string };

const statesTopo = statesTopology as unknown as Topology;
const countiesTopo = countiesTopology as unknown as Topology;

export const usStates = feature(
  statesTopo,
  statesTopo.objects.states as GeometryCollection
) as unknown as FeatureCollection<Geometry, StateProps>;

export const usCounties = feature(
  countiesTopo,
  countiesTopo.objects.counties as GeometryCollection
) as unknown as FeatureCollection<Geometry, CountyProps>;

export const usNation = feature(
  statesTopo,
  statesTopo.objects.nation as GeometryCollection
) as unknown as FeatureCollection<Geometry, Record<string, never>>;

export function countiesForState(
  stateFips: string
): FeatureCollection<Geometry, CountyProps> {
  return countiesForStates([stateFips]);
}

export function countiesForStates(
  stateFipsList: string[]
): FeatureCollection<Geometry, CountyProps> {
  return {
    type: "FeatureCollection",
    features: usCounties.features.filter((f) =>
      stateFipsList.some((sf) => String(f.id).startsWith(sf))
    ),
  };
}
