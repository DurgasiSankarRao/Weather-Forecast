const apiKey = '85d798c21bd0121713783ad5b6b3afad'; // <-- REPLACE with your OpenWeatherMap API key

// Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const currentWeatherSection = document.getElementById('currentWeather');
const currentIconDiv = document.getElementById('currentIcon');
const currentDetailsDiv = document.getElementById('currentDetails');
const forecastSection = document.getElementById('forecast');
const forecastCardsDiv = document.getElementById('forecastCards');
const darkModeToggle = document.getElementById('darkModeToggle');

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeatherByCity(city);
  }
});

locationBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
      },
      error => {
        alert('Could not get your location.');
      }
    );
  } else {
    alert('Geolocation is not supported by your browser.');
  }
});

darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  darkModeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

// Fetch current weather by city name
async function fetchWeatherByCity(city) {
  try {
    const currentData = await fetchCurrentWeather(city);
    const forecastData = await fetchForecast(city);
    displayCurrentWeather(currentData);
    displayForecast(forecastData);
  } catch (error) {
    showError(error.message);
  }
}

// Fetch current weather by latitude & longitude
async function fetchWeatherByCoords(lat, lon) {
  try {
    const currentData = await fetchCurrentWeather(null, lat, lon);
    const forecastData = await fetchForecast(null, lat, lon);
    displayCurrentWeather(currentData);
    displayForecast(forecastData);
  } catch (error) {
    showError(error.message);
  }
}

// Fetch current weather API
async function fetchCurrentWeather(city = null, lat = null, lon = null) {
  let url;
  if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  } else {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error('City not found');
  return res.json();
}

// Fetch 5-day forecast API
async function fetchForecast(city = null, lat = null, lon = null) {
  let url;
  if (city) {
    url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
  } else {
    url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast not found');
  return res.json();
}

// Display current weather data
function displayCurrentWeather(data) {
  currentWeatherSection.classList.remove('hidden');

  const iconCode = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  currentIconDiv.innerHTML = `<img src="${iconUrl}" alt="${data.weather[0].description}" />`;

  currentDetailsDiv.innerHTML = `
    <p><strong>${data.name}, ${data.sys.country}</strong></p>
    <p>🌡 Temperature: ${data.main.temp.toFixed(1)}°C</p>
    <p>🌬 Wind: ${data.wind.speed} m/s</p>
    <p>☁ Condition: ${capitalize(data.weather[0].description)}</p>
    <p>💧 Humidity: ${data.main.humidity}%</p>
  `;
}

// Display 5-day forecast (grouped by day)
function displayForecast(data) {
  forecastSection.classList.remove('hidden');
  forecastCardsDiv.innerHTML = '';

  // OpenWeatherMap forecast provides 3-hour data for 5 days.
  // We'll group by date and take midday (12:00:00) as the day's forecast.
  const forecastByDate = {};

  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    const time = item.dt_txt.split(' ')[1];

    // Pick forecasts at 12:00:00 for simplicity
    if (time === '12:00:00') {
      forecastByDate[date] = item;
    }
  });

  // Take up to 5 days forecast
  const dates = Object.keys(forecastByDate).slice(0, 5);

  dates.forEach(date => {
    const item = forecastByDate[date];
    const iconCode = item.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const dayName = new Date(date).toLocaleDateString(undefined, { weekday: 'short' });

    const card = document.createElement('div');
    card.classList.add('forecast-card');
    card.innerHTML = `
      <p><strong>${dayName}</strong></p>
      <img src="${iconUrl}" alt="${item.weather[0].description}" />
      <p>${item.main.temp.toFixed(1)}°C</p>
      <p>${capitalize(item.weather[0].description)}</p>
    `;

    forecastCardsDiv.appendChild(card);
  });
}

// Show error message
function showError(msg) {
  currentWeatherSection.classList.add('hidden');
  forecastSection.classList.add('hidden');
  alert(msg);
}

// Capitalize first letter helper
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// On page load, try to get location weather automatically
window.addEventListener('load', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // If denied or error, show default city
        fetchWeatherByCity('New York');
      }
    );
  } else {
    fetchWeatherByCity('New York');
  }
});
