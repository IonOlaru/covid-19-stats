import React, { FC, useState, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage';
import useFetch from '../hooks/useFetch';
import StatCard from './StatCard';
import WorldMap from './WorldMap';
import { ICountry } from '../definitions/ICountry';
import { toPercentage } from '../utils/toPercentage';
import { COUNTRIES_URL, COUNTRY_DATA_URL } from '../api';

const COUNTRY_DEFAULT: ICountry = {
  name: 'Argentina',
  iso2: 'AR',
  iso3: 'ARG'
}

interface ICountries {
  countries: ICountry[]
}

const CountryStats: FC = () => {
    const [selectedCountry, setSelectedCountry] = useLocalStorage('country-selected', COUNTRY_DEFAULT);
    const [selectedCountryData, setSelectedCountryData] = useState<
      Record<string, any>
    >({})
    
    const [countryData, countryLoading, cError] = useFetch(
        `${COUNTRIES_URL}/${selectedCountry.name}`
    )
    
    const [countries] = useFetch<ICountries>(COUNTRIES_URL)
    
    const handleCountrySelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCountry(JSON.parse(e.currentTarget.value))
    }

    const getCountryByIso2 = (iso2: string) => {
        for(let country of countries?.countries as ICountry[]) {
          if(country.iso2 === iso2) {
            return country
          }
        }

        throw new Error('Country not found')
    }

    const getCountryData = async (country: ICountry) => {
      const r = await fetch(
        `${COUNTRY_DATA_URL}/${country.iso2}?fields=name;flag;population;area;latlng`
      )
      const data = await r.json()

      setSelectedCountryData(data)
    }

    useEffect(() => {
      getCountryData(selectedCountry)
    }, [selectedCountry])

    return (
      <div className="CountryStats neumorph sm:shadow-neumorph-inset mb-6 sm:p-6 p-0">
        <WorldMap
          countries={countries as ICountries}
          selectedCountry={selectedCountry.iso2}
          setSelectedCountry={(iso2: string) => {
            try {
              setSelectedCountry(getCountryByIso2(iso2))
            } catch (e) {}
          }}
        />

        <div className="flex items-center mb-4">
          <div className="h-12 w-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full shadow-md overflow-hidden mr-3 md:mr-4 transition-all duration-200 ease-in-out bg-muted">
            <img
              className="h-full object-cover"
              src={selectedCountryData?.flag}
              alt=""
            />
          </div>
          <div className="flex-grow">
            <div className="relative">
              <select
                className="block appearance-none text-gray-900 w-full p-1 lg:p-2 rounded-md mb-1 md:mb-2 md:text-lg lg:text-xl bg-primary text-back focus:outline-none focus:outline-shadow leading-tight"
                disabled={countryLoading}
                onChange={handleCountrySelection}
                value={JSON.stringify(selectedCountry)}
              >
                {countries &&
                  countries.countries.map((country: ICountry) => {
                    return (
                      <option key={country.name} value={JSON.stringify(country)}>
                        {country.name}
                      </option>
                    )
                  })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            <div className="text-xs md:text-sm text-muted">
              Population: {selectedCountryData?.population?.toLocaleString() || 0} | 
              Area: {selectedCountryData?.area?.toLocaleString() || 0}km<sup>2</sup>
            </div>
          </div>
        </div>

        <div className="flex justify-center sx-2 sm:sx-5">
          {cError.length > 0 && (
            <div className="text-center text-gray-500 ">
              <div className="font-sans text-5xl mb-3">¯\_(ツ)_/¯</div>
              <div>{cError}</div>
            </div>
          )}

          {cError.length === 0 && (
            <>
              <StatCard
                title="Confirmed (100%)"
                value={
                  countryLoading ? undefined : countryData?.confirmed.value
                }
              />
              <StatCard
                title={`Recovered (${toPercentage(
                  countryData?.recovered.value,
                  countryData?.confirmed.value
                )})`}
                value={
                  countryLoading ? undefined : countryData?.recovered.value
                }
              />
              <StatCard
                title={`Deaths (${toPercentage(
                  countryData?.deaths.value,
                  countryData?.confirmed.value
                )})`}
                value={countryLoading ? undefined : countryData?.deaths.value}
              />
            </>
          )}
        </div>
      </div>
    )
}

export default CountryStats
