import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";
import { Board, Cell } from "./board";
import { Geocache, Coin } from "./cache";

const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0533,
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const MOVE_INCREMENT = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const PIT_SPAWN_PROBABILITY = 0.1;
const board: Board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);
const caches = new Map<string, string>();
let currentPits: leaflet.Layer[] = [];
let collectedCoins: Coin[] = [];
let playerLocation: leaflet.LatLng;

const mapContainer = document.querySelector<HTMLElement>("#map")!;

const map = leaflet.map(mapContainer, {
  center: MERRILL_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const playerMarker = leaflet.marker(MERRILL_CLASSROOM);
playerMarker.bindTooltip("It's you!");
playerMarker.addTo(map);
playerLocation = MERRILL_CLASSROOM;

//Sensor Button
const sensorButton = document.querySelector("#sensor")!;
sensorButton.addEventListener("click", () => {
  navigator.geolocation.watchPosition((position) => {
    playerLocation = leaflet.latLng(
      position.coords.latitude,
      position.coords.longitude
    );
    updatePlayerLocation();
  });
});

//Navigation Buttons
const northButton = document.querySelector("#north")!;
northButton.addEventListener("click", () => {
  playerLocation = leaflet.latLng(
    playerLocation.lat + MOVE_INCREMENT,
    playerLocation.lng
  );
  updatePlayerLocation();
});

const southButton = document.querySelector("#south")!;
southButton.addEventListener("click", () => {
  playerLocation = leaflet.latLng(
    playerLocation.lat - MOVE_INCREMENT,
    playerLocation.lng
  );
  updatePlayerLocation();
});

const eastButton = document.querySelector("#east")!;
eastButton.addEventListener("click", () => {
  playerLocation = leaflet.latLng(
    playerLocation.lat,
    playerLocation.lng + MOVE_INCREMENT
  );
  updatePlayerLocation();
});

const westButton = document.querySelector("#west")!;
westButton.addEventListener("click", () => {
  playerLocation = leaflet.latLng(
    playerLocation.lat,
    playerLocation.lng - MOVE_INCREMENT
  );
  updatePlayerLocation();
});

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";

generatePitsInRange();

function generatePitsInRange() {
  const nearbyCells = board.getCellsNearPoint(playerMarker.getLatLng());

  currentPits.forEach((element) => {
    element.removeFrom(map);
  });

  nearbyCells.forEach((element) => {
    const { i, j } = element;

    if (luck([i, j].toString()) < PIT_SPAWN_PROBABILITY) {
      makePit(i, j);
    }
  });
    
}

function makePit(i: number, j: number) {
    const element: Cell = { i: i, j: j };
    const key = generateCellKey(element);
  const bounds = board.getCellBounds(element);
  const pit = leaflet.rectangle(bounds) as leaflet.Layer;

  currentPits.push(pit);

  pit.bindPopup(() => {
    let cache: Geocache;
    if (caches.has(key)) {
        cache = new Geocache(i, j, caches.get(key));
        caches.set(key, cache.toMomento());
    } else {
      cache = new Geocache(i, j);
      caches.set(key, cache.toMomento());
    }

    let cacheCoins = cache.coins;
    const container = document.createElement("div");
    container.innerHTML = `
                <div>There is a pit here at "${i},${j}". It has value <span id="coins">${printCoinArray(
      cacheCoins
    )}</span>.</div>
                <button id="poke">poke</button><button id="deposit">deposit</button>`;
    const poke = container.querySelector<HTMLButtonElement>("#poke")!;
    poke.addEventListener("click", () => {
      let rv: Coin | boolean = cache.removeCoin()!;
      console.log(rv);
      if (!rv || rv == undefined) {
        return;
      }
      collectedCoins.push(rv);
      cacheCoins = cache.coins;
      container.querySelector<HTMLSpanElement>("#coins")!.innerHTML =
        printCoinArray(cacheCoins);
      points++;
      statusPanel.innerHTML = `${points} points accumulated`;
        caches.set(key, cache.toMomento());
    });
    const deposit = container.querySelector<HTMLButtonElement>("#deposit")!;
    deposit.addEventListener("click", () => {
      if (collectedCoins.length <= 0) {
        return;
      }
      cache.addCoin(collectedCoins.pop()!);
      cacheCoins = cache.coins;
      container.querySelector<HTMLSpanElement>("#coins")!.innerHTML =
        printCoinArray(cacheCoins);
      points--;
      statusPanel.innerHTML = `${points} points accumulated`;
        caches.set(key, cache.toMomento());
    });
    return container;
  });
  pit.addTo(map);
}

function coinToString(coin: Coin) {
  return `${coin.i}:${coin.j}#${coin.serial}`;
}

function printCoinArray(coinArray: Coin[]) {
  const concatenatedCoins = coinArray
    .map((coin) => coinToString(coin))
    .join(", ");
  return concatenatedCoins;
}

function movePlayer() {}

function updatePlayerLocation() {
  playerMarker.setLatLng(playerLocation);
  map.setView(playerMarker.getLatLng());
  generatePitsInRange();
}

function generateCellKey(cell: Cell): string {
    return `${cell.i}_${cell.j}`;
}