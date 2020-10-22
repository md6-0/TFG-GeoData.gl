//Imports, requires, variables/constantes globales
const csv = require("csvtojson");

import { MapboxLayer } from "@deck.gl/mapbox";
import { ScatterplotLayer } from "@deck.gl/layers";
import { IconLayer } from "@deck.gl/layers";
import { GridLayer } from "@deck.gl/aggregation-layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";

var mapboxgl = require("mapbox-gl/dist/mapbox-gl.js");
mapboxgl.accessToken =
  "pk.eyJ1IjoibWRuNiIsImEiOiJja2ZsZHRoMXAyMHk5MnlvMzJ3azliNzVoIn0.TVyz96dtNAH7PtNb8Yw_2g";
const account = "mapbox://styles/mdn6/";
var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mdn6/ckfzc89xt07rg19o3ljldgzv0",
  center: { lat: 40.0, lng: 2.0 },
  zoom: 3,
});

//Variables globales para el mapa
var data; //Aquí guardamos el contenido del archivo en forma de json
var capaPuntos = ""; //Var para guardar la capa de puntos
var capaChinchetas = ""; //Var para guardar la capa de chinchetas
var capaCalor3D = ""; //Var para guardar la capa de calor 3D
var capaCalor = ""; //Var para guardar la capa de calor
var capaHex = ""; //Var para guardar la capa de hex
var nombreCampoLat = ""; //Aquí guardamos el nombre del campo de la lat
var nombreCampoLon = ""; //Aquí guardamos el nombre del campo de la lon
var nombreCampos = []; //Nos guardamos el nombre de todos los campos del archivo
var mostrarCapas = false; //Flag para saber si hay que dibujar todas las capas
var mostrarCapaPuntos = false; //Flag para saber si hay que dibujar la capa de puntos
var mostrarCapaChinchetas = false; //Flag para saber si hay que dibujar la capa de chinchetas
var mostrarCapaCalor3D = false; //Flag para saber si hay que dibujar la capa de calor 3D
var mostrarCapaCalor = false; //Flag para saber si hay que dibujar la capa de calor
var mostrarCapaHex = false; //Flag para saber si hay que dibujar la capa de hexagonos
var mostrarCapaCaminos = false; //Flag para saber si hay que dibujar la capa de hexagonos

//Variables globales para la interfaz
var docSubido = false;

//Selectores ---------------------------------------------------------------------------------------------
//Para el asistente
const asistente = document.getElementById("asistente");
const btnsSiguiente = document.querySelectorAll(".btn-asistente");
const steps = document.querySelectorAll(".step");
const btnsRepreContainer = document.getElementById("representacion-btns");
const btnsTemaContainer = document.getElementById("tema-btns");
const temaBtns = document.querySelectorAll(".tema-btn");
const input = document.getElementById("inputArchivo");
const infoInput = document.getElementById("infoInput");

//Para panel de control
const menu = document.getElementById("menu");
const navPanelControl = document.querySelector(".nav");
const paneles = document.querySelectorAll(".panel");
const panelMapa = document.querySelector(".panel-mapa");
const bolas = document.querySelectorAll(".bola");
const infoBox = document.getElementById("infoBox");

//Listeners ----------------------------------------------------------------------------------------------
btnsSiguiente.forEach((btn) => btn.addEventListener("click", stepControler)); //Controlamos las etapas del asistente (Asistente)
input.addEventListener("change", inputController); //Controlamos si suben un archivo (Asistente)
btnsRepreContainer.addEventListener("click", btnsControler); //Controlamos los btns del tipo de representación (Asistente)
btnsTemaContainer.addEventListener("click", btnsControler); //Controlamos los btns del tema del mapa (Asistente)
navPanelControl.addEventListener("click", panelControler); //Controlamos las tabs del panel de control (web app)
panelMapa.addEventListener("click", temasControler); //Controlamos los btns del temad del mapa (web app)

//Controladores ------------------------------------------------------------------------------------------
//Para el asistente de config.
function inputController(e) {
  //Leemos el archivo del input con FileReader
  var file = e.target.files[0];
  if (!file) {
    return;
  }

  //Avisamos de que estamos trabajando
  infoInput.style.color = "#70b77e";
  infoInput.innerHTML = "Leyendo el archivo...";

  var lector = new FileReader();
  lector.onload = function () {
    //Comprobar extension, parsear/convertir archivo, obtener lat/lon, crear las capas y mostrar mensaje
    let extension = file.name.split(".").pop();
    if (extension === "json" && JSON.parse(lector.result)) {
      data = JSON.parse(lector.result);
      docSubido = true;
      encontrarLatLon();
      crearCapas();
      infoInput.innerHTML = "Archivo leído correctamente.";
      infoInput.style.color = "#70b77e";
    } else if (extension === "csv") {
      (async () => {
        data = await csv({ checkType: true }).fromString(lector.result);
        docSubido = true;
        encontrarLatLon();
        crearCapas();
        infoInput.innerHTML = "Archivo leído correctamente.";
        infoInput.style.color = "#70b77e"
      })();
    }
    else {
      infoInput.style.color = "#fe5f55";
      infoInput.innerHTML = "¡Vaya! No conseguimos leer tu archivo. Inténtalo con otro archivo.";
    }

  };
  lector.readAsText(file);
}

function encontrarLatLon() {
  //Iteramos sobre los nombres de los campos buscando lat y lon
  let index = 0;
  for (var key in data[0]) {
    nombreCampos[index] = key;
    if (
      key === "lat" ||
      key === "lati" ||
      key === "latitude" ||
      key === "latitud" ||
      key === "LAT" ||
      key === "LATI" ||
      key === "LATITUDE" ||
      key === "LATITUD"
    ) {
      nombreCampoLat = key;
      console.log("campo lat : " + nombreCampoLat);
    } else if (
      key === "lon" ||
      key === "long" ||
      key === "longitude" ||
      key === "longitud" ||
      key === "LON" ||
      key === "LONG" ||
      key === "LONGITUDE" ||
      key === "LONGITUD"
    ) {
      nombreCampoLon = key;
      console.log("campo lon : " + nombreCampoLon);
    }
    index++;
  }
}

function stepControler(e) {
  //Desactivamos todos los steps si ya tenemos un doc con datos
  steps.forEach((step) => {
    if (docSubido) {
      step.classList.remove("step-active");
    }
  });

  //Activamos el step que correponda
  switch (e.target.classList[0]) {
    case "-2":
      steps[1].classList.add("step-active");
      //volvemos al segundo paso
      break;
    case "-1":
      steps[0].classList.add("step-active");
      //volvemos al primer paso
      break;
    case "0":
      if (docSubido) {
        steps[1].classList.add("step-active");
      } else {
        infoInput.innerHTML = "¡Ups! Selecciona un archivo de datos antes de continuar.";
        infoInput.style.color = "#fe5f55"
      }

      //pasamos al segundo paso
      break;
    case "1":
      steps[2].classList.add("step-active");
      //pasamos al tercer paso
      break;
    case "2":
      //accedemos a la web app
      asistente.style = "display: none;";
      menu.style = "display: flex;";
      infoBox.style = "display: block;";
      break;
  }
}

function btnsControler(e) {
  //Comprobamos desde que interfaz se está llamando
  if (
    e.target.classList[0] === "representacion-btn" ||
    e.target.classList[0] === "representacion-btn-active"
  ) {
    //Si hacesmos click sobre un btn activo lo desactivamos
    //Si no estaba activo lo activamos
    if (e.target.classList[2] === "representacion-btn-active") {
      e.target.classList.remove("representacion-btn-active");
    } else {
      //Activamos el botón correspondiente y activamos el flag de mostrar capas
      e.target.classList.add("representacion-btn-active");
      mostrarCapas = true;
    }
    //Mandamos a capasControler el index para active o desactive
    capasControler(e.target.classList[1]);
  } else if (e.target.classList[0] === "tema-btn") {
    //Desactivamos todos los botones
    temaBtns.forEach((btn) => {
      btn.classList.remove("tema-btn-active");
    });
    //Activamos el botón correspondiente
    e.target.classList.add("tema-btn-active");
    //Mandamos a temasControler el index para que lo maneje
    temasControler(e.target.classList[1]);
  }
}

//Para el menú de config.
function panelControler(e) {
  //Si clicas en ul se para ejecución
  //Se hace así porque el pointer-events: none;
  //Evita el click sobre los hijos de la lista y no lo queremos
  if (e.target.tagName.toLowerCase() === "ul") {
    return;
  }
  //Desactivamos todos los paneles
  paneles.forEach((panel) => {
    panel.classList.remove("panel-active");
  });

  //Gracias a la clase[0] sabemos sobre que li hemos hecho clic.
  //Activamos el panel que corresponda
  switch (e.target.classList[0]) {
    case "0":
      paneles[0].classList.add("panel-active");
      break;
    case "1":
      paneles[1].classList.add("panel-active");
      break;
    case "2":
      paneles[2].classList.add("panel-active");
      break;
    case "3":
      paneles[3].classList.add("panel-active");
      break;
    default:
      break;
  }
}

function capasControler(e) {
  //Si e es un número: estamos llamando desde el asistente
  //Si no: estamos llamando desde el panel de config.
  let index = 0;
  if (e >= 0 && e < 6) {
    index = e;
  } else {
    index = e.target.classList[0];
  }

  //Según el index activamos o desactivamos la capa que toque 
  switch (index) {
    case "0": //Capa de puntos
      if (mostrarCapaPuntos) {
        mostrarCapaPuntos = false;
        console.log("DESactivada capa de puntos");
      } else {
        mostrarCapaPuntos = true;
        console.log("Activada capa de puntos");
      }
      break;
    case "1": //Capa de chichetas
      if (mostrarCapaChinchetas) {
        mostrarCapaChinchetas = false;
        console.log("DESactivada capa de chichets");
      } else {
        mostrarCapaChinchetas = true;
        console.log("Activada capa de chichetas");
      }
      break;
    case "2": //Capa de calor 3D
      if (mostrarCapaCalor3D) {
        mostrarCapaCalor3D = false;
        console.log("DESactivada capa de calor3D");
      } else {
        mostrarCapaCalor3D = true;
        console.log("Activada capa de calor3D");
      }
      break;
    case "3": //Capa de calor
      if (mostrarCapaCalor) {
        mostrarCapaCalor = false;
        console.log("DESactivada capa de cluster");
      } else {
        mostrarCapaCalor = true;
        console.log("Activada capa de clusters");
      }
      break;
    case "4": //Capa de hexágonos
      if (mostrarCapaHex) {
        mostrarCapaHex = false;
        console.log("DESactivada capa de hex");
      } else {
        mostrarCapaHex = true;
        console.log("Activada capa de hex");
      }
      break;
    case "5": //Capa de caminos
      if (mostrarCapaCaminos) {
        mostrarCapaCaminos = false;
        console.log("DESactivada capa de caminos");
      } else {
        mostrarCapaCaminos = true;
        console.log("Activada capa de caminos");
      }
      break;
    default:
      break;
  }

  //Llamamos a update layer para que redibujar el mapa.
  updateLayers();
}

function temasControler(e) {
  //Si e es un número: estamos llamando desde el asistente
  //Si no: estamos llamando desde el panel de config.
  let index = 0;
  if (e >= 0 && e < 6) {
    index = e;
  } else {
    index = e.target.classList[0];
  }

  //Ponemos las bolas del panel en rojo
  bolas.forEach((bola) => {
    bola.src = "./assets/imgs/no.svg";
  });
  //Actualizamos la bola del tema asignado
  bolas[index].src = "./assets/imgs/yes.svg";

  //Cambiamos el tema del mapa
  switch (index) {
    case "0":
      map.setStyle(account + "ckfzbshld135b19qx61b9midj");
      break;
    case "1":
      map.setStyle(account + "ckfzc1hj713al19niu6ixn421");
      break;
    case "2":
      map.setStyle(account + "ckfzc2og7138519ml3rpgkmyy");
      break;
    case "3":
      map.setStyle(account + "ckfzbxsid07i319o3q6w1ru39");
      break;
    case "4":
      map.setStyle(account + "ckfzc6vsx13fb19nydfwx65fw");
      break;
    case "5":
      map.setStyle(account + "ckfzc89xt07rg19o3ljldgzv0");
      break;
    default:
      break;
  }
  //Mostramos las capas
  mostrarCapas = true;
}

//Controladores del mapa ----------------------------------------------------------------------------
//Constructores de capas
function crearCapas() {
  //Capa de puntos
  capaPuntos = new MapboxLayer({
    id: "points",
    type: ScatterplotLayer,
    data: data,
    radiusMinPixels: 3,
    radiusMaxPixels: 7,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    getFillColor: (d) =>
      d.n_killed > 0 ? [200, 0, 40, 150] : [255, 140, 0, 100],
    pickable: true,
    onHover: ({ object, x, y }) => {
      const info = document.getElementById("info");
      if (object) {
        info.innerHTML = "";
        info.innerHTML =
          info.innerHTML +
          "<p>Coordenadas : [" +
          object[nombreCampoLat] +
          " , " +
          object[nombreCampoLon] +
          "]</p>";
        for (let i = 0; i < nombreCampos.length; i++) {
          if (
            nombreCampos[i] !== nombreCampoLat &&
            nombreCampos[i] !== nombreCampoLon
          ) {
            info.innerHTML =
              info.innerHTML +
              "<p id>" +
              nombreCampos[i] +
              " : " +
              object[nombreCampos[i]] +
              "</p>";
          }
        }
      } else {
        // info.innerHTML = "";
      }
    },
  });

  const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
  };
  capaChinchetas = new MapboxLayer({
    id: "icon-layer",
    type: IconLayer,
    data: data,
    iconAtlas:
      "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
    iconMapping: ICON_MAPPING,
    getIcon: (d) => "marker",
    getSize: (d) => 30,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    getColor: (d) => [Math.sqrt(d.exits), 140, 0],
    pickable: true,
    onHover: ({ object, x, y }) => {
      const info = document.getElementById("info");
      if (object) {
        info.innerHTML = "";
        info.innerHTML =
          info.innerHTML +
          "<p>Coordenadas : [" +
          object[nombreCampoLat] +
          " , " +
          object[nombreCampoLon] +
          "]</p>";
        for (let i = 0; i < nombreCampos.length; i++) {
          if (
            nombreCampos[i] !== nombreCampoLat &&
            nombreCampos[i] !== nombreCampoLon
          ) {
            info.innerHTML =
              info.innerHTML +
              "<p id>" +
              nombreCampos[i] +
              " : " +
              object[nombreCampos[i]] +
              "</p>";
          }
        }
      } else {
        // info.innerHTML = "";
      }
    },
  });

  capaCalor3D = new MapboxLayer({
    id: "heat3D",
    type: GridLayer,
    data: data,
    pickable: true,
    extruded: true,
    cellSize: 200,
    elevationScale: 10,
    colorDomain: [1, 100],
    opacity: 0.7,
    coverage: 0.7,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    onHover: ({ object, x, y }) => {
      const info = document.getElementById("info");
      if (object) {
        info.innerHTML = "";
        info.innerHTML =
          info.innerHTML +
          "<p>Coordenadas aprox. : [" +
          object.points[0][nombreCampoLat] +
          " , " +
          object.points[0][nombreCampoLon] +
          "]</p>" +
          "<p>Elementos en este área : " +
          object.count +
          " </p>";
      } else {
        // info.innerHTML = "";
      }
    },
  });

  capaCalor = new MapboxLayer({
    id: "heat",
    type: HeatmapLayer,
    data: data,
    radiusPixels: 50,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
  });

  capaHex = new MapboxLayer({
    id: "hex",
    data: data,
    type: HexagonLayer,
    getPosition: (d) => [d[nombreCampoLon], d[nombreCampoLat]],
    getElevationWeight: (d) => d.n_killed * 2 + d.n_injured,
    elevationScale: 100,
    extruded: true,
    radius: 1609,
    opacity: 0.6,
    coverage: 0.88,
    getFillColor: (d) =>
      d.n_killed > 0 ? [200, 0, 40, 150] : [255, 255, 0, 100],
  });
}

//Eventos del mapa ----------------------------------------------------------------------------------------
map.on("styledata", () => {
  if (mostrarCapas) {
    if (mostrarCapaPuntos) {
      map.addLayer(capaPuntos);
    }
    if (mostrarCapaChinchetas) {
      map.addLayer(capaChinchetas);
    }
    if (mostrarCapaCalor3D) {
      map.addLayer(capaCalor3D);
    }
    if (mostrarCapaCalor) {
      map.addLayer(capaCalor);
    }
    if (!map.getLayer("hex")) {
      //  map.addLayer(capaHex);
    }
  }
});


function updateLayers() {
  if (mostrarCapas) {
    if (mostrarCapaPuntos) {
      map.addLayer(capaPuntos);
    } else {
      map.removeLayer('points');
    }
    if (mostrarCapaChinchetas) {
      map.addLayer(capaChinchetas);
    } else {
      map.removeLayer('icon-layer');
    }
    if (mostrarCapaCalor3D) {
      map.addLayer(capaCalor3D);
    }
    else {
      map.removeLayer('heat3D');
    }
    if (mostrarCapaCalor) {
      map.addLayer(capaCalor);
    } else {
      map.removeLayer('heat');
    }
    if (!map.getLayer('hex')) {
      //  map.addLayer(capaHex);
    }
  }
  map.triggerRepaint();
}
