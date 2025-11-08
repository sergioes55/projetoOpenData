// server.js (COMPLETO Y CORREGIDO)

const express = require('express');
const cors = require('cors');
const oxigraph = require('oxigraph');
const fs = require('fs-extra');
const path = require('path');

console.log("-> [BACKEND] Iniciando servidor...");

const app = express();
app.use(cors());
app.use(express.json());

let store;

async function initializeStore() {
  console.log("--> [DB] Inicializando base de datos en memoria...");
  store = new oxigraph.Store();
  
  const ttlPath = path.join(__dirname, './transformed-data-with-links.ttl');
  console.log(`--> [DB] Leyendo archivo TTL desde: ${ttlPath}`);

  const ttlData = await fs.readFile(ttlPath, 'utf-8');
  console.log(`--> [DB] Archivo TTL leído (${(ttlData.length / 1024).toFixed(2)} KB)`);

  await store.load(ttlData, { format: 'text/turtle' });
  
  console.log("--> [DB] ¡Datos cargados en Oxigraph! Servidor listo para consultas.");
}

// --- 1. FUNCIÓN SPARQLQuery CORREGIDA ---
async function sparqlQuery(query, variables) {
  if (!store) {
    console.error("!!! [ERROR] La base de datos (store) no está inicializada.");
    throw new Error("La base de datos en memoria no está inicializada.");
  }
  
  console.log("--> [SPARQL] Ejecutando consulta...");
  const results = [];
  
  for (const binding of store.query(query)) {
    const result = {};
    for (const varName of variables) {
      const term = binding.get(varName);
      if (term) {
        result[varName] = term.value;
      }
    }
    results.push(result);
  }
  
  console.log(`--> [SPARQL] Consulta finalizada. ${results.length} resultados brutos encontrados.`);
  return results;
}

// --- ENDPOINT DE BICICLETAS (ACTIVO Y CORREGIDO) ---
app.get('/api/bikingStations', async (req, res) => {
  console.log("\n=============================================");
  console.log("-> [REQUEST] ¡Petición recibida en /api/bikingStations!");
  
  const queryVariables = [
    "station", "stationId", "latitude", "longitude", "districtName",
    "addressType", "addressName", "addressNumber"
  ];
  
  const query = `PREFIX ns: <http://www.barnabikes.org/ODKG/handsOn/group10/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?station ?stationId ?latitude ?longitude ?districtName
       ?addressType ?addressName ?addressNumber
WHERE {
  ?station a ns:BikingStation .
  OPTIONAL { ?station ns:stationId ?stationId }
  OPTIONAL {
    ?station ns:hasAddress ?address .
    OPTIONAL { ?address ns:latitude ?latitude }
    OPTIONAL { ?address ns:longitude ?longitude }
    OPTIONAL { ?address ns:addressType ?addressType }
    OPTIONAL { ?address ns:addressName ?addressName }
    OPTIONAL { ?address ns:addressNumber ?addressNumber }
    OPTIONAL {
      ?address ns:hasNeighborhood ?neighborhood .
      ?neighborhood ns:hasDistrict ?district .
      ?district ns:districtName ?districtName .
    }
  }
}`;
  
  try {
    const data = await sparqlQuery(query, queryVariables); 
    console.log(`[Backend] Datos de GraphDB (Bikes): ${data.length} resultados.`);

    console.log("--> [SPARQL] Mostrando los 2 primeros resultados BRUTOS (Bikes):");
    console.log(JSON.stringify(data.slice(0, 2), null, 2));

    console.log("\n--> [TRANSFORM] Transformando datos (Bikes)...");
    const results = data.map(b => {
      const fullAddress = [b.addressType, b.addressName, b.addressNumber].filter(Boolean).join(' ');
      return {
        type: 'bike',
        uri: b.station,
        stationId: b.stationId,
        latitude: b.latitude ? parseFloat(b.latitude) : null,
        longitude: b.longitude ? parseFloat(b.longitude) : null,
        districtName: b.districtName,
        displayName: fullAddress || 'Estación de Bici',
        displayAddress: b.districtName || 'Sin distrito'
      }
    });
    
    console.log(`--> [TRANSFORM] Datos transformados. ${results.length} marcadores de Bicis listos.`);
    console.log("-> [RESPONSE] Enviando JSON de Bicis al frontend.");
    console.log("=============================================\n");
    res.json(results);

  } catch (err) {
    console.error("!!! [ERROR] Ha ocurrido un error en /api/bikingStations:", err.message);
    res.status(500).json({ error: 'SPARQL query failed' });
  }
});


// --- ENDPOINT DE BARES (REACTIVADO Y CORREGIDO) ---
app.get('/api/bars', async (req, res) => {
  console.log("\n=============================================");
  console.log("-> [REQUEST] ¡Petición recibida en /api/bars!");

  const queryVariables = [
    "bar", "barName", "latitude", "longitude", "districtName", "tipo",
    "addressType", "addressName", "addressNumber"
  ];

  const query = `PREFIX ns: <http://www.barnabikes.org/ODKG/handsOn/group10/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?bar ?barName ?latitude ?longitude ?districtName ?tipo
       ?addressType ?addressName ?addressNumber
WHERE {
  ?bar a ns:Bar .
  OPTIONAL { ?bar ns:barName ?barName }
  OPTIONAL { ?bar ns:barType ?tipo } 
  OPTIONAL {
    ?bar ns:hasAddress ?address .
    OPTIONAL { ?address ns:latitude ?latitude }
    OPTIONAL { ?address ns:longitude ?longitude }
    OPTIONAL { ?address ns:addressType ?addressType }
    OPTIONAL { ?address ns:addressName ?addressName }
    OPTIONAL { ?address ns:addressNumber ?addressNumber }
    OPTIONAL {
      ?address ns:hasNeighborhood ?neighborhood .
      ?neighborhood ns:hasDistrict ?district .
      ?district ns:districtName ?districtName .
    }
  }
}`;
  try {
    const data = await sparqlQuery(query, queryVariables);
    console.log(`[Backend] Datos de GraphDB (Bars): ${data.length} resultados.`);

    console.log("--> [SPARQL] Mostrando los 2 primeros resultados BRUTOS (Bars):");
    console.log(JSON.stringify(data.slice(0, 2), null, 2));

    console.log("\n--> [TRANSFORM] Transformando datos (Bars)...");
    const results = data.map(b => {
      const fullAddress = [b.addressType, b.addressName, b.addressNumber].filter(Boolean).join(' ');
      return {
        type: 'bar',
        uri: b.bar,
        barName: b.barName,
        latitude: b.latitude ? parseFloat(b.latitude) : null,
        longitude: b.longitude ? parseFloat(b.longitude) : null,
        districtName: b.districtName,
        displayName: b.barName || 'Bar sin nombre',
        displayAddress: fullAddress || 'Sin dirección',
        barType: b.tipo
      }
    });

    console.log(`--> [TRANSFORM] Datos transformados. ${results.length} marcadores de Bares listos.`);
    console.log("-> [RESPONSE] Enviando JSON de Bares al frontend.");
    console.log("=============================================\n");
    res.json(results);

  } catch (err) {
    console.error("!!! [ERROR] Ha ocurrido un error en /api/bars:", err.message);
    res.status(500).json({ error: 'SPARQL query failed' });
  }
});


// --- ENDPOINT DE DISTRITOS (REACTIVADO Y CORREGIDO) ---
app.get('/api/districts', async (req, res) => {
  console.log("\n=============================================");
  console.log("-> [REQUEST] ¡Petición recibida en /api/districts!");
  
  const queryVariables = ["districtName"];

  const query = `
    PREFIX ns: <http://www.barnabikes.org/ODKG/handsOn/group10/>
    SELECT DISTINCT ?districtName
    WHERE {
      ?district a ns:District .
      ?district ns:districtName ?districtName .
    }
    ORDER BY ?districtName
  `;
  try {
    const data = await sparqlQuery(query, queryVariables);
    
    // La 'data' ahora es [ { districtName: 'Ciutat Vella' }, { districtName: 'Eixample' } ]
    // La transformamos a un array simple de strings
    const results = data.map(b => b.districtName);
    console.log(`--> [TRANSFORM] Datos transformados. ${results.length} distritos listos.`);
    res.json(results);
  } catch (err) {
    console.error("!!! [ERROR] Ha ocurrido un error en /api/districts:", err.message);
    res.status(500).json({ error: 'SPARQL query failed for districts' });
  }
});


const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0'; // <-- 1. AÑADE ESTA LÍNEA

initializeStore()
  .then(() => {
    app.listen(PORT, HOST, () => console.log(`\n-> [BACKEND] Servidor escuchando en http://${HOST}:${PORT}`));
  })
  .catch(error => {
    console.error("!!! [ERROR] Error fatal al inicializar la base de datos:", error);
    process.exit(1);
  });