import { WeatherData } from "../types";

const METEO_API_URL = "https://api.open-meteo.com/v1/forecast";

export const fetchLocationWeather = async (lat: number, lng: number, locationName: string): Promise<WeatherData | undefined> => {
    try {
        const params = new URLSearchParams({
            latitude: lat.toString(),
            longitude: lng.toString(),
            current: 'temperature_2m,weather_code,is_day',
            timezone: 'auto'
        });

        const res = await fetch(`${METEO_API_URL}?${params.toString()}`);
        if (!res.ok) return undefined;
        
        const data = await res.json();
        const current = data.current;

        if (!current) return undefined;

        return {
            temp: current.temperature_2m,
            conditionCode: current.weather_code,
            isDay: current.is_day === 1,
            location: locationName,
            lat,
            lng
        };

    } catch (e) {
        return undefined;
    }
};

export const getWeatherDescription = (code: number): string => {
    if (code === 0) return 'Clear sky';
    if (code >= 1 && code <= 3) return 'Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 86) return 'Snowy';
    if (code >= 95) return 'Stormy';
    return 'Variable';
};