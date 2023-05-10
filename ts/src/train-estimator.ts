import {
  ApiException,
  DiscountCard,
  InvalidTripInputException,
  Passenger,
  TripRequest,
  fetchBaseTicketPriceException,
  TicketEstimationException,
} from "./model/trip.request";

export class TrainTicketEstimator {
  // Asynchronously fetch the base ticket price for a given train trip
  async fetchBaseTicketPrice(trainDetails: TripRequest): Promise<number> {
    try {
      // Make an API call with the required train details
      const response = await fetch(
        `https://sncftrenitaliadb.com/api/train/estimate/price?from=${
          trainDetails.details.from
        }&to=${
          trainDetails.details.to
        }&date=${trainDetails.details.when.toISOString()}`
      );

      // Check if the API call was successful
      if (!response.ok) {
        throw new Error("Failed to fetch ticket price");
      }

      // Parse the response JSON data
      const data = await response.json();
      // Check if the price data is present in the response
      if (data.price) {
        return data.price;
      } else {
        // If the price data is not present, throw an API error
        throw new ApiException("Api error");
      }
    } catch (error) {
      // If there's an error while fetching ticket price, throw a custom exception
      throw new fetchBaseTicketPriceException("Error fetching ticket price");
    }
  }

  // Validate the train trip details provided in the request
  validateTrainDetails(trainDetails: TripRequest): void {
    // Check if there are any passengers specified in the request
    if (trainDetails.passengers.length === 0) {
      throw new InvalidTripInputException("No passengers specified");
    }

    // Check if the starting city is valid
    if (trainDetails.details.from.trim().length === 0) {
      throw new InvalidTripInputException("Start city is invalid");
    }

    // Check if the destination city is valid
    if (trainDetails.details.to.trim().length === 0) {
      throw new InvalidTripInputException("Destination city is invalid");
    }

    // Get the current date and set it to midnight
    const currentDate = new Date();
    const todayMidnight = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      0,
      0,
      0
    );

    // Check if the travel date is valid (must be today or later)
    if (trainDetails.details.when < todayMidnight) {
      throw new InvalidTripInputException("Date is invalid");
    }
  }

  // Calculate the ticket price for each passenger in the trip request
  calculateTicketPriceForPassenger(
    baseTicketPrice: number,
    passengers: Passenger[],
    travelDate: Date
  ): number {
    // Get the current date and define constants for six hours and milliseconds in a day
    const currentDate = new Date();
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const MSTODAY = 1000 * 3600 * 24;

    // Iterate over the passengers array and calculate the ticket price for each passenger
    const ticketPrice = passengers.reduce((totalPrice, passenger) => {
      // Validate passenger age
      if (passenger.age < 0) {
        throw new InvalidTripInputException("Age is invalid");
      }

      // Initialize the passenger ticket price
      let passengerTicketPrice = 0;

      // Check if the passenger is eligible for a family discount
      const hasFamilyDiscount =
        passenger.discounts.includes(DiscountCard.Family) &&
        passenger.lastName &&
        passenger.lastName.trim().length > 0;

      if (hasFamilyDiscount) {
        // Filter passengers with the same last name
        const familyMembersWithSameLastName = passengers.filter(
          (p) => p.lastName === passenger.lastName
        );

        // Apply family discount if there are more than one family members with the same last name
        if (familyMembersWithSameLastName.length > 1) {
          passengerTicketPrice = baseTicketPrice * 0.7;
          return totalPrice + passengerTicketPrice;
        }
      }

      // Apply discounts based on passenger attributes and discounts
      if (passenger.discounts.includes(DiscountCard.TrainStrokeStaff)) {
        passengerTicketPrice = 1;
      } else if (passenger.age < 1) {
        passengerTicketPrice = 0;
      } else if (passenger.age > 0 && passenger.age < 4) {
        passengerTicketPrice = 9;
      } else if (passenger.age <= 17) {
        passengerTicketPrice = baseTicketPrice * 0.6;
      } else if (passenger.age >= 70) {
        passengerTicketPrice = baseTicketPrice * 0.8;
        if (passenger.discounts.includes(DiscountCard.Senior)) {
          passengerTicketPrice -= baseTicketPrice * 0.2;
        }
      } else {
        passengerTicketPrice = baseTicketPrice * 1.2;
      }

      // Apply time-based discounts
      if (travelDate.getTime() - currentDate.getTime() <= SIX_HOURS) {
        passengerTicketPrice *= 0.8;
      } else if (
        travelDate.getTime() >= currentDate.setDate(currentDate.getDate() + 30)
      ) {
        passengerTicketPrice -= baseTicketPrice * 0.2;
      } else if (
        travelDate.getTime() >
        currentDate.setDate(currentDate.getDate() - 30 + 5)
      ) {
        const diff = Math.abs(travelDate.getTime() - currentDate.getTime());
        const diffDays = Math.ceil(diff / MSTODAY);

        passengerTicketPrice += (20 - diffDays) * 0.02 * baseTicketPrice;
      } else {
        passengerTicketPrice += baseTicketPrice;
      }

      // Add the passenger ticket price to the total price
      return totalPrice + passengerTicketPrice;
    }, 0);

    return ticketPrice;
  }

  // Apply group discounts to the total price based on the passengers and their discount cards
  applyGroupDiscounts(
    totalPrice: number,
    baseTicketPrice: number,
    passengers: Passenger[]
  ): number {
    // Check if there's a couple discount and if no passengers are minors
    const hasCoupleDiscount =
      passengers.length === 2 &&
      passengers.some((passenger) =>
        passenger.discounts.includes(DiscountCard.Couple)
      );
    const hasHalfCoupleDiscount =
      passengers.length === 1 &&
      passengers.some((passenger) =>
        passenger.discounts.includes(DiscountCard.HalfCouple)
      );
    const hasMinor = passengers.some((passenger) => passenger.age < 18);

    // Apply the couple discount if conditions are met
    if (hasCoupleDiscount && !hasMinor) {
      totalPrice -= baseTicketPrice * 0.2 * 2;
    }

    // Apply the half-couple discount if conditions are met
    if (hasHalfCoupleDiscount && !hasMinor) {
      totalPrice -= baseTicketPrice * 0.1;
    }

    // Return the totalPrice with the applied discounts
    return totalPrice;
  }

  // Asynchronously estimate the total ticket price for the given train details
  async estimateTicketPrice(trainDetails: TripRequest): Promise<number> {
    try {
      // Validate the train details
      this.validateTrainDetails(trainDetails);

      // Fetch the base ticket price for the trip
      const baseTicketPrice: number = await this.fetchBaseTicketPrice(
        trainDetails
      );

      // Get the passengers array from the trainDetails object
      const passengers: Passenger[] = trainDetails.passengers;

      // Initialize the total price and calculate it for each passenger
      let totalPrice: number = 0;
      totalPrice = this.calculateTicketPriceForPassenger(
        baseTicketPrice,
        passengers,
        trainDetails.details.when
      );

      // Initialize the total price after applying group discounts
      let totalPriceAfterDiscount: number = 0;

      // Apply group discounts to the total price
      totalPriceAfterDiscount = this.applyGroupDiscounts(
        totalPrice,
        baseTicketPrice,
        passengers
      );

      // Return the total price after applying group discounts
      return totalPriceAfterDiscount;
    } catch (error) {
      // Throw an exception if there is an error estimating the ticket price
      throw new TicketEstimationException("Error estimating ticket price");
    }
  }
}
