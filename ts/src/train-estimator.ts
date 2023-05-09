import {
  DiscountCard,
  InvalidTripInputException,
  Passenger,
  TripRequest,
} from "./model/trip.request";

export class TrainTicketEstimator {
  async fetchBaseTicketPrice(trainDetails: TripRequest): Promise<number> {
    try {
      const response = await fetch(
        `https://sncftrenitaliadb.com/api/train/estimate/price?from=${
          trainDetails.details.from
        }&to=${
          trainDetails.details.to
        }&date=${trainDetails.details.when.toISOString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch ticket price");
      }

      const data = await response.json();
      return data?.price ?? -1;
    } catch (error) {
      console.error("Error fetching ticket price:", error);
      return -1;
    }
  }

  validateTrainDetails(trainDetails: TripRequest): void {
    if (trainDetails.passengers.length === 0) {
      throw new InvalidTripInputException("No passengers specified");
    }

    if (trainDetails.details.from.trim().length === 0) {
      throw new InvalidTripInputException("Start city is invalid");
    }

    if (trainDetails.details.to.trim().length === 0) {
      throw new InvalidTripInputException("Destination city is invalid");
    }

    const currentDate = new Date();
    const todayMidnight = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      0,
      0,
      0
    );

    if (trainDetails.details.when < todayMidnight) {
      throw new InvalidTripInputException("Date is invalid");
    }
  }

  calculateTicketPriceForPassenger(
    baseTicketPrice: number,
    passengers: Passenger[],
    travelDate: Date
  ): number {
    let ticketPrice: number = 0;
    for (let passenger of passengers) {
      if (passenger.age < 0) {
        throw new InvalidTripInputException("Age is invalid");
      }

      if (passenger.age < 1) {
        ticketPrice = 0;
      } else if (passenger.age <= 17) {
        ticketPrice = baseTicketPrice * 0.6;
      } else if (passenger.age >= 70) {
        ticketPrice = baseTicketPrice * 0.8;
        if (passenger.discounts.includes(DiscountCard.Senior)) {
          ticketPrice -= baseTicketPrice * 0.2;
        }
      } else {
        ticketPrice = baseTicketPrice * 1.2;
      }

      const currentDate = new Date();
      if (
        travelDate.getTime() >= currentDate.setDate(currentDate.getDate() + 30)
      ) {
        ticketPrice -= baseTicketPrice * 0.2;
      } else if (
        travelDate.getTime() >
        currentDate.setDate(currentDate.getDate() - 30 + 5)
      ) {
        const diff = Math.abs(travelDate.getTime() - currentDate.getTime());
        const diffDays = Math.ceil(diff / (1000 * 3600 * 24));

        ticketPrice += (20 - diffDays) * 0.02 * baseTicketPrice;
      } else {
        ticketPrice += baseTicketPrice;
      }

      if (passenger.age > 0 && passenger.age < 4) {
        ticketPrice = 9;
      }

      if (passenger.discounts.includes(DiscountCard.TrainStroke)) {
        ticketPrice = 1;
      }
    }
    return ticketPrice;
  }

  applyGroupDiscounts(
    totalPrice: number,
    baseTicketPrice: number,
    passengers: Passenger[]
  ): number {
    let totalPriceAfterDiscount = totalPrice;

    function hasDiscount(
      passengers: Passenger[],
      discount: DiscountCard
    ): boolean {
      return passengers.some((passenger) =>
        passenger.discounts.includes(discount)
      );
    }

    function hasMinor(passengers: Passenger[]): boolean {
      return passengers.some((passenger) => passenger.age < 18);
    }

    if (passengers.length == 2) {
      const hasCoupleDiscount = hasDiscount(passengers, DiscountCard.Couple);
      const hasMinorDiscount = hasMinor(passengers);

      if (hasCoupleDiscount && !hasMinorDiscount) {
        totalPriceAfterDiscount -= baseTicketPrice * 0.2 * 2;
      }
    }

    if (passengers.length == 1) {
      const hasHalfCoupleDiscount = hasDiscount(
        passengers,
        DiscountCard.HalfCouple
      );
      const hasMinorDiscount = hasMinor(passengers);

      if (hasHalfCoupleDiscount && !hasMinorDiscount) {
        totalPriceAfterDiscount -= baseTicketPrice * 0.1;
      }
    }

    return totalPriceAfterDiscount;
  }

  async estimateTicketPrice(trainDetails: TripRequest): Promise<number> {
    this.validateTrainDetails;

    const baseTicketPrice: number = await this.fetchBaseTicketPrice(
      trainDetails
    );
    const passengers: Passenger[] = trainDetails.passengers;

    let totalPrice: number = 0;
    totalPrice = this.calculateTicketPriceForPassenger(
      baseTicketPrice,
      passengers,
      trainDetails.details.when
    );

    let totalPriceAfterDiscount: number = 0;
    totalPriceAfterDiscount = this.applyGroupDiscounts(
      totalPrice,
      baseTicketPrice,
      passengers
    );

    return totalPriceAfterDiscount;
  }
}
