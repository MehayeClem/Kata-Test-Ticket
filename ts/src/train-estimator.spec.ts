import {
  Passenger,
  TripDetails,
  TripRequest,
  InvalidTripInputException,
  DiscountCard,
} from "./model/trip.request";
import { TrainTicketEstimator } from "./train-estimator";

describe("TrainTicketEstimator - calulateTicketpriceForPassenger", () => {
  const trainTicketEstimator = new TrainTicketEstimator();
  const baseTicketPrice = 100;
  const travelDate = new Date(2023, 5, 10);
  test("Calcul des tickets pour une famille", () => {
    const passengers: Passenger[] = [
      {
        age: 24,
        lastName: "MEHAYE",
        discounts: [DiscountCard.Family],
      },
      {
        age: 30,
        lastName: "MEHAYE",
        discounts: [DiscountCard.Family],
      },
      {
        age: 30,
        lastName: "MEHAYE",
        discounts: [DiscountCard.Family],
      },
    ];

    const price = trainTicketEstimator.calculateTicketPriceForPassenger(
      baseTicketPrice,
      passengers,
      travelDate
    );
      
    expect(price).toEqual(baseTicketPrice * 0.7*passengers.length);
  });

  test("Calcul des tickets pour le staff de TrainStroke", () => {
    const passengers: Passenger[] = [
      {
        age: 40,
        lastName: "MEHAYE",
        discounts: [DiscountCard.TrainStrokeStaff],
      },
    ];
  
    const price = trainTicketEstimator.calculateTicketPriceForPassenger(
      baseTicketPrice,
      passengers,
      travelDate
    );
  
    expect(price).toEqual(1);
  });
 
  test("Calcul des tickets pour les personnes de moins de 1 an", () => {
    const passengers: Passenger[] = [
      {
        age: 0.8,
        lastName: "MEHAYE",
        discounts:[],
      },
    ];

    const price = trainTicketEstimator.calculateTicketPriceForPassenger(
      baseTicketPrice,
      passengers,
      travelDate
    );

    expect(price).toEqual(0);
  });

  test("Calcul des tickets pour les personnes de 4 ans ou moins ", () => {
    const passengers: Passenger[] = [
      {
        age: 3,
        lastName: "MEHAYE",
        discounts:[],
      },
    ];

    const price = trainTicketEstimator.calculateTicketPriceForPassenger(
      baseTicketPrice,
      passengers,
      travelDate
    );
    expect(price).toEqual(9);
  });

  test("Calcul des tickets pour les personnes de + de 3 ans et moins de 18ans 30 jours avant", () => {
    const passengers: Passenger[] = [
      {
        age: 15,
        lastName: "MEHAYE",
        discounts:[],
      },
    ];

    const price = trainTicketEstimator.calculateTicketPriceForPassenger(
      baseTicketPrice,
      passengers,
      travelDate
    )
    expect(price).toEqual(40);
  });

  test("Calcul des tickets pour les personnes de + de 70 ans sans carte de reduction 30 jours avant", () => {
    const passengers: Passenger[] = [
      {
        age: 75,
        lastName: "MEHAYE",
        discounts:[],
      },
    ];

    const price = trainTicketEstimator.calculateTicketPriceForPassenger(
      baseTicketPrice,
      passengers,
      travelDate
    );
    expect(price).toEqual(60);
  });

  test("Calcul des tickets pour les personnes de + de 70 ans avec carte de reduction 30 jours avant", () => {
    const passengers: Passenger[] = [
      {
        age: 75,
        lastName: "MEHAYE",
        discounts:[DiscountCard.Senior]
      },
    ];

    const price = trainTicketEstimator.calculateTicketPriceForPassenger(
      baseTicketPrice,
      passengers,
      travelDate
    );
    expect(price).toEqual(40);
  });

  test("Calcul des tickets pour les personnes entre 18 et 70ans 30 jours avant", () => {
    const passengers: Passenger[] = [
      {
        age: 30,
        lastName: "MEHAYE",
        discounts:[DiscountCard.Senior]
      },
    ];

    const travelDate = new Date()
    const price = trainTicketEstimator.calculateTicketPriceForPassenger(
      baseTicketPrice,
      passengers,
      travelDate
    );
      const expectedPrice = (baseTicketPrice *1.2)*0.8;
    expect(price).toEqual(expectedPrice);
  });
});

describe('TrainTicketEstimator - applyGroupDiscounts', () => {
  const baseTicketPrice = 100;
  const trainTicketEstimator = new TrainTicketEstimator();

  test('devrait appliquer une réduction pour couple lorsquil y a 2 passagers avec une carte de réduction pour couple', () => {
    const passengers: Passenger[] = [
      { lastName : "MEHAYE", age: 30, discounts: [DiscountCard.Couple] },
      { lastName : "MEHAYE", age: 28, discounts: [DiscountCard.Couple] },
    ];
    const totalPrice = baseTicketPrice * passengers.length;
    const expectedPrice = totalPrice - baseTicketPrice * 0.2 * 2;

    expect(trainTicketEstimator.applyGroupDiscounts(totalPrice, baseTicketPrice, passengers)).toBe(expectedPrice);
  });

  test('ne devrait pas appliquer la réduction de couple lorsquil y a un mineur', () => {
    const passengers: Passenger[] = [
      { lastName : "MEHAYE", age: 17, discounts: [DiscountCard.Couple] },
      { lastName : "MEHAYE", age: 28, discounts: [DiscountCard.Couple] },
    ];
    const totalPrice = baseTicketPrice * passengers.length;

    expect(trainTicketEstimator.applyGroupDiscounts(totalPrice, baseTicketPrice, passengers)).toBe(totalPrice);
  });

  test('devrait appliquer la réduction demi-couple lorsquil y a 1 passager avec une carte de réduction demi-couple', () => {
    const passengers: Passenger[] = [
      { lastName : "MEHAYE", age: 30, discounts: [DiscountCard.HalfCouple] },
    ];
    const totalPrice = baseTicketPrice * passengers.length;
    const expectedPrice = totalPrice - baseTicketPrice * 0.1;

    expect(trainTicketEstimator.applyGroupDiscounts(totalPrice, baseTicketPrice, passengers)).toBe(expectedPrice);
  });
});

describe("TrainTicketEstimator - validateTrainDetails", () => {
  test("Devrait être appelée et ne rien retourner si toutes les données sont correcte", () => {
    //Arrange
    const passengers: Passenger[] = [new Passenger(24, [], "Mehaye")];
    const details = new TripDetails(
      "Bordeaux",
      "Paris",
      new Date(2023, 10, 18)
    );
    const trip = new TripRequest(details, passengers);

    const trainTicketEstimator = new TrainTicketEstimator();
    trainTicketEstimator.validateTrainDetails = jest.fn();

    //Act
    trainTicketEstimator.validateTrainDetails(trip);

    //Assert
    expect(trainTicketEstimator.validateTrainDetails).toHaveBeenCalled();
  });

  test("Devrait retourner une erreur si le passager n'est pas valide", () => {
    // Arrange
    const passengers: Passenger[] = [];
    const details = new TripDetails(
      "Bordeaux",
      "Paris",
      new Date(2023, 10, 18)
    );
    const trip = new TripRequest(details, passengers);

    const trainTicketEstimator = new TrainTicketEstimator();

    //Act & Assert
    expect(() => {
      trainTicketEstimator.validateTrainDetails(trip);
    }).toThrowError(Error);
    expect(() => {
      trainTicketEstimator.validateTrainDetails(trip);
    }).toThrowError("No passengers specified");
  });

  test("Devrait retourner une erreur si la ville de départ n'est pas valide, ", () => {
    // Arrange
    const passengers: Passenger[] = [new Passenger(24, [], "Mehaye")];
    const details = new TripDetails("", "Paris", new Date(2023, 10, 18));
    const trip = new TripRequest(details, passengers);

    const trainTicketEstimator = new TrainTicketEstimator();

    //Act & Assert
    expect(() => {
      trainTicketEstimator.validateTrainDetails(trip);
    }).toThrowError(Error);
    expect(() => {
      trainTicketEstimator.validateTrainDetails(trip);
    }).toThrowError("Start city is invalid");
  });

  test("Devrait retourner une erreur si la ville d'arrivée n'est pas valide", () => {
    // Arrange
    const passengers: Passenger[] = [new Passenger(24, [], "Mehaye")];
    const details = new TripDetails("Bordeaux", "", new Date(2023, 10, 18));
    const trip = new TripRequest(details, passengers);

    const trainTicketEstimator = new TrainTicketEstimator();

    //Act & Assert
    expect(() => {
      trainTicketEstimator.validateTrainDetails(trip);
    }).toThrowError(Error);
    expect(() => {
      trainTicketEstimator.validateTrainDetails(trip);
    }).toThrowError("Destination city is invalid");
  });

  test("Devrait retourner une erreur si la date n'est pas valide", () => {
    // Arrange
    const passengers: Passenger[] = [new Passenger(24, [], "Mehaye")];
    const details = new TripDetails(
      "Bordeaux",
      "Paris",
      new Date(2018, 10, 18)
    );
    const trip = new TripRequest(details, passengers);

    const trainTicketEstimator = new TrainTicketEstimator();

    //Act & Assert
    expect(() => {
      trainTicketEstimator.validateTrainDetails(trip);
    }).toThrowError(Error);
    expect(() => {
      trainTicketEstimator.validateTrainDetails(trip);
    }).toThrowError("Date is invalid");
  });
});

describe("TrainTicketEstimator - fetchBaseTicketPrice", () => {
  test("Devrait retourner le prix du billet si l'appel à l'API fonctionne", async () => {
    //Arrange
    const passengers: Passenger[] = [new Passenger(24, [], "Mehaye")];
    const details = new TripDetails(
      "Paris",
      "Bordeaux",
      new Date(2023, 10, 15)
    );
    const trip = new TripRequest(details, passengers);
    const expectedPrice = 25;
    const trainTicketEstimator = new TrainTicketEstimator();

    const mockData: { price: number } = { price: expectedPrice };
    jest.spyOn(global, "fetch").mockImplementation(
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        }) as Promise<Response>
    );

    //Act
    const result = await trainTicketEstimator.fetchBaseTicketPrice(trip);

    //Assert
    expect(result).toBe(expectedPrice);
  });

  test("Devrait retourner une erreur si l'appel d'API ne fonctionne pas", async () => {
    //Arrange
    const passengers: Passenger[] = [new Passenger(24, [], "Mehaye")];
    const details = new TripDetails(
      "Paris",
      "Bordeaux",
      new Date(2023, 10, 15)
    );
    const trip = new TripRequest(details, passengers);
    const trainTicketEstimator = new TrainTicketEstimator();

    jest.spyOn(global, "fetch").mockImplementation(
      () =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}),
        }) as Promise<Response>
    );

    // Act & Assert
    await expect(
      trainTicketEstimator.fetchBaseTicketPrice(trip)
    ).rejects.toThrowError(Error);
    await expect(
      trainTicketEstimator.fetchBaseTicketPrice(trip)
    ).rejects.toThrowError("Failed to fetch ticket price");
  });
});

describe("TrainTicketEstimator - estimateTicketPrice", () => {
  test("Devrait retourner le total des prix des tickets des passagers avec la réduction couple", async () => {
    //Arrange
    const passengers: Passenger[] = [
      new Passenger(24, [DiscountCard.Couple], "Mehaye"),
      new Passenger(53, [DiscountCard.Couple], "Mehaye"),
    ];
    const details = new TripDetails("Bordeaux", "Paris", new Date(2023, 5, 10));
    const trip = new TripRequest(details, passengers);

    const expectedPrice = 100;
    const trainTicketEstimator = new TrainTicketEstimator();

    const mockData: { price: number } = { price: expectedPrice };
    jest.spyOn(global, "fetch").mockImplementation(
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        }) as Promise<Response>
    );

    //Act
    const result = await trainTicketEstimator.estimateTicketPrice(trip);

    //Assert
    expect(result).toBe(160);
  });

  test("Devrait retourner le total des prix des tickets des passagers sans réduction", async () => {
    //Arrange
    const passengers: Passenger[] = [
      new Passenger(24, [], "Mehaye"),
      new Passenger(53, [], "Mehaye"),
    ];
    const details = new TripDetails("Bordeaux", "Paris", new Date(2023, 5, 10));
    const trip = new TripRequest(details, passengers);

    const expectedPrice = 100;
    const trainTicketEstimator = new TrainTicketEstimator();

    const mockData: { price: number } = { price: expectedPrice };
    jest.spyOn(global, "fetch").mockImplementation(
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        }) as Promise<Response>
    );

    //Act
    const result = await trainTicketEstimator.estimateTicketPrice(trip);

    //Assert
    expect(result).toBe(200);
  });

  test("Devrait retourner le total des prix des tickets des passagers avec la réduction mi-couple", async () => {
    //Arrange
    const passengers: Passenger[] = [
      new Passenger(24, [DiscountCard.HalfCouple], "Mehaye"),
    ];
    const details = new TripDetails("Bordeaux", "Paris", new Date(2023, 5, 10));
    const trip = new TripRequest(details, passengers);

    const expectedPrice = 100;
    const trainTicketEstimator = new TrainTicketEstimator();

    const mockData: { price: number } = { price: expectedPrice };
    jest.spyOn(global, "fetch").mockImplementation(
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        }) as Promise<Response>
    );

    //Act
    const result = await trainTicketEstimator.estimateTicketPrice(trip);

    //Assert
    expect(result).toBe(90);
  });

  test("Devrait retourner une erreur si les données ne sont pas correct", async () => {
    //Arrange
    const passengers: Passenger[] = [new Passenger(24, [], "")];
    const details = new TripDetails("", "Paris", new Date(2023, 5, 10));
    const trip = new TripRequest(details, passengers);

    const expectedPrice = 100;
    const trainTicketEstimator = new TrainTicketEstimator();

    const mockData: { price: number } = { price: expectedPrice };
    jest.spyOn(global, "fetch").mockImplementation(
      () =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        }) as Promise<Response>
    );

    //Act & Assert
    await expect(
      trainTicketEstimator.estimateTicketPrice(trip)
    ).rejects.toThrow(Error);
    await expect(
      trainTicketEstimator.estimateTicketPrice(trip)
    ).rejects.toThrow("Error estimating ticket price");
  });
});

