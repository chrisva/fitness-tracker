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

function renderError(msg, retryable = false) {
  document.getElementById('weather-widget').innerHTML = `
    <div class="weather-error">⚠️ ${msg}
      ${retryable ? '<button onclick="loadWeather()" style="margin-left:12px;padding:4px 10px;border:none;border-radius:8px;cursor:pointer;font-size:0.8rem;">Retry</button>' : ''}
    </div>`;
}

async function loadWeather() {
  const widget = document.getElementById('weather-widget');
  widget.innerHTML = '<div class="weather-loading">Locating…</div>';

  if (!navigator.geolocation) {
    renderError('Geolocation is not supported by this browser.');
    return;
  }

  let coords;
  try {
    coords = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(
        p => resolve(p.coords),
        err => reject(err),
        { timeout: 10000, maximumAge: 60000 }
      )
    );
  } catch (err) {
    const msgs = {
      1: 'Location permission denied — click the lock icon in your browser address bar to allow it.',
      2: 'Location unavailable — your device could not determine its position.',
      3: 'Location request timed out — try again.',
    };
    renderError(msgs[err.code] ?? `Location error (${err.message}).`, err.code !== 1);
    return;
  }

  const { latitude: lat, longitude: lon } = coords;
  widget.innerHTML = '<div class="weather-loading">Fetching weather…</div>';

  let data;
  try {
    // Note: User-Agent is a forbidden header in browsers and is silently dropped.
    // met.no identifies the caller via the Referer header, which browsers set automatically.
    const res = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    renderError(`Could not reach met.no (${err.message}) — try again later.`, true);
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
