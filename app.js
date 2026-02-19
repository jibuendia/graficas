const DEFAULT_COORDS = { lat: 40.4168, lon: -3.7038 };

const state = {
  selectedLat: DEFAULT_COORDS.lat,
  selectedLon: DEFAULT_COORDS.lon,
  map: null,
  marker: null,
  tempChart: null,
  humidityWindChart: null
};

const refs = {
  apiKey: document.getElementById("apiKey"),
  btnLocate: document.getElementById("btnLocate"),
  btnLoadWeather: document.getElementById("btnLoadWeather"),
  status: document.getElementById("status"),
  latValue: document.getElementById("latValue"),
  lngValue: document.getElementById("lngValue"),
  cityValue: document.getElementById("cityValue"),
  currentWeather: document.getElementById("currentWeather")
};

function setStatus(message, isError = false) {
  refs.status.textContent = message;
  refs.status.style.color = isError ? "#b42318" : "#4f6479";
}

function hasApiKey() {
  return refs.apiKey.value.trim().length > 0;
}

async function parseApiResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.message || `HTTP ${response.status}`;
    throw new Error(`OpenWeatherMap: ${detail}`);
  }
  return payload;
}

function fmt(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function setSelectedPoint(lat, lon, zoom = false) {
  state.selectedLat = lat;
  state.selectedLon = lon;

  refs.latValue.textContent = fmt(lat, 5);
  refs.lngValue.textContent = fmt(lon, 5);

  if (!state.marker) {
    state.marker = L.marker([lat, lon], { draggable: true }).addTo(state.map);
    state.marker.on("dragend", (event) => {
      const p = event.target.getLatLng();
      setSelectedPoint(p.lat, p.lng, false);
      if (hasApiKey()) {
        loadWeather();
      } else {
        setStatus("Punto actualizado. Introduce API Key y pulsa cargar clima.");
      }
    });
  } else {
    state.marker.setLatLng([lat, lon]);
  }

  if (zoom) {
    state.map.setView([lat, lon], 11, { animate: true });
  }
}

function buildCurrentMetrics(current) {
  const rain = current.rain?.["1h"] ?? 0;
  const weatherText = current.weather?.[0]?.description ?? "sin descripcion";
  const iconCode = current.weather?.[0]?.icon;
  const icon = iconCode ? `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Icono del tiempo">` : "";

  refs.currentWeather.innerHTML = `
    <article class="metric">
      <small><span class="metric-icon" aria-hidden="true">&#9729;</span>Descripcion</small>
      <strong>${weatherText}</strong>
      <div>${icon}</div>
    </article>
    <article class="metric"><small><span class="metric-icon" aria-hidden="true">&#127777;</span>Temperatura</small><strong>${fmt(current.main.temp, 1)} C</strong></article>
    <article class="metric"><small><span class="metric-icon" aria-hidden="true">&#8597;</span>Min / Max</small><strong>${fmt(current.main.temp_min, 1)} C / ${fmt(current.main.temp_max, 1)} C</strong></article>
    <article class="metric"><small><span class="metric-icon" aria-hidden="true">&#127787;</span>Sensacion termica</small><strong>${fmt(current.main.feels_like, 1)} C</strong></article>
    <article class="metric"><small><span class="metric-icon" aria-hidden="true">&#128167;</span>Humedad</small><strong>${current.main.humidity}%</strong></article>
    <article class="metric"><small><span class="metric-icon" aria-hidden="true">&#9201;</span>Presion</small><strong>${current.main.pressure} hPa</strong></article>
    <article class="metric"><small><span class="metric-icon" aria-hidden="true">&#127788;</span>Viento</small><strong>${fmt(current.wind.speed, 1)} m/s (${current.wind.deg} deg)</strong></article>
    <article class="metric"><small><span class="metric-icon" aria-hidden="true">&#127783;</span>Precipitacion (1h)</small><strong>${rain} mm</strong></article>
  `;
}

function upsertCharts(forecast) {
  const labels = forecast.list.map((item) => {
    const date = new Date(item.dt * 1000);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  });

  const temperatures = forecast.list.map((item) => item.main.temp);
  const humidity = forecast.list.map((item) => item.main.humidity);
  const wind = forecast.list.map((item) => item.wind.speed);

  if (state.tempChart) {
    state.tempChart.destroy();
  }

  if (state.humidityWindChart) {
    state.humidityWindChart.destroy();
  }

  state.tempChart = new Chart(document.getElementById("tempChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Temperatura (C)",
          data: temperatures,
          borderColor: "#0a7ea4",
          backgroundColor: "rgba(10, 126, 164, 0.2)",
          pointRadius: 2,
          tension: 0.28,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 120,
      plugins: {
        legend: { display: true }
      },
      scales: {
        x: { ticks: { maxRotation: 70, minRotation: 55 } }
      }
    }
  });

  state.humidityWindChart = new Chart(document.getElementById("humidityWindChart"), {
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Humedad (%)",
          data: humidity,
          backgroundColor: "rgba(247, 183, 51, 0.55)",
          borderColor: "#d89817",
          borderWidth: 1,
          yAxisID: "y"
        },
        {
          type: "line",
          label: "Viento (m/s)",
          data: wind,
          borderColor: "#04546e",
          backgroundColor: "rgba(4, 84, 110, 0.2)",
          tension: 0.25,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 120,
      scales: {
        y: {
          beginAtZero: true,
          position: "left"
        },
        y1: {
          beginAtZero: true,
          position: "right",
          grid: { drawOnChartArea: false }
        },
        x: { ticks: { maxRotation: 70, minRotation: 55 } }
      }
    }
  });
}

async function loadWeather() {
  const apiKey = refs.apiKey.value.trim();
  if (!apiKey) {
    setStatus("Introduce una API Key valida de OpenWeatherMap.", true);
    return;
  }

  const lat = state.selectedLat;
  const lon = state.selectedLon;

  setStatus("Consultando OpenWeatherMap...");

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${apiKey}`;

    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(weatherUrl),
      fetch(forecastUrl)
    ]);

    const [current, forecast] = await Promise.all([
      parseApiResponse(weatherResponse),
      parseApiResponse(forecastResponse)
    ]);

    refs.cityValue.textContent = current.name || "Sin ciudad";
    buildCurrentMetrics(current);
    upsertCharts(forecast);

    setStatus(`Datos cargados para ${current.name || "ubicacion seleccionada"}.`);
  } catch (error) {
    if (error instanceof TypeError) {
      setStatus("Error de red/CORS. Abre la web con Live Server o localhost y revisa conexion.", true);
      return;
    }
    setStatus(error.message || "Error desconocido al consultar OpenWeatherMap.", true);
  }
}

function locateUser() {
  if (!navigator.geolocation) {
    setStatus("Tu navegador no soporta geolocalizacion.", true);
    return;
  }

  setStatus("Solicitando permiso de geolocalizacion...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      setSelectedPoint(latitude, longitude, true);
      if (hasApiKey()) {
        setStatus("Ubicacion detectada. Consultando clima...");
        loadWeather();
      } else {
        setStatus("Ubicacion detectada. Introduce API Key y pulsa cargar clima.");
      }
    },
    () => {
      setStatus("No se pudo obtener tu ubicacion. Puedes seleccionar un punto manualmente.", true);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function initMap() {
  state.map = L.map("map", {
    worldCopyJump: true,
    minZoom: 2
  }).setView([DEFAULT_COORDS.lat, DEFAULT_COORDS.lon], 3);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(state.map);

  state.map.on("click", (event) => {
    setSelectedPoint(event.latlng.lat, event.latlng.lng, false);
    if (hasApiKey()) {
      setStatus("Punto actualizado. Consultando clima...");
      loadWeather();
    } else {
      setStatus("Punto actualizado con clic en mapa. Introduce API Key y pulsa cargar clima.");
    }
  });

  setSelectedPoint(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, false);
}

function initEvents() {
  refs.btnLocate.addEventListener("click", locateUser);
  refs.btnLoadWeather.addEventListener("click", loadWeather);
}

initMap();
initEvents();
locateUser();
