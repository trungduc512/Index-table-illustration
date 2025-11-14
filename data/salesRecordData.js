import { faker } from "@faker-js/faker";

export const seedDataConfig = {
  countries: [
    "Vietnam",
    "Panama",
    "France",
    "Germany",
    "Thailand",
    "Brazil",
    "USA",
    "India",
    "China",
    "Japan",
    "South Korea",
    "Canada",
    "Mexico",
    "Argentina",
    "South Africa",
    "Nigeria",
    "Egypt",
    "Russia",
    "UK",
    "Italy",
    "Spain",
    "Australia",
    "New Zealand",
    "Saudi Arabia",
    "Turkey",
    "Sweden",
    "Norway",
    "Denmark",
    "Singapore",
    "Malaysia",
    "Indonesia",
    "Philippines",
    "Colombia",
    "Chile",
    "Peru",
    "Kenya",
    "Morocco",
    "Pakistan",
    "Bangladesh",
    "Poland",
    "Netherlands",
    "Belgium",
    "Switzerland",
    "Austria",
    "Greece",
    "Portugal",
    "Iceland",
    "Finland",
    "Ireland",
    "Czech Republic",
  ],

  regions: [
    "Asia",
    "Europe",
    "Sub-Saharan Africa",
    "Middle East and North Africa",
    "Central America and the Caribbean",
    "Australia and Oceania",
    "North America",
    "South America",
    "Eastern Europe",
    "Western Europe",
    "Southeast Asia",
    "South Asia",
    "Central Asia",
    "Scandinavia",
    "Pacific Islands",
    "Middle East",
    "Northern Africa",
    "Southern Africa",
    "Caribbean",
  ],

  itemTypes: [
    "Beverages",
    "Cosmetics",
    "Clothes",
    "Snacks",
    "Office Supplies",
    "Fruits",
    "Vegetables",
    "Cereal",
  ],

  salesChannels: ["Online", "Offline"],

  priorities: Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
};

export function createSalesRecord() {
  const { regions, countries, itemTypes, salesChannels, priorities } =
    seedDataConfig;

  const orderDate = faker.date.between({
    from: "2015-01-01",
    to: "2015-12-31",
  });
  const shipDate = new Date(
    orderDate.getTime() + Math.random() * 10 * 86400000
  );

  const unitsSold = faker.number.int({ min: 1, max: 10000 });
  const unitPrice = faker.number.float({ min: 10, max: 500, precision: 0.01 });
  const unitCost = faker.number.float({
    min: 5,
    max: unitPrice,
    precision: 0.01,
  });

  const totalRevenue = +(unitsSold * unitPrice).toFixed(2);
  const totalCost = +(unitsSold * unitCost).toFixed(2);
  const totalProfit = +(totalRevenue - totalCost).toFixed(2);

  return {
    region: faker.helpers.arrayElement(regions),
    country: faker.helpers.arrayElement(countries),
    itemType: faker.helpers.arrayElement(itemTypes),
    salesChannel: faker.helpers.arrayElement(salesChannels),
    orderPriority: faker.helpers.arrayElement(priorities),
    orderDate,
    orderId: faker.number.int({ min: 100000000, max: 999999999 }),
    shipDate,
    unitsSold,
    unitPrice,
    unitCost,
    totalRevenue,
    totalCost,
    totalProfit,
  };
}
