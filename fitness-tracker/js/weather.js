const MET_USER_AGENT = 'FitPulse/1.0 github.com/chrisva/fitness-tracker';

const WMO_ICONS = {
  clearsky: '☀️', fair: '🌤️', partlycloudy: '⛅', cloudy: '☁️',
  fog: '🌫️', lightrainshowers: '🌦️', rainshowers: '🌧️',
  heavyrainshowers: '⛈️', lightrain: '🌧️', rain: '🌧️', heavyrain: '⛈️',
  lightsleet: '🌨️', sleet: '🌨️', heavysleet: '❄️',
  lightsnow: '🌨️', snow: '❄️', heavysnow: '❄️',
  thunderstorm: '⛈️', lightrainshowersandthunder: '⛈️',
};

function metIcon(symbolCode) {
  if (!symbolCode) return '🌡️';
  const base = symbolCode.replace(/_day|_night|_polartwilight/, '');
  return WMO_ICONS[base] ?? '🌡️';
}

function windDir(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function findSlot(timeseries, targetTime) {
  return timeseries.reduce((best, entry) => {
    const diff = Math.abs(new Date(entry.time) - targetTime);
    return diff < Math.abs(new Date(best.time) - targetTime) ? entry : best;
  });
}

function renderSlot(slot, label) {
  const instant = slot.data.instant.details;
  const next1h = slot.data.next_1_hours ?? slot.data.next_6_hours;
  const symbol = next1h?.summary?.symbol_code;
  const precip = next1h?.details?.precipitation_amount ?? 0;
  const time = new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return `
    <div class="weather-slot">
      <div class="weather-slot-label">${label} <span class="weather-time">${time}</span></div>
      <div class="weather-main">
        <span class="weather-icon">${metIcon(symbol)}</span>
        <span class="weather-temp">${Math.round(instant.air_temperature)}°C</span>
      </div>
      <div class="weather-details">
        <span>💨 ${Math.round(instant.wind_speed)} m/s ${windDir(instant.wind_from_direction)}</span>
        ${precip > 0 ? `<span>🌧️ ${precip.toFixed(1)} mm</span>` : ''}
      </div>
    </div>`;
}

function renderError(msg) {
  document.getElementById('weather-widget').innerHTML =
    `<div class="weather-error">⚠️ ${msg}</div>`;
}

async function loadWeather() {
  const widget = document.getElementById('weather-widget');
  widget.innerHTML = '<div class="weather-loading">Locating…</div>';

  let coords;
  try {
    coords = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(
        p => resolve(p.coords),
        err => reject(err),
        { timeout: 8000 }
      )
    );
  } catch {
    renderError('Location access denied — enable it to see weather.');
    return;
  }

  const { latitude: lat, longitude: lon } = coords;
  widget.innerHTML = '<div class="weather-loading">Fetching weather…</div>';

  let data;
  try {
    const res = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`,
      { headers: { 'User-Agent': MET_USER_AGENT } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch {
    renderError('Could not reach met.no — try again later.');
    return;
  }

  const series = data.properties.timeseries;
  const now = new Date();
  const plus3h = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const slotNow = findSlot(series, now);
  const slot3h  = findSlot(series, plus3h);

  widget.innerHTML = `
    <div class="weather-header">
      <span class="weather-title">🌍 Weather near you</span>
      <span class="weather-coords">${lat.toFixed(2)}°, ${lon.toFixed(2)}°</span>
    </div>
    <div class="weather-slots">
      ${renderSlot(slotNow, 'Now')}
      <div class="weather-divider">→</div>
      ${renderSlot(slot3h, 'In 3h')}
    </div>
    <div class="weather-source">Source: <a href="https://www.yr.no" target="_blank" rel="noopener">Yr/met.no</a></div>`;
}

loadWeather();
