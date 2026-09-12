// OpenWeatherMap API configuration
// Sign up at https://openweathermap.org/api to get a free API key
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your OpenWeatherMap API key
const API_BASE_URL = 'https://api.openweathermap.org';

// State management
let currentWeatherData = null;
let forecastData = null;
let isCelsius = true;
let currentCity = '';
let currentLat = null;
let currentLon = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const getCurrentLocationBtn = document.getElementById('getCurrentLocationBtn');
const weatherContainer = document.getElementById('weatherContainer');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const welcome = document.getElementById('welcome');
const toggleUnitBtn = document.getElementById('toggleUnitBtn');
const suggestions = document.getElementById('suggestions');

// Search functionality
searchInput.addEventListener('keyup', handleSearchInput);
searchBtn.addEventListener('click', () => handleSearch(searchInput.value));
getCurrentLocationBtn.addEventListener('click', getCurrentLocation);
toggleUnitBtn.addEventListener('click', toggleTemperatureUnit);

/**
 * Handle search input with suggestions
 */
function handleSearchInput(e) {
    const value = e.target.value.trim();
    
    if (value.length < 2) {
        suggestions.classList.remove('active');
        return;
    }

    // Show popular cities as suggestions
    const popularCities = ['London', 'New York', 'Tokyo', 'Paris', 'Sydney', 'Dubai', 'Singapore', 'Toronto'];
    const filtered = popularCities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
    );

    if (filtered.length > 0) {
        suggestions.innerHTML = filtered
            .map(city => `<div class="suggestion-item" onclick="handleSearch('${city}')">${city}</div>`)
            .join('');
        suggestions.classList.add('active');
    } else {
        suggestions.classList.remove('active');
    }
}

/**
 * Handle search for a city
 */
async function handleSearch(city) {
    if (!city.trim()) return;
    
    suggestions.classList.remove('active');
    await fetchWeatherByCity(city);
}

/**
 * Get user's current location
 */
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    showLoading(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLat = position.coords.latitude;
            currentLon = position.coords.longitude;
            fetchWeatherByCoordinates(currentLat, currentLon);
        },
        (error) => {
            showLoading(false);
            showError('Unable to get your location. Please enable location access.');
        }
    );
}

/**
 * Fetch weather by city name
 */
async function fetchWeatherByCity(city) {
    showLoading(true);
    try {
        // Get city coordinates first
        const geoResponse = await fetch(
            `${API_BASE_URL}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
        );
        const geoData = await geoResponse.json();

        if (!geoData || geoData.length === 0) {
            showError(`City "${city}" not found. Please try another search.`);
            showLoading(false);
            return;
        }

        currentLat = geoData[0].lat;
        currentLon = geoData[0].lon;
        currentCity = `${geoData[0].name}${geoData[0].state ? ', ' + geoData[0].state : ''}, ${geoData[0].country}`;
        
        await fetchWeatherByCoordinates(currentLat, currentLon);
    } catch (err) {
        showError('Failed to fetch weather data. Please check your API key.');
        showLoading(false);
    }
}

/**
 * Fetch weather by coordinates
 */
async function fetchWeatherByCoordinates(lat, lon) {
    showLoading(true);
    try {
        // Fetch current weather and forecast
        const weatherResponse = await fetch(
            `${API_BASE_URL}/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        const forecastResponse = await fetch(
            `${API_BASE_URL}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        const uvResponse = await fetch(
            `${API_BASE_URL}/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );

        if (!weatherResponse.ok || !forecastResponse.ok) {
            showError('Failed to fetch weather data');
            showLoading(false);
            return;
        }

        currentWeatherData = await weatherResponse.json();
        forecastData = await forecastResponse.json();
        const uvData = await uvResponse.json();
        
        currentWeatherData.uvi = uvData.value;

        displayCurrentWeather();
        displayForecast();
        displayHourlyForecast();
        
        showLoading(false);
        welcome.classList.add('hidden');
        weatherContainer.classList.remove('hidden');
        error.classList.add('hidden');
        
        searchInput.value = '';
    } catch (err) {
        showError('Error fetching weather data: ' + err.message);
        showLoading(false);
    }
}

/**
 * Display current weather
 */
function displayCurrentWeather() {
    if (!currentWeatherData) return;

    const data = currentWeatherData;
    const temp = isCelsius ? Math.round(data.main.temp) : Math.round((data.main.temp * 9/5) + 32);
    const feelsLike = isCelsius ? Math.round(data.main.feels_like) : Math.round((data.main.feels_like * 9/5) + 32);
    const windSpeed = isCelsius ? data.wind.speed : (data.wind.speed * 2.237).toFixed(1);
    const windUnit = isCelsius ? 'm/s' : 'mph';
    const visibility = (data.visibility / 1000).toFixed(1);
    const pressure = data.main.pressure;
    const humidity = data.main.humidity;
    const cloudCover = data.clouds.all;

    // Update city info
    document.getElementById('cityName').textContent = currentCity || data.name;
    document.getElementById('currentDate').textContent = formatDate(new Date());

    // Update temperature
    document.getElementById('temperature').textContent = temp;
    document.getElementById('tempUnit').textContent = isCelsius ? '°C' : '°F';

    // Update weather description
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    document.getElementById('feelsLike').textContent = `Feels like ${feelsLike}° ${isCelsius ? '°C' : '°F'}`;

    // Update weather icon
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    document.getElementById('weatherIcon').src = iconUrl;
    document.getElementById('weatherIcon').alt = data.weather[0].description;

    // Update details
    document.getElementById('humidity').textContent = `${humidity}%`;
    document.getElementById('windSpeed').textContent = `${windSpeed} ${windUnit}`;
    document.getElementById('pressure').textContent = `${pressure} hPa`;
    document.getElementById('visibility').textContent = `${visibility} km`;
    document.getElementById('cloudCover').textContent = `${cloudCover}%`;
    document.getElementById('uvIndex').textContent = getUVIndexLabel(data.uvi);

    // Update sunrise and sunset
    document.getElementById('sunrise').textContent = formatTime(data.sys.sunrise);
    document.getElementById('sunset').textContent = formatTime(data.sys.sunset);
}

/**
 * Display 5-day forecast
 */
function displayForecast() {
    if (!forecastData) return;

    const forecasts = {};
    
    // Group forecasts by day
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!forecasts[date]) {
            forecasts[date] = [];
        }
        forecasts[date].push(item);
    });

    const container = document.getElementById('forecastContainer');
    container.innerHTML = '';

    let dayCount = 0;
    Object.keys(forecasts).forEach(date => {
        if (dayCount >= 5) return; // Only show 5 days

        const dayForecasts = forecasts[date];
        const avgTemp = dayForecasts.reduce((sum, item) => sum + item.main.temp, 0) / dayForecasts.length;
        const maxTemp = Math.max(...dayForecasts.map(item => item.main.temp));
        const minTemp = Math.min(...dayForecasts.map(item => item.main.temp));
        const weatherIcon = dayForecasts[0].weather[0].icon;
        const condition = dayForecasts[0].weather[0].description;

        const max = isCelsius ? Math.round(maxTemp) : Math.round((maxTemp * 9/5) + 32);
        const min = isCelsius ? Math.round(minTemp) : Math.round((minTemp * 9/5) + 32);

        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="date">${formatDateShort(new Date(date))}</div>
            <img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" alt="${condition}">
            <div class="condition">${condition}</div>
            <div class="temp-range">
                <span class="max">${max}°</span>
                <span class="divider">/</span>
                <span class="min">${min}°</span>
            </div>
        `;
        container.appendChild(forecastCard);
        dayCount++;
    });
}

/**
 * Display hourly forecast
 */
function displayHourlyForecast() {
    if (!forecastData) return;

    const container = document.getElementById('hourlyContainer');
    container.innerHTML = '';

    // Show next 8 hours
    for (let i = 0; i < Math.min(8, forecastData.list.length); i++) {
        const item = forecastData.list[i];
        const time = new Date(item.dt * 1000);
        const hour = time.getHours().toString().padStart(2, '0') + ':00';
        const temp = isCelsius ? Math.round(item.main.temp) : Math.round((item.main.temp * 9/5) + 32);
        const icon = item.weather[0].icon;
        const rainChance = (item.pop * 100).toFixed(0);

        const hourlyCard = document.createElement('div');
        hourlyCard.className = 'hourly-card';
        hourlyCard.innerHTML = `
            <div class="time">${hour}</div>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="weather">
            <div class="temp">${temp}°</div>
            <div class="rain-chance">💧 ${rainChance}%</div>
        `;
        container.appendChild(hourlyCard);
    }
}

/**
 * Toggle between Celsius and Fahrenheit
 */
function toggleTemperatureUnit() {
    isCelsius = !isCelsius;
    document.getElementById('tempUnit').textContent = isCelsius ? '°C' : '°F';
    displayCurrentWeather();
    displayForecast();
    displayHourlyForecast();
}

/**
 * Get UV index label
 */
function getUVIndexLabel(index) {
    if (index < 3) return `${Math.round(index)} (Low)`;
    if (index < 6) return `${Math.round(index)} (Moderate)`;
    if (index < 8) return `${Math.round(index)} (High)`;
    if (index < 11) return `${Math.round(index)} (Very High)`;
    return `${Math.round(index)} (Extreme)`;
}

/**
 * Format date for display
 */
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format date short
 */
function formatDateShort(date) {
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format time
 */
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Show loading state
 */
function showLoading(show) {
    if (show) {
        loading.classList.remove('hidden');
        weatherContainer.classList.add('hidden');
        welcome.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

/**
 * Show error message
 */
function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
    showLoading(false);
}

// Initialize app
window.addEventListener('load', () => {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('⚠️ API Key not configured. Please replace "YOUR_API_KEY_HERE" with your OpenWeatherMap API key in weather-script.js');
    }
});
