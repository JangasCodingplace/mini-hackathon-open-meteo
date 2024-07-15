import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from "@chakra-ui/react";

import {
  WiDaySunny,
  WiCloudy,
  WiDayCloudy,
  WiFog,
  WiRainMix,
  WiRain,
  WiSnowflakeCold,
  WiRainWind,
  WiSnowWind,
  WiSnow,
  WiNightAltThunderstorm,
} from "react-icons/wi";

interface WeatherSeries {
  dt: string;
  temperature: number;
  wmoWeatherCode: number;
}

interface WeatherTableProps {
  weatherData: WeatherSeries[];
}

const WMO_WEATHER_CODE_MAPPER = {
  "0": <WiDaySunny size={24} color="#000" />,
  "1": <WiDaySunny size={24} color="#000" />,
  "2": <WiDayCloudy size={24} color="#000" />,
  "3": <WiCloudy size={24} color="#000" />,
  "45": <WiFog size={24} color="#000" />,
  "48": <WiFog size={24} color="#000" />,
  "51": <WiRainMix size={24} color="#000" />,
  "53": <WiRainMix size={24} color="#000" />,
  "55": <WiRain size={24} color="#000" />,
  "56": <WiRain size={24} color="#000" />,
  "57": <WiSnowflakeCold size={24} color="#000" />,
  "61": <WiRainMix size={24} color="#000" />,
  "63": <WiRain size={24} color="#000" />,
  "65": <WiRainWind size={24} color="#000" />,
  "67": <WiSnowWind size={24} color="#000" />,
  "71": <WiSnow size={24} color="#000" />,
  "73": <WiSnowWind size={24} color="#000" />,
  "75": <WiSnowWind size={24} color="#000" />,
  "77": <WiSnowWind size={24} color="#000" />,
  "78": <WiSnowWind size={24} color="#000" />,
  "80": <WiRainMix size={24} color="#000" />,
  "81": <WiRain size={24} color="#000" />,
  "82": <WiRain size={24} color="#000" />,
  "85": <WiSnow size={24} color="#000" />,
  "86": <WiSnow size={24} color="#000" />,
  "95": <WiNightAltThunderstorm size={24} color="#000" />,
  "96": <WiNightAltThunderstorm size={24} color="#000" />,
  "99": <WiNightAltThunderstorm size={24} color="#000" />,
};

const WeatherTable = ({ weatherData }: WeatherTableProps) => {
  // @ts-ignore
  // @ts-ignore
  return (
    <TableContainer>
      <Table variant={"simple"}>
        <Thead>
          <Tr>
            {weatherData.map((weatherSeries, key, index) => (
              <Th key={key}>{weatherSeries.dt.split("T")[1].split(":")[0]}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            {weatherData.map((weatherSeries, key, index) => (
              <Td key={key}>{weatherSeries.temperature} &deg;C</Td>
            ))}
          </Tr>
          <Tr>
            {weatherData.map((weatherSeries, key, index) => (
              <Td key={key}>
                {
                  // @ts-ignore
                  WMO_WEATHER_CODE_MAPPER[`${weatherSeries.wmoWeatherCode}`]
                }
              </Td>
            ))}
          </Tr>
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default WeatherTable;
