# Tarea: Graficas Interactivas (OpenStreetMap + OpenWeatherMap)

## Archivos
- `index.html`: estructura de la web y enlaces a Leaflet + Chart.js.
- `styles.css`: estilos responsive para mapa, panel y graficas.
- `app.js`: logica de mapa, geolocalizacion, fetch a APIs y render de datos.

## Funcionalidades implementadas
- Mapa de OpenStreetMap navegable por todo el planeta.
- Solicitud de geolocalizacion inicial del navegador.
- Seleccion de POI con clic en el mapa (y marcador arrastrable).
- Lectura y visualizacion de latitud y longitud seleccionadas.
- Consulta de OpenWeatherMap:
  - Tiempo actual (`/data/2.5/weather`).
  - Prediccion 5 dias cada 3 horas (`/data/2.5/forecast`).
- Visualizacion de datos actuales:
  - Ciudad cercana.
  - Descripcion e icono.
  - Temperatura, min/max, sensacion termica.
  - Humedad, presion, viento y precipitacion.
- Graficas:
  - Lineal de temperatura en el pronostico.
  - Mixta de humedad (barras) y viento (linea).

## Como usar
1. Abre `tarea/graficas/index.html` en un servidor local (por ejemplo Live Server).
2. Pega tu API Key de OpenWeatherMap en el campo superior.
3. Permite la geolocalizacion o pulsa sobre cualquier punto del mapa.
4. Pulsa `Cargar clima del punto` (o usa clic/arrastre en mapa para recargar).

## Nota API Key
Debes registrarte en OpenWeatherMap y usar una API Key valida en la interfaz.
Sin API Key, las consultas devoleran error.

## Solucion de problemas
- Si aparece `OpenWeatherMap: Invalid API key`, revisa que la clave este bien copiada.
- Las claves nuevas pueden tardar en activarse (a veces entre 10 minutos y 2 horas).
- Abre la web con servidor local (`localhost` con Live Server) y no solo con doble clic al archivo.
