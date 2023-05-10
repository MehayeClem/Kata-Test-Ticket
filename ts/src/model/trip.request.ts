export class Passenger {
  constructor(
    readonly age: number,
    readonly discounts: DiscountCard[],
    readonly lastName: string
  ) {}
}

export class TripRequest {
  constructor(
    readonly details: TripDetails,
    readonly passengers: Passenger[]
  ) {}
}

export class TripDetails {
  constructor(
    readonly from: string,
    readonly to: string,
    readonly when: Date
  ) {}
}

export class InvalidTripInputException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class fetchBaseTicketPriceException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class TicketEstimationException extends Error {
  constructor(message: string) {
    super(message);
  }
}
export class ApiException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export enum DiscountCard {
  Senior = "Senior",
  TrainStrokeStaff = "TrainStroke",
  Couple = "Couple",
  HalfCouple = "HalfCouple",
  Family = "Family",
}
