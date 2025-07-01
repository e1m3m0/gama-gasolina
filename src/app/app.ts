import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface GasType {
  name: string;
  shortName: string;
}

interface PumpGasData {
  gasType: string;
  price: number;
  beginningVolume: number;
  endingVolume: number;
  volumeDispensed: number; // Changed from volumeUsed
  cost: number;
}

interface Pump {
  id: number;
  name: string;
  gasData: PumpGasData[];
  // creditCardSales: number; // New property for credit card sales
}


@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'gama-gasolina';

  saveButtonText: string = 'Save Prices';
  selectedPumpId: number = 1;
  creditCardSales: number = 0;
  cashDue: number = 0;

  // totalCreditCardSales: number = 0;

  gasTypes: GasType[] = [
    { name: 'Gasolina Premium', shortName: 'Premium' },
    { name: 'Gasolina Regular', shortName: 'Regular' },
    { name: 'Diesel Optimo', shortName: 'Optimo' },
    { name: 'Diesel Regular', shortName: 'Diesel' }
  ];

  globalPrices: { [key: string]: number } = {
    'Gasolina Premium': 0,
    'Gasolina Regular': 0,
    'Diesel Optimo': 0,
    'Diesel Regular': 0
  };

  pumps: Pump[] = [];

  ngOnInit(): void {
    this.initializePumps();
    this.loadSavedPrices();
  }

  initializePumps(): void {

    let names=[
      "Metro No. 1 lado 1",
      "Metro No. 1 lado 2",
      "Metro No. 2 lado 1",
      "Metro No. 2 lado 2",
      "Metro No. 3 lado 1",
      "Metro No. 3 lado 2",
      "Metro No. 4 lado 1",
      "Metro No. 4 lado 2",
    ]
    for (let i = 0; i < names.length; i++) {
      const pump: Pump = {
        id: i,
        name: names[i],
        // creditCardSales: 0,
        gasData: this.gasTypes.map(gasType => ({
          gasType: gasType.name,
          price: 0,
          beginningVolume: 0,
          endingVolume: 0,
          volumeDispensed: 0, // Changed from volumeUsed
          cost: 0
        }))
      };
      this.pumps.push(pump);
    }
  }

  get selectedPump(): Pump | undefined {
    return this.pumps.find(pump => pump.id === this.selectedPumpId);
  }

  selectPump(pumpId: number): void {
    this.selectedPumpId = pumpId;
  }

  getGasTypeByName(name: string): GasType | undefined {
    return this.gasTypes.find(gasType => gasType.name === name);
  }

  loadSavedPrices(): void {
    try {
      const savedPrices = localStorage.getItem('globalGasPrices');
      if (savedPrices) {
        const prices = JSON.parse(savedPrices);
        this.globalPrices = { ...this.globalPrices, ...prices };
        this.updateAllPumpPricesFromGlobal();
      }
    } catch (error) {
      console.log('Local storage not available - using default prices');
    }
  }

  savePrices(): void {
    try {
      localStorage.setItem('globalGasPrices', JSON.stringify(this.globalPrices));
      this.saveButtonText = 'Saved!';
      
      setTimeout(() => {
        this.saveButtonText = 'Save Prices';
      }, 2000);
    } catch (error) {
      console.log('Local storage not available - prices saved in session only');
      this.saveButtonText = 'Session Only';
      
      setTimeout(() => {
        this.saveButtonText = 'Save Prices';
      }, 2000);
    }
  }

 updateAllPumpPrices(gasTypeName: string): void {
    this.pumps.forEach(pump => {
      const gasData = pump.gasData.find(data => data.gasType === gasTypeName);
      if (gasData) {
        gasData.price = this.globalPrices[gasTypeName];
        this.calculateCost(pump.id, pump.gasData.indexOf(gasData));
      }
    });
  }

  updateAllPumpPricesFromGlobal(): void {
    this.gasTypes.forEach(gasType => {
      this.updateAllPumpPrices(gasType.name);
    });
  }

  // Updated calculation for dispensed volume (ending - beginning)
  calculateCost(pumpId: number, gasIndex: number): void {
    const pump = this.pumps.find(p => p.id === pumpId);
    if (!pump) return;

    const gasData = pump.gasData[gasIndex];
    // Changed calculation: dispensed = ending - beginning (positive when gas is dispensed)
    gasData.volumeDispensed = Math.max(0, gasData.endingVolume - gasData.beginningVolume);
    gasData.cost = gasData.volumeDispensed * gasData.price;
  }

  // Updated to use volumeDispensed
  getPumpTotalVolume(pumpId: number): number {
    const pump = this.pumps.find(p => p.id === pumpId);
    return pump ? pump.gasData.reduce((total, gas) => total + gas.volumeDispensed, 0) : 0;
  }

  getPumpTotalCost(pumpId: number): number {
    const pump = this.pumps.find(p => p.id === pumpId);
    return pump ? pump.gasData.reduce((total, gas) => total + gas.cost, 0) : 0;
  }

  getGrandTotalVolume(): number {
    return this.pumps.reduce((total, pump) => total + this.getPumpTotalVolume(pump.id), 0);
  }

  getGrandTotalCost(): number {
    return this.pumps.reduce((total, pump) => total + this.getPumpTotalCost(pump.id), 0);
  }


  // New function to get cash amount due (total cost - credit card sales)
  getCashAmountDue(): number {
    return this.cashDue =Math.max(0, this.getGrandTotalCost() - this.creditCardSales);
  }

  // Updated reset functions to include credit card sales and volumeDispensed
  resetSelectedPump(): void {
    if (!this.selectedPump) return;
    
    this.selectedPump.gasData.forEach(gasData => {
      gasData.beginningVolume = 0;
      gasData.endingVolume = 0;
      gasData.volumeDispensed = 0; // Changed from volumeUsed
      gasData.cost = 0;
    });
   

  }

  resetAllPumps(): void {
    this.pumps.forEach(pump => {
      pump.gasData.forEach(gasData => {
        gasData.beginningVolume = 0;
        gasData.endingVolume = 0;
        gasData.volumeDispensed = 0; // Changed from volumeUsed
        gasData.cost = 0;
      });
      this.creditCardSales = 0; // Reset credit card sales
      this.cashDue = 0; // Reset cash due
    });
    
    
  }

  // New function to reset only credit card sales
  resetCreditCardSales(): void {

    this.creditCardSales = 0;
  }
}
