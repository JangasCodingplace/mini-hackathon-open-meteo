import { useParams, useNavigate } from "react-router-dom";
import axios from "./../../axiosInterceptor";
import React from "react";

import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Tab,
  TabList,
  Tabs,
  TabPanel,
  TabPanels,
  Text,
} from "@chakra-ui/react";

import MarkdownRenderer from "./MarkdownRenderer";
import WeatherTable from "./WeatherTable";

interface WeatherSeries {
  dt: string;
  temperature: number;
  wmoWeatherCode: number;
}

interface Advise {
  id: string;
  advise: string;
  state: string;
  type: string;
  forDate: string | null;
  weatherSeries: WeatherSeries[];
}

interface TripDetailData {
  id: string;
  city: string;
  country: string;
  duration: number;
  startDate: string;
  endDate: string;
  advises: Advise[];
}

const TripDetails = () => {
  const { key } = useParams();
  const navigate = useNavigate();

  const [tripDetailData, setTripDetailData] =
    React.useState<TripDetailData | null>(null);

  const fetchTrip = async () => {
    try {
      const response = await axios.get(
        `/api/trip/retrieve/${key}`,
      );
      const trip = {
        id: response.data.id,
        city: response.data.city,
        country: response.data.country,
        duration: response.data.duration,
        startDate: response.data.start_date,
        endDate: response.data.end_date,
        advises: response.data.advises?.map((advise: any) => ({
          id: advise.id,
          advise: advise.advise,
          state: advise.state,
          type: advise.type,
          forDate: advise.for_date,
          weatherSeries: advise.weather_series?.map((weatherSeries: any) => ({
            dt: weatherSeries.dt,
            temperature: weatherSeries.temperature,
            wmoWeatherCode: weatherSeries.wmo_weather_code,
          })),
        })),
      };
      setTripDetailData(trip);
    } catch (error) {
      console.error(error);
      // navigate('/404');
    }
  };

  const tripIsCalculated = () => {
    // trip is calculated if any advise objects state is equal to `2`
    if (tripDetailData?.advises === undefined) return false;
    if (tripDetailData?.advises.length === 0) return false;
    return tripDetailData.advises.some((advise) => advise.state === "2");
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (tripDetailData === null || !tripIsCalculated()) {
        fetchTrip();
      }
    }, 5000);
    fetchTrip();
  }, []);

  if (tripDetailData === null) {
    return <></>;
  }

  if (tripIsCalculated() === false) {
    return (
      <Box display="flex" p={4} width="100%">
        <Card shadow="xl" width="100%">
          <CardHeader>
            <Heading size="md">
              Dein Trip nach {tripDetailData.city}, {tripDetailData.country}{" "}
              wird noch geplant ...
            </Heading>
            <CardBody>
              <Text>Hab bitte etwas Geduld</Text>
            </CardBody>
          </CardHeader>
        </Card>
      </Box>
    );
  }

  return (
    <Box display="flex" p={4} width="100%">
      <Card shadow="xl" width="100%">
        <CardHeader>
          <Heading size="md">
            Dein Trip nach {tripDetailData.city}, {tripDetailData.country}
          </Heading>
          <CardBody>
            <Tabs variant="enclosed" width="100%">
              <TabList>
                {tripDetailData.advises
                  .filter((advice) => advice.state === "2")
                  .map((advice, key) => (
                    <Tab key={key}>Tag {key + 1}</Tab>
                  ))}
                {tripDetailData.advises
                  .filter((advice) => advice.state === "1")
                  .map((advice, key) => (
                    <Tab key={key} disabled={true}>
                      Wird noch berechnet ...
                    </Tab>
                  ))}
              </TabList>
              <TabPanels>
                {tripDetailData.advises
                  .filter((advice) => advice.state === "2")
                  .map((advice, key) => (
                    <TabPanel key={key}>
                      <WeatherTable weatherData={advice.weatherSeries} />
                      <MarkdownRenderer markdown={advice.advise} />
                    </TabPanel>
                  ))}
              </TabPanels>
            </Tabs>
          </CardBody>
        </CardHeader>
      </Card>
    </Box>
  );
};

export default TripDetails;
