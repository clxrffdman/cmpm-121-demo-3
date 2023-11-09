import leaflet from "leaflet";

export interface Cell {
  readonly i: number;
  readonly j: number;
}

export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownCells: Map<string, Cell>;

  constructor(tileWidth: number, tileVisibilityRadius: number) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map<string, Cell>();
  }

  private getCanonicalCell(cell: Cell): Cell {
    const { i, j } = cell;
    const key = [i, j].toString();

    if (!this.knownCells.has(key)) {
      this.knownCells.set(key, cell);
    }

    return this.knownCells.get(key)!;
  }

  getCellForPoint(point: leaflet.LatLng): Cell {
    let convertedI = Math.trunc(point.lat / this.tileWidth);
    let convertedJ = Math.trunc(point.lng / this.tileWidth);

    return this.getCanonicalCell({
      i: convertedI,
      j: convertedJ,
    });
  }

  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    return leaflet
      .latLng([cell.i * this.tileWidth, cell.j * this.tileWidth])
      .toBounds(9);
  }

  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);

    resultCells.push(originCell);
    for (
      let i = -this.tileVisibilityRadius + originCell.i;
      i < this.tileVisibilityRadius + originCell.i;
      i++
    ) {
      for (
        let j = -this.tileVisibilityRadius + originCell.j;
        j < this.tileVisibilityRadius + originCell.j;
        j++
      ) {
        resultCells.push(this.getCanonicalCell({ i: i, j: j }));
      }
    }

    return resultCells;
  }
}
