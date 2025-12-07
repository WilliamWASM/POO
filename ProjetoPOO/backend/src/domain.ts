export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  DIRTY = 'DIRTY',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE'
}

// ============================================================================
// CLASSES DE QUARTO (Room, StandardRoom, LuxurySuite)
// ============================================================================

export abstract class Room {
  public reservedBy: number | null = null;

  constructor(
    public id: number,
    public number: string,
    public pricePerNight: number,
    public status: RoomStatus = RoomStatus.AVAILABLE,
    public description: string = ""
  ) {}

  abstract getBaseName(): string;
  
  getDescription(): string {
    if (this.description) {
      return `${this.getBaseName()} - ${this.description}`;
    }
    return this.getBaseName();
  }

  // --- Lógica de Estado ---

  reserve(guestId: number): void {
    if (this.status !== RoomStatus.AVAILABLE) {
      throw new Error(`O quarto ${this.number} não está disponível para reserva.`);
    }
    this.status = RoomStatus.RESERVED;
    this.reservedBy = guestId;
  }

  checkIn(): void {
    if (this.status !== RoomStatus.AVAILABLE && this.status !== RoomStatus.RESERVED) {
      throw new Error(`O quarto ${this.number} não está pronto para check-in (Status atual: ${this.status}).`);
    }
    this.status = RoomStatus.OCCUPIED;
    this.reservedBy = null;
  }

  checkOut(): void {
    if (this.status !== RoomStatus.OCCUPIED) {
      throw new Error(`O quarto ${this.number} não está ocupado.`);
    }
    this.status = RoomStatus.DIRTY; 
    this.reservedBy = null;
  }

  markAsClean(): void {
    if (this.status !== RoomStatus.DIRTY) {
      throw new Error(`O quarto ${this.number} não precisa de limpeza.`);
    }
    this.status = RoomStatus.AVAILABLE;
  }
}

export class StandardRoom extends Room {
  constructor(id: number, number: string, pricePerNight: number, status?: RoomStatus, description?:string) {
    super(id, number, pricePerNight, status, description);
  }
  getBaseName(): string { return `Quarto Standard #${this.number}`; }
}

export class LuxurySuite extends Room {
  constructor(id: number,number: string,pricePerNight: number,public hasJacuzzi: boolean,public hasOceanView: boolean,status?: RoomStatus,description?:string) {
    super(id, number, pricePerNight, status, description);
  }
  
  getBaseName(): string {
    const extras = [];
    if (this.hasJacuzzi) extras.push("com Jacuzzi");
    if (this.hasOceanView) extras.push("e Vista para o Mar");
    return `Suíte Luxo #${this.number} ${extras.join(' ')}`; 
  }
}

// ============================================================================
// HÓSPEDE (Guest)
// ============================================================================

export class Guest {
  constructor(
    public id: number,
    public name: string,
    public email: string,
    public document: string,
    public password?: string
  ) {}
}

// ============================================================================
// RESERVA (Reservation)
// ============================================================================

export class Reservation {
  id: number;
  active: boolean = true;

  constructor(
    public guest: Guest,
    public room: Room,
    public checkInDate: Date,
    public checkOutDate: Date,
    id?: number
  ) {
    this.id = id || 0;
    if (this.checkOutDate <= this.checkInDate) {
      throw new Error("Data de check-out deve ser posterior ao check-in.");
    }
  }

  calculateTotalNights(): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffTime = Math.abs(this.checkOutDate.getTime() - this.checkInDate.getTime());
    return Math.ceil(diffTime / oneDay);
  }

  calculateTotalPrice(): number {
    return this.calculateTotalNights() * this.room.pricePerNight;
  }

  cancel(): void {
    this.active = false;
  }
}

// ============================================================================
// USUÁRIO DO SISTEMA (User/Admin)
// ============================================================================

export class User {
  id: number;
  password?: string;
  
  constructor(public name: string, public email: string, password?: string) {
    this.id = 0; 
    this.password = password;
  }
}