import React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Textarea,
  Stack,
  Select,
  FormLabel,
  FormControl,
  Input,
  Button,
} from "@chakra-ui/react";
import axios from "./../../axiosInterceptor";
import { useNavigate } from "react-router-dom";

const getNext14Days = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    dates.push(futureDate);
  }

  return dates;
};

interface Form {
  country: string;
  city: string;
  zipCode: string;
  date: string;
  duration: number;
  preferences: string;
}

const Planner = () => {
  const navigate = useNavigate();
  const dates = getNext14Days();

  const [form, setForm] = React.useState<Form>({
    country: "",
    city: "",
    zipCode: "",
    date: "",
    duration: 1,
    preferences: "",
  });

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setForm((prevFormValue) => ({
      ...prevFormValue,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement | HTMLDivElement>,
  ) => {
    event.preventDefault();
    const parsedForm = {
      start_date: form.date,
      duration: form.duration,
      country: form.country,
      city: form.city,
      zip_code: form.zipCode,
      preferences: form.preferences,
    };
    try {
      const resp = await axios.post(`/api/trip/create`, {
        ...parsedForm,
      });
      console.log(resp);
      const tripId = resp.data.id;
      navigate(`/trips/${tripId}`);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box
      backgroundColor="orange.50"
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4}
    >
      <Card align="center" shadow="md" minWidth="50%">
        <CardHeader>
          <Heading size="md">Plane deinen Kurztrip</Heading>
        </CardHeader>
        <CardBody minWidth="100%">
          <Stack spacing={4} as={"form"} onSubmit={handleSubmit}>
            <FormControl>
              <FormLabel>Land</FormLabel>
              <Input
                variant="solid"
                borderWidth={1}
                id="country"
                name="country"
                required
                placeholder="Spanien"
                aria-label="Ziel-Land"
                value={form.country}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Stadt</FormLabel>
              <Input
                variant="solid"
                borderWidth={1}
                id="city"
                name="city"
                required
                placeholder="Madrid"
                aria-label="Ziel-Stadt"
                value={form.city}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>PLZ (optional)</FormLabel>
              <Input
                variant="solid"
                borderWidth={1}
                id="zipCode"
                name="zipCode"
                placeholder="28001"
                aria-label="Ziel-Stadt"
                value={form.zipCode}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Anreisedatum</FormLabel>
              <Select
                variant="solid"
                borderWidth={1}
                id="date"
                name="date"
                placeholder="Wähle ein Datum"
                aria-label="Datum auswählen"
                value={form.date}
                onChange={handleChange}
                required
              >
                {dates.map((date, index) => (
                  <option key={index} value={date.toISOString().split("T")[0]}>
                    {formatDate(date)}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Reisedauer</FormLabel>
              <Select
                variant="solid"
                borderWidth={1}
                id="duration"
                name="duration"
                aria-label="Reisedauer"
                value={form.duration}
                onChange={handleChange}
              >
                <option value={1}>1 Tag</option>
                <option value={2}>2 Tage</option>
                <option value={3}>3 Tage</option>
                <option value={4}>4 Tage</option>
                <option value={5}>5 Tage</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Präferenzen (optional)</FormLabel>
              <Textarea
                id="preferences"
                name="preferences"
                value={form.preferences}
                onChange={handleChange}
              />
              <Text fontSize="sm" color="gray.500">
                Erzähl uns ein bisschen was über das was du gerne machst.
                Wandern, essen, was auch immer. Wir werden deine persönlichen
                Präferenzen bei uns in den Vorschlägen berücksichtigen.
              </Text>
            </FormControl>
            <FormControl>
              <Button w="100%" type="submit">
                Planen!
              </Button>
            </FormControl>
          </Stack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Planner;
