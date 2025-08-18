import axios from 'axios';

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocodeResult {
  address_components: AddressComponent[];
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GeocodeResponse {
  results: GeocodeResult[];
  status: string;
}

export default async function validateAddress(address: string, zipcode: string, country: string) {
  const apiKey = process.env.GOOGLE_API_KEY;

  // Combine into one query
  const query = `${address}, ${zipcode}, ${country}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;

  const { data } = await axios.get<GeocodeResponse>(url);

  if (data.status !== 'OK') {
    throw new Error('Invalid address or postal code');
  }

  const result = data.results[0];

  const postalCodeComponent = result.address_components.find((comp: AddressComponent) =>
    comp.types.includes('postal_code'),
  );

  if (!postalCodeComponent || postalCodeComponent.long_name !== zipcode) {
    throw new Error('Address and postal code do not match');
  }

  return true;
}
