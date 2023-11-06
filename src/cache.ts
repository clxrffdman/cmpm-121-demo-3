import luck from "./luck";

export interface Coin {
  i: number;
  j: number;
  serial: number;
}

interface Momento<T> {
  toMomento(): T;
  fromMomento(momento: T): void;
}

export class Geocache implements Momento<string> {
  i: number;
  j: number;
  coins: Coin[];
  constructor(i: number, j: number, momento?: string) {
    if (momento) {
      this.i = i;
      this.j = j;
      this.coins = this.fromMomento(momento);
    } else {
      this.i = i;
      this.j = j;
      this.coins = this.generateCoins();
    }
  }

  toMomento() {
    return JSON.stringify(this.coins);
  }

  fromMomento(momento: string) {
    return JSON.parse(momento);
  }

  generateCoins() {
    let coins: Coin[] = [];
    let numCoins = Math.floor(
      luck([this.i, this.j, "initialValue"].toString()) * 10
    );

    for (let s = 0; s < numCoins; s++) {
      coins.push({ i: this.i, j: this.j, serial: s });
    }
    return coins;
  }

  addCoin(newCoin: Coin) {
    this.coins.push(newCoin);
  }

  removeCoin() {
    if (this.coins.length == 0) {
      return false;
    }

    let removedCoin = this.coins.pop();
    if (removedCoin) {
      return removedCoin;
    }
  }
}

// const geocacheA = new Geocache();
// geocacheA.numCoins = 100;
// const momento = geocacheA.toMomento();
// const geocacheB = new Geocache();
// geocacheB.fromMomento(momento);
// console.assert(geocacheA.numCoins == geocacheB.numCoins);
