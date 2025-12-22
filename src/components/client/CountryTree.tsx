import { counties } from "./counties";
import { pollingStations } from "./pollingStations";
import { subCounties } from "./subCounties";
import { wards } from "./wards";



const CountryTree = () => {
  return counties.map(county => ({
    ...county,
    subCounties: subCounties
      .filter(sc => sc.countyId === county.id)
      .map(subCounty => ({
        ...subCounty,
        wards: wards
          .filter(w => w.subCountyId === subCounty.id)
          .map(ward => ({
            ...ward,
            pollingStations: pollingStations
              .filter(ps => ps.wardId === ward.id)
              .map(ps => ps.name),
          })),
      })),
  }));
};

export const countryTree = CountryTree();
